import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET, normalizeUploaded, UPLOAD_EXT } from "@/lib/server/media";
import { listarArquivos, MAX_ARQUIVOS } from "@/lib/server/arquivos";

// POST /api/mercado/arquivos { marketId, fileName }: URL assinada para enviar uma imagem.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const ext = String(body.fileName ?? "").toLowerCase().match(UPLOAD_EXT)?.[1];
  if (!ext) return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP." }, { status: 400 });
  if ((await listarArquivos(body.marketId as string)).length >= MAX_ARQUIVOS) {
    return NextResponse.json({ error: `Você já tem ${MAX_ARQUIVOS} arquivos. Apague algum para enviar outro.` }, { status: 400 });
  }
  const admin = createAdminClient();
  const path = `${body.marketId}/arquivos/envio-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return serverError("arquivos/url", error, "Não consegui preparar o envio. Tente de novo.");
  return NextResponse.json({ path: data.path, token: data.token });
}

// PUT /api/mercado/arquivos { marketId, path }: confirma o envio e deixa a imagem pronta para usar.
export async function PUT(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const path = String(body.path ?? "");
  if (!new RegExp(`^${body.marketId}/arquivos/envio-[a-f0-9]{8}\\.(png|jpe?g|webp|gif|avif)$`, "i").test(path)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie de novo." }, { status: 400 });
  }
  try {
    const stored = await normalizeUploaded(createAdminClient(), path, { keepAlpha: true, maxSize: 2400 });
    return NextResponse.json({ url: stored.url, path: stored.path });
  } catch (err) {
    return serverError("arquivos/confirmar", err, "Não consegui usar essa imagem. Tente outro arquivo.");
  }
}

// DELETE /api/mercado/arquivos { marketId, path }: apaga uma imagem do mercado.
export async function DELETE(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const path = String(body.path ?? "");
  if (!new RegExp(`^${body.marketId}/arquivos/[A-Za-z0-9._-]{1,80}$`).test(path)) return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  const { error } = await createAdminClient().storage.from(MEDIA_BUCKET).remove([path]);
  if (error) return serverError("arquivos/apagar", error, "Não consegui apagar.");
  return NextResponse.json({ ok: true });
}
