import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerEncarte } from "@/lib/competition/ler-encarte";

export const maxDuration = 120;

const IMG = /\.(jpe?g|png|webp|heic|heif)$/i;

// POST { marketId, acao: "envio", fileName } -> URL assinada para a foto
// POST { marketId, acao: "ler", path, competitorId?, competitorName? } -> lê, casa e grava
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  const admin = createAdminClient();

  if (body.acao === "envio") {
    const ext = String(body.fileName ?? "").toLowerCase().match(IMG)?.[1];
    if (!ext) return NextResponse.json({ error: "Envie uma foto ou print do encarte (JPG, PNG ou WebP)." }, { status: 400 });
    const path = `${marketId}/concorrente-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext === "jpeg" ? "jpg" : ext}`;
    const { data, error } = await admin.storage.from("imports").createSignedUploadUrl(path);
    if (error || !data) return serverError("concorrencia/envio", error, "Não consegui preparar o envio.");
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (body.acao !== "ler") return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  const path = String(body.path ?? "");
  if (!new RegExp(`^${marketId}/concorrente-\\d+-[a-f0-9]{8}\\.(jpg|png|webp|heic|heif)$`).test(path)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie a foto de novo." }, { status: 400 });
  }
  const file = await admin.storage.from("imports").download(path);
  await admin.storage.from("imports").remove([path]);
  if (file.error || !file.data) return NextResponse.json({ error: "Não consegui buscar a foto. Envie de novo." }, { status: 400 });

  const r = await lerEncarte({ marketId, userId: access.viewer.userId, image: Buffer.from(await file.data.arrayBuffer()), competitorId: body.competitorId, competitorName: String(body.competitorName ?? "") });
  if (!r.ok) {
    if (r.log) return serverError("concorrencia/ler", r.log, r.error);
    return NextResponse.json({ error: r.error }, { status: r.status });
  }
  return NextResponse.json({ items: r.items, matched: r.matched, competitor: r.competitor });
}
