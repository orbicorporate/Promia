import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEncarteInput } from "@/lib/server/encarte-input";
import { saveItems } from "@/lib/server/encarte-save";

// POST /api/encartes: cria um encarte com os produtos escolhidos.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const parsed = parseEncarteInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: tabloid, error } = await admin
    .from("tabloids")
    .insert({
      market_id: marketId,
      name: input.name,
      headline: input.headline,
      subheadline: input.subheadline,
      format: input.format,
      layout: input.layout,
      modelo: input.modelo,
      theme_key: input.themeKey,
      valid_from: input.validFrom,
      valid_until: input.validUntil,
      status: "pronto",
      created_by: access.viewer.userId,
    })
    .select("id")
    .single();
  if (error || !tabloid) return serverError("encartes/criar", error, "Não consegui salvar o encarte. Tente de novo.");

  const saved = await saveItems(admin, marketId, tabloid.id, input.items);
  if (!saved.ok) {
    await admin.from("tabloids").delete().eq("id", tabloid.id);
    return NextResponse.json({ error: saved.error }, { status: saved.status });
  }
  return NextResponse.json({ id: tabloid.id });
}
