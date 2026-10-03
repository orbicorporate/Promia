import { NextResponse } from "next/server";
import { readJson, serverError } from "@/lib/auth";
import { MEDIA_BUCKET, normalizeUploaded, storeImageFromUrl, UPLOAD_EXT } from "@/lib/server/media";
import { rememberInBank } from "@/lib/server/photos";
import { loadOwnedProduct } from "@/lib/server/product-access";

export const maxDuration = 60;

// POST /api/produtos/{id}/foto
//   { acao: "url", url }        usar a foto deste endereço (ou uma candidata)
//   { acao: "envio", fileName } URL assinada para subir foto do celular
//   { acao: "confirmar", path } aplica a foto que acabou de subir
//   { acao: "buscar" }          devolve o produto para a fila de busca
//   { acao: "sem-foto" }        marca que esse produto vai sem foto
// Foto escolhida pelo dono entra no banco compartilhado pelo código de barras.
export async function POST(req: Request, { params }: RouteContext<"/api/produtos/[id]/foto">) {
  const { id } = await params;
  const g = await loadOwnedProduct(id);
  if ("error" in g) return g.error;
  const { admin, product } = g;
  const body = await readJson(req);
  const base = `${product.market_id}/produtos/${product.id}`;

  const apply = async (url: string, path: string | null, origin: "url" | "upload") => {
    const { error } = await admin
      .from("products")
      .update({ image_url: url, image_status: "encontrada", image_origin: origin, image_candidates: null, image_claimed_at: null })
      .eq("id", id);
    if (error) return serverError("foto", error, "Não consegui salvar a foto.");
    if (product.ean) await rememberInBank(admin, product.ean, url, path, origin === "upload" ? "envio" : "aprovada");
    return NextResponse.json({ imageUrl: url });
  };

  switch (body.acao) {
    case "url": {
      const url = String(body.url ?? "").trim();
      if (!/^https:\/\//i.test(url)) return NextResponse.json({ error: "Use um endereço que comece com https://" }, { status: 400 });
      const stored = await storeImageFromUrl(admin, base, url);
      if (!stored) {
        return NextResponse.json(
          { error: "Esse endereço não abriu uma imagem. Abra a foto no navegador, toque e segure nela, copie o endereço da imagem e cole aqui." },
          { status: 422 }
        );
      }
      return apply(stored.url, stored.path, "url");
    }
    case "envio": {
      const ext = String(body.fileName ?? "").toLowerCase().match(UPLOAD_EXT)?.[1];
      if (!ext) return NextResponse.json({ error: "Envie uma foto JPG, PNG ou WebP." }, { status: 400 });
      const path = `${base}-envio-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const { data, error } = await admin.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
      if (error || !data) return serverError("foto/envio", error, "Não consegui preparar o envio.");
      return NextResponse.json({ path: data.path, token: data.token });
    }
    case "confirmar": {
      const path = String(body.path ?? "");
      if (!new RegExp(`^${base}-envio-[a-f0-9]{8}\\.(png|jpe?g|webp|gif|avif)$`, "i").test(path)) {
        return NextResponse.json({ error: "Arquivo inválido. Envie de novo." }, { status: 400 });
      }
      try {
        const stored = await normalizeUploaded(admin, path);
        return apply(stored.url, stored.path, "upload");
      } catch (err) {
        return serverError("foto/confirmar", err, "Não consegui usar essa foto. Tente outra.");
      }
    }
    case "buscar": {
      const { error } = await admin
        .from("products")
        .update({ image_status: "pendente", image_claimed_at: null, image_candidates: null })
        .eq("id", id);
      if (error) return serverError("foto/buscar", error, "Não consegui colocar na fila.");
      return NextResponse.json({ ok: true });
    }
    case "sem-foto": {
      const { error } = await admin
        .from("products")
        .update({ image_status: "nao_encontrada", image_url: null, image_origin: null, image_candidates: null })
        .eq("id", id);
      if (error) return serverError("foto/sem", error, "Não consegui salvar.");
      return NextResponse.json({ ok: true });
    }
    default:
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }
}
