import { readJson, requireMarketAccess } from "@/lib/auth";
import { jsonError, pageFileName, pngResponse } from "@/lib/encarte/http";
import { resolveEncarteImages } from "@/lib/encarte/images";
import { MARKET_ENCARTE_COLUMNS, marketRowToEncarte } from "@/lib/encarte/load";
import { pageCount } from "@/lib/encarte/paginate";
import { renderEncartePng } from "@/lib/encarte/png";
import { sanitizePreviewInput } from "@/lib/encarte/sanitize";
import sharp from "sharp";
import { itensDeExemplo } from "@/lib/encarte/demo";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// POST /api/encartes/previa
// Corpo: { marketId, data: { name, headline?, subheadline?, format, layout,
// themeKey, validFrom?, validUntil?, items: EncarteItem[] }, pagina? }
// Prévia ao vivo enquanto o dono monta o encarte, sem salvar nada. O
// mercado (nome, logo, cores, contatos) vem do banco, nunca do navegador.
// Dados do mercado mudam pouco: 30 s de cache evita uma ida ao banco por prévia.
const marketCache = new Map<string, { at: number; row: Record<string, unknown> }>();

export async function POST(req: Request) {
  const body = await readJson(req);
  const guard = await requireMarketAccess(body.marketId);
  if (!guard.ok) return guard.response;
  const marketId = body.marketId as string;

  const parsed = sanitizePreviewInput(body.data);
  if (!parsed.ok) return jsonError(400, parsed.error);

  const pagina = body.pagina ?? 1;
  if (typeof pagina !== "number" || !Number.isInteger(pagina) || pagina < 1 || pagina > 9999) return jsonError(400, "Página inválida.");
  const pageIndex = pagina - 1;

  let market = (() => {
    const hit = marketCache.get(marketId);
    return hit && Date.now() - hit.at < 30_000 ? hit.row : null;
  })() as Parameters<typeof marketRowToEncarte>[0] | null;
  if (!market) {
    const admin = createAdminClient();
    const { data, error } = await admin.from("markets").select(MARKET_ENCARTE_COLUMNS).eq("id", marketId).maybeSingle();
    if (error) {
      console.error("[encarte] previa market", error);
      return jsonError(500, "Não consegui carregar os dados do mercado. Tente de novo.");
    }
    if (!data) return jsonError(404, "Mercado não encontrado.");
    market = data;
    marketCache.set(marketId, { at: Date.now(), row: data as unknown as Record<string, unknown> });
  }

  // encarte vazio: mostra produtos de exemplo no estilo escolhido
  const vazio = parsed.data.items.length === 0;
  const exemplo = vazio ? await itensDeExemplo() : null;
  const data = { ...parsed.data, ...(exemplo ? { items: exemplo } : {}), id: "previa", market: marketRowToEncarte(market) };
  const total = pageCount(data);
  if (pageIndex >= total) return jsonError(404, `Esse encarte tem ${total} página${total > 1 ? "s" : ""}.`);

  try {
    const withImages = await resolveEncarteImages(data, { pageIndex, budgetMs: 7000, ilustrar: true });
    const out = await renderEncartePng(withImages, pageIndex);
    if (!out) return jsonError(404, "Página não encontrada.");
    // a prévia segue em WebP: 5 a 10 vezes menor que o PNG, chega mais rápido
    const webp = await sharp(out.png).webp({ quality: 84, effort: 1 }).toBuffer();
    return pngResponse(new Uint8Array(webp), {
      contentType: "image/webp",
      fileName: pageFileName(data.name, pageIndex + 1),
      download: false,
      pageIndex: out.pageIndex,
      pageCount: out.pageCount,
      extraHeaders: { "x-encarte-ignorados": String(parsed.ignoredItems) },
    });
  } catch (err) {
    console.error("[encarte] previa", err);
    return jsonError(500, "Não consegui desenhar a prévia agora. Tente de novo.");
  }
}
