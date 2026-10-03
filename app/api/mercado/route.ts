import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/lib/supabase/database.types";

const HEX = /^#[0-9a-f]{6}$/i;

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

// PATCH /api/mercado: identidade e contatos que aparecem no encarte.
// Só os campos enviados são alterados.
export async function PATCH(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;

  const update: Record<string, string | null> = {};
  const fields: [string, string, number][] = [
    ["name", "name", 80],
    ["tagline", "tagline", 80],
    ["address", "address", 120],
    ["city", "city", 60],
    ["phone", "phone", 30],
    ["openingHours", "opening_hours", 80],
    ["legalNote", "legal_note", 240],
    ["niche", "niche", 80],
  ];
  for (const [key, column, max] of fields) {
    if (key in body) update[column] = text(body[key], max);
  }
  if ("name" in body && !update.name) return NextResponse.json({ error: "O mercado precisa de um nome." }, { status: 400 });
  if ("whatsapp" in body) {
    const digits = String(body.whatsapp ?? "").replace(/\D/g, "");
    if (digits && (digits.length < 10 || digits.length > 13)) {
      return NextResponse.json({ error: "WhatsApp inválido. Use DDD e número, ex. (15) 99876-5432." }, { status: 400 });
    }
    update.whatsapp = text(body.whatsapp, 30);
  }
  if ("instagram" in body) {
    const ig = text(body.instagram, 40)?.replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");
    update.instagram = ig ? `@${ig}` : null;
  }
  for (const [key, column] of [["colorPrimary", "color_primary"], ["colorSecondary", "color_secondary"]] as const) {
    if (key in body) {
      const v = body[key];
      if (v != null && v !== "" && (typeof v !== "string" || !HEX.test(v))) {
        return NextResponse.json({ error: "Cor inválida." }, { status: 400 });
      }
      update[column] = (v as string) || null;
    }
  }
  if (body.removeLogo === true) update.logo_url = null;
  if (body.onboarded === true) update.onboarded_at = new Date().toISOString();
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: true });

  const admin = createAdminClient();
  const { error } = await admin.from("markets").update(update as TablesUpdate<"markets">).eq("id", body.marketId as string);
  if (error) return serverError("mercado", error, "Não consegui salvar. Tente de novo.");
  return NextResponse.json({ ok: true });
}
