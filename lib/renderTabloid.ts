// Preenche um template de tabloide (HTML com tokens, ver lib/themes.ts)
// com os dados do mercado e os produtos escolhidos. O resultado vai pra
// tela com dangerouslySetInnerHTML e é capturado em imagem no navegador,
// então TUDO que vem do banco ou da internet é escapado aqui: texto vira
// texto, URL só entra se for https, cor só entra se for hexadecimal.

export type TabloidMarketData = {
  name: string;
  logoUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  tabloidName: string;
  validityLabel: string;
};

export type TabloidProductData = {
  name: string;
  price: number | null;
  unit?: string | null;
  imageUrl: string | null;
  category: string | null;
};

export const DEFAULT_PRIMARY = "#16a34a";
export const DEFAULT_SECONDARY = "#111827";

// imagem transparente de 1 px: no lugar de logo ou foto ausente, em vez do
// ícone de imagem quebrada
export const EMPTY_IMAGE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function safeImageUrl(url: string | null | undefined, proxy?: (url: string) => string): string {
  if (!url) return EMPTY_IMAGE;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return EMPTY_IMAGE;
    return escapeHtml(proxy ? proxy(parsed.toString()) : parsed.toString());
  } catch {
    return EMPTY_IMAGE;
  }
}

// fotos de terceiros passam pelo próprio Promia, pra não sumirem do PNG
export const sameOriginImage = (url: string) => `/api/imagem?u=${encodeURIComponent(url)}`;

export function safeColor(color: string | null | undefined, fallback: string): string {
  return color && /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(color.trim()) ? color.trim() : fallback;
}

const UNIT_LABEL: Record<string, string> = { kg: "kg", g: "g", l: "l", ml: "ml", cx: "cx", pct: "pct", dz: "dz", bdj: "bdj", fd: "fardo" };

export function formatPrice(price: number | null, unit?: string | null): string {
  if (price == null) return "Consulte";
  const value = price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const label = unit && UNIT_LABEL[unit];
  return label ? `${value}/${label}` : value;
}

const PRODUCT_BLOCK_START = "<!--PRODUTOS_INICIO-->";
const PRODUCT_BLOCK_END = "<!--PRODUTOS_FIM-->";

export function renderTabloidHtml(
  templateHtml: string,
  market: TabloidMarketData,
  products: TabloidProductData[],
  opts: { imageProxy?: (url: string) => string } = {}
): string {
  const primary = safeColor(market.colorPrimary, DEFAULT_PRIMARY);
  const secondary = safeColor(market.colorSecondary, DEFAULT_SECONDARY);

  const marketTokens: Record<string, string> = {
    "%%NOME_MERCADO%%": escapeHtml(market.name),
    "%%LOGO_URL%%": safeImageUrl(market.logoUrl, opts.imageProxy),
    "%%COR_PRIMARIA%%": primary,
    "%%COR_SECUNDARIA%%": secondary,
    "%%NOME_TABLOIDE%%": escapeHtml(market.tabloidName),
    "%%VIGENCIA%%": escapeHtml(market.validityLabel),
  };

  const productTokens = (p: TabloidProductData): Record<string, string> => ({
    "%%PRODUTO_NOME%%": escapeHtml(p.name),
    "%%PRODUTO_PRECO%%": escapeHtml(formatPrice(p.price, p.unit)),
    "%%PRODUTO_IMAGEM_URL%%": safeImageUrl(p.imageUrl, opts.imageProxy),
    "%%PRODUTO_CATEGORIA%%": escapeHtml(p.category || ""),
  });

  // uma passada só por token: o que já foi inserido (nome de produto, por
  // exemplo) nunca é reprocessado como se fosse um token do template
  const fill = (text: string, tokens: Record<string, string>) =>
    text.replace(/%%[A-Z_]+%%/g, (token) => (token in tokens ? tokens[token] : token));

  let html: string;
  const startIdx = templateHtml.indexOf(PRODUCT_BLOCK_START);
  const endIdx = templateHtml.indexOf(PRODUCT_BLOCK_END);
  if (startIdx !== -1 && endIdx > startIdx) {
    const before = templateHtml.slice(0, startIdx);
    const block = templateHtml.slice(startIdx + PRODUCT_BLOCK_START.length, endIdx);
    const after = templateHtml.slice(endIdx + PRODUCT_BLOCK_END.length);
    html =
      fill(before, marketTokens) +
      products.map((p) => fill(block, { ...marketTokens, ...productTokens(p) })).join("\n") +
      fill(after, marketTokens);
  } else {
    html = fill(templateHtml, marketTokens);
  }
  return html;
}
