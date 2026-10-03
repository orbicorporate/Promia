import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET, normalizeUploaded, UPLOAD_EXT } from "@/lib/server/media";

// POST /api/mercado/logo { marketId, fileName }: URL assinada para subir o logo.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const ext = String(body.fileName ?? "").toLowerCase().match(UPLOAD_EXT)?.[1];
  if (!ext) return NextResponse.json({ error: "Envie uma imagem PNG, JPG ou WebP." }, { status: 400 });
  const admin = createAdminClient();
  const path = `${body.marketId}/logo/envio-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return serverError("logo/url", error, "Não consegui preparar o envio. Tente de novo.");
  return NextResponse.json({ path: data.path, token: data.token });
}

// PUT /api/mercado/logo { marketId, path }: confirma o envio e aplica o logo.
export async function PUT(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const path = String(body.path ?? "");
  if (!new RegExp(`^${body.marketId}/logo/envio-[a-f0-9]{8}\\.(png|jpe?g|webp|gif|avif)$`, "i").test(path)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie de novo." }, { status: 400 });
  }
  const admin = createAdminClient();
  try {
    const stored = await normalizeUploaded(admin, path, { keepAlpha: true, maxSize: 800 });
    const { error } = await admin.from("markets").update({ logo_url: stored.url }).eq("id", body.marketId as string);
    if (error) throw error;
    return NextResponse.json({ url: stored.url });
  } catch (err) {
    return serverError("logo", err, "Não consegui usar essa imagem. Tente outro arquivo.");
  }
}
