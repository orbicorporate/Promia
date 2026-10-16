import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
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
const MM = 72 / 25.4;
const SANGRIA = 3 * MM; // 3 mm de sangria em volta do corte
const SOBRA = 9 * MM; // faixa extra fora da sangria, onde ficam as marcas de corte

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // ?grafica=1: arquivo para impressão, com sangria e marcas de corte
  const grafica = new URL(req.url).searchParams.get("grafica") === "1";
  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data } = auth.loaded;

  try {
    // as fotos são buscadas uma vez só para o documento inteiro
    const withImages = await resolveEncarteImages(data, { cache: createImageCache(), budgetMs: 15000, ilustrar: true });
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
      if (!grafica) {
        const image = await pdf.embedPng(out.png);
        const page = pdf.addPage([size.width, size.height]);
        page.drawImage(image, { x: 0, y: 0, width: size.width, height: size.height });
        continue;
      }
      // a arte não tem sangria própria: estende as bordas espelhando os pixels
      const bleedPx = Math.round((SANGRIA * out.width) / size.width);
      const ext = await sharp(Buffer.from(out.png)).extend({ top: bleedPx, bottom: bleedPx, left: bleedPx, right: bleedPx, extendWith: "mirror" }).png().toBuffer();
      const image = await pdf.embedPng(ext);
      const margem = SANGRIA + SOBRA;
      const page = pdf.addPage([size.width + margem * 2, size.height + margem * 2]);
      page.drawImage(image, { x: SOBRA, y: SOBRA, width: size.width + SANGRIA * 2, height: size.height + SANGRIA * 2 });
      page.setTrimBox(margem, margem, size.width, size.height);
      page.setBleedBox(SOBRA, SOBRA, size.width + SANGRIA * 2, size.height + SANGRIA * 2);
      // marcas de corte: começam depois da sangria e vão até a borda da página
      const tl = SOBRA - 2 * MM;
      const off = SANGRIA + 1 * MM;
      const x0 = margem, x1 = margem + size.width, y0 = margem, y1 = margem + size.height;
      const linha = (xa: number, ya: number, xb: number, yb: number) => page.drawLine({ start: { x: xa, y: ya }, end: { x: xb, y: yb }, thickness: 0.35, color: rgb(0, 0, 0) });
      for (const x of [x0, x1]) {
        linha(x, y0 - off, x, y0 - off - tl);
        linha(x, y1 + off, x, y1 + off + tl);
      }
      for (const y of [y0, y1]) {
        linha(x0 - off, y, x0 - off - tl, y);
        linha(x1 + off, y, x1 + off + tl, y);
      }
    }
    const bytes = await pdf.save();
    return new Response(bytes as BodyInit, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-length": String(bytes.byteLength),
        "content-disposition": contentDisposition("attachment", grafica ? pdfFileName(`${data.name}-grafica`) : pdfFileName(data.name)),
        "cache-control": NO_STORE,
        "x-encarte-paginas": String(total),
      },
    });
  } catch (err) {
    console.error("[encarte] pdf", err);
    return jsonError(500, "Não consegui gerar o PDF agora. Tente de novo.");
  }
}
