// Preenche um template de tabloide (HTML com tokens, ver
// lib/themes.ts THEME_MARKET_TOKENS/THEME_PRODUCT_TOKENS) com os dados do
// mercado e a lista de produtos selecionados, e devolve o HTML pronto pra
// renderizar (num iframe ou numa página) e depois capturar em imagem no
// navegador (html2canvas-pro), no mesmo esquema do template.html do Nume
// Calendar: o template em si só usa style inline com hex/rgba puro, nada
// de classe Tailwind pra cor, pra não ter problema de captura.

export type TabloidMarketData = {
  name: string;
  logoUrl: string | null;
  colorPrimary: string;
  colorSecondary: string;
  tabloidName: string;
  validityLabel: string; // ex. "válido de 01/10 a 07/10"
};

export type TabloidProductData = {
  name: string;
  price: number | null;
  imageUrl: string | null;
  category: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPrice(price: number | null): string {
  if (price == null) return "Consulte";
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MARKET_TOKEN_MAP: Record<string, (m: TabloidMarketData) => string> = {
  "%%NOME_MERCADO%%": (m) => escapeHtml(m.name),
  "%%LOGO_URL%%": (m) => m.logoUrl || "",
  "%%COR_PRIMARIA%%": (m) => m.colorPrimary,
  "%%COR_SECUNDARIA%%": (m) => m.colorSecondary,
  "%%NOME_TABLOIDE%%": (m) => escapeHtml(m.tabloidName),
  "%%VIGENCIA%%": (m) => escapeHtml(m.validityLabel),
};

const PRODUCT_TOKEN_MAP: Record<string, (p: TabloidProductData) => string> = {
  "%%PRODUTO_NOME%%": (p) => escapeHtml(p.name),
  "%%PRODUTO_PRECO%%": (p) => formatPrice(p.price),
  "%%PRODUTO_IMAGEM_URL%%": (p) => p.imageUrl || "",
  "%%PRODUTO_CATEGORIA%%": (p) => escapeHtml(p.category || ""),
};

// o bloco de um produto fica delimitado por esses marcadores no template;
// tudo entre eles é repetido uma vez por produto selecionado.
const PRODUCT_BLOCK_START = "<!--PRODUTOS_INICIO-->";
const PRODUCT_BLOCK_END = "<!--PRODUTOS_FIM-->";

export function renderTabloidHtml(
  templateHtml: string,
  market: TabloidMarketData,
  products: TabloidProductData[]
): string {
  const startIdx = templateHtml.indexOf(PRODUCT_BLOCK_START);
  const endIdx = templateHtml.indexOf(PRODUCT_BLOCK_END);

  let html = templateHtml;

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = templateHtml.slice(0, startIdx);
    const blockTemplate = templateHtml.slice(startIdx + PRODUCT_BLOCK_START.length, endIdx);
    const after = templateHtml.slice(endIdx + PRODUCT_BLOCK_END.length);

    const renderedBlocks = products
      .map((p) => {
        let block = blockTemplate;
        for (const [token, fn] of Object.entries(PRODUCT_TOKEN_MAP)) {
          block = block.split(token).join(fn(p));
        }
        return block;
      })
      .join("\n");

    html = before + renderedBlocks + after;
  }

  for (const [token, fn] of Object.entries(MARKET_TOKEN_MAP)) {
    html = html.split(token).join(fn(market));
  }

  return html;
}
