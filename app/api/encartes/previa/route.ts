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

// A prévia é desenhada numa fração do tamanho real (0,4 = 432 px de largura no feed).
// O montador pede primeiro 0,4 (quase instantânea) e depois 0,8 (nítida).
const ESCALA_MIN = 0.3;
const ESCALA_PADRAO = 0.5;

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
  // (no esqueleto os produtos nem entram: só a marcação das 12 caixas)
  const esqueleto = parsed.data.esqueleto === true;
  const vazio = !esqueleto && parsed.data.items.length === 0;
  const base = vazio ? await itensDeExemplo() : null;
  // com caixa escolhida a página tem 12 posições: repete os 6 exemplos
  const exemplo = base && parsed.data.modelo ? [...base, ...base] : base;
  const data = { ...parsed.data, ...(esqueleto ? { items: [] } : {}), ...(exemplo ? { items: exemplo } : {}), id: "previa", market: marketRowToEncarte(market) };
  const total = pageCount(data);
  if (pageIndex >= total) return jsonError(404, `Esse encarte tem ${total} página${total > 1 ? "s" : ""}.`);

  try {
    // prévia rápida: página em escala menor e fotos pequenas. O arquivo final
    // (baixar, PDF, publicar) usa o tamanho real, sem passar por aqui.
    const q = typeof body.escala === "number" && Number.isFinite(body.escala) ? Math.min(1, Math.max(ESCALA_MIN, body.escala)) : ESCALA_PADRAO;
    const withImages = await resolveEncarteImages({ ...data, escalaPrevia: q }, { pageIndex, budgetMs: 7000, ilustrar: true, emblemaRapido: q <= 0.5, maxLado: Math.max(120, Math.round(480 * q)) });
    const out = await renderEncartePng(withImages, pageIndex);
    if (!out) return jsonError(404, "Página não encontrada.");
    // a prévia segue em WebP: 5 a 10 vezes menor que o PNG, chega mais rápido
    const webp = await sharp(out.png).webp({ quality: 82, effort: 1 }).toBuffer();
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
