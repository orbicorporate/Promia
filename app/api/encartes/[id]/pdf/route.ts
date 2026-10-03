import { PDFDocument } from "pdf-lib";
import { contentDisposition, jsonError, loadAuthorizedEncarte, NO_STORE, pdfFileName } from "@/lib/encarte/http";
import { pdfPageSize } from "@/lib/encarte/formats";
import { createImageCache, resolveEncarteImages } from "@/lib/encarte/images";
import { pageCount } from "@/lib/encarte/paginate";
import { renderEncartePng } from "@/lib/encarte/png";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/encartes/{id}/pdf
// PDF com todas as páginas (cada página é o PNG renderizado). Formato a4
// sai em A4 de verdade; os outros, na proporção do formato com a largura
// de um A4.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data } = auth.loaded;

  try {
    // as fotos são buscadas uma vez só para o documento inteiro
    const withImages = await resolveEncarteImages(data, { cache: createImageCache(), budgetMs: 15000 });
    const total = pageCount(withImages);
    const size = pdfPageSize(data.format);
    const pdf = await PDFDocument.create();
    pdf.setTitle(data.name);
    pdf.setAuthor(data.market.name);
    pdf.setCreator("Promia");
    pdf.setProducer("Promia");
    for (let i = 0; i < total; i++) {
      const out = await renderEncartePng(withImages, i);
      if (!out) break;
      const image = await pdf.embedPng(out.png);
      const page = pdf.addPage([size.width, size.height]);
      page.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
    }
    const bytes = await pdf.save();
    return new Response(bytes as BodyInit, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-length": String(bytes.byteLength),
        "content-disposition": contentDisposition("attachment", pdfFileName(data.name)),
        "cache-control": NO_STORE,
        "x-encarte-paginas": String(total),
      },
    });
  } catch (err) {
    console.error("[encarte] pdf", err);
    return jsonError(500, "Não consegui gerar o PDF agora. Tente de novo.");
  }
}
