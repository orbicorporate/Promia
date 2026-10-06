import { ImageResponse } from "next/og";
import { PDFDocument } from "pdf-lib";
import { contentDisposition, jsonError, loadAuthorizedEncarte, NO_STORE } from "@/lib/encarte/http";
import { createImageCache, resolveEncarteImages } from "@/lib/encarte/images";
import { loadEncarteFonts } from "@/lib/encarte/fonts";
import { POSTER_SIZE, renderPoster } from "@/lib/encarte/poster";
import { orderItems } from "@/lib/encarte/paginate";
import { slugify } from "@/lib/encarte/text";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_POSTERS = 60;
const A4 = { width: 595.28, height: 841.89 };

// GET /api/encartes/{id}/cartazes
// PDF A4 com um cartaz de gôndola por produto do encarte (destaques
// primeiro), para imprimir e pendurar na prateleira.
export async function GET(_req: Request, { params }: RouteContext<"/api/encartes/[id]/cartazes">) {
  const { id } = await params;
  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data } = auth.loaded;
  if (data.items.length === 0) return jsonError(400, "Esse encarte não tem produtos com preço.");

  try {
    const ordered = { ...data, items: orderItems(data.items).slice(0, MAX_POSTERS) };
    const withImages = await resolveEncarteImages(ordered, { cache: createImageCache(), budgetMs: 20000 });
    const fonts = await loadEncarteFonts();
    const pdf = await PDFDocument.create();
    pdf.setTitle(`Cartazes ${data.name}`);
    pdf.setAuthor(data.market.name);
    pdf.setCreator("Promia");
    for (const item of withImages.items) {
      const res = new ImageResponse(renderPoster(withImages, item), { ...POSTER_SIZE, fonts });
      const png = new Uint8Array(await res.arrayBuffer());
      const image = await pdf.embedPng(png);
      pdf.addPage([A4.width, A4.height]).drawImage(image, { x: 0, y: 0, width: A4.width, height: A4.height });
    }
    const bytes = await pdf.save();
    return new Response(bytes as BodyInit, {
      headers: {
        "content-type": "application/pdf",
        "content-length": String(bytes.byteLength),
        "content-disposition": contentDisposition("attachment", `cartazes-${slugify(data.name)}.pdf`),
        "cache-control": NO_STORE,
      },
    });
  } catch (err) {
    console.error("[encarte] cartazes", err);
    return jsonError(500, "Não consegui gerar os cartazes agora. Tente de novo.");
  }
}
