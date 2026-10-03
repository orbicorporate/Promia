import type { NextRequest } from "next/server";
import { jsonError, loadAuthorizedEncarte, pageFileName, parsePageParam, pngResponse } from "@/lib/encarte/http";
import { resolveEncarteImages } from "@/lib/encarte/images";
import { pageCount } from "@/lib/encarte/paginate";
import { renderEncartePng } from "@/lib/encarte/png";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/encartes/{id}/imagem?pagina=1[&download=1]
// PNG de uma página do encarte salvo (no tamanho do formato dele).
// Cabeçalhos x-encarte-pagina / x-encarte-paginas dizem onde se está.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pageIndex = parsePageParam(req.nextUrl.searchParams.get("pagina"));
  if (pageIndex == null) return jsonError(400, "Página inválida.");

  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data, skippedWithoutPrice } = auth.loaded;

  const total = pageCount(data);
  if (pageIndex >= total) return jsonError(404, `Esse encarte tem ${total} página${total > 1 ? "s" : ""}.`);

  try {
    const withImages = await resolveEncarteImages(data, { pageIndex });
    const out = await renderEncartePng(withImages, pageIndex);
    if (!out) return jsonError(404, "Página não encontrada.");
    return pngResponse(out.png, {
      fileName: pageFileName(data.name, pageIndex + 1),
      download: req.nextUrl.searchParams.get("download") === "1",
      pageIndex: out.pageIndex,
      pageCount: out.pageCount,
      extraHeaders: { "x-encarte-ignorados": String(skippedWithoutPrice) },
    });
  } catch (err) {
    console.error("[encarte] imagem", err);
    return jsonError(500, "Não consegui desenhar o encarte agora. Tente de novo.");
  }
}
