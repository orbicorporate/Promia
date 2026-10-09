import { NextResponse } from "next/server";
import { canAccessMarket, getViewer, isUuid, readJson, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseEncarteInput } from "@/lib/server/encarte-input";
import { saveItems } from "@/lib/server/encarte-save";

async function guard(id: string) {
  if (!isUuid(id)) return { error: NextResponse.json({ error: "Encarte não encontrado." }, { status: 404 }) };
  const who = await getViewer();
  if (who.status !== "ok") return { error: NextResponse.json({ error: "Sua sessão expirou. Entre de novo." }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: tabloid } = await admin.from("tabloids").select("id, market_id").eq("id", id).maybeSingle();
  if (!tabloid || !canAccessMarket(who.viewer, tabloid.market_id)) {
    return { error: NextResponse.json({ error: "Encarte não encontrado." }, { status: 404 }) };
  }
  return { admin, tabloid };
}

// PUT /api/encartes/{id}: salva as alterações (dados e produtos).
export async function PUT(req: Request, { params }: RouteContext<"/api/encartes/[id]">) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const parsed = parseEncarteInput(await readJson(req));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;

  const { error } = await g.admin
    .from("tabloids")
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return serverError("encartes/editar", error, "Não consegui salvar as alterações. Tente de novo.");

  const saved = await saveItems(g.admin, g.tabloid.market_id, id, input.items);
  if (!saved.ok) return NextResponse.json({ error: saved.error }, { status: saved.status });
  return NextResponse.json({ id });
}

// DELETE /api/encartes/{id}
export async function DELETE(_req: Request, { params }: RouteContext<"/api/encartes/[id]">) {
  const { id } = await params;
  const g = await guard(id);
  if ("error" in g) return g.error;
  const { error } = await g.admin.from("tabloids").delete().eq("id", id);
  if (error) return serverError("encartes/apagar", error, "Não consegui apagar o encarte. Tente de novo.");
  return NextResponse.json({ ok: true });
}
