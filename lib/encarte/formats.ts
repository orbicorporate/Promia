import type { EncarteFormat, EncarteLayout } from "./types";

// Tamanho de cada formato e quantos produtos cabem por página em cada
// layout.
//
// Critério das capacidades: o encarte é lido no celular (feed e story do
// Instagram, status do WhatsApp) ou impresso (A4). No celular a imagem de
// 1080 px vira algo como 390 pt de largura, então um cartão de 1/3 da
// largura (~330 px) fica com ~120 pt na tela: é o mínimo para a foto ser
// reconhecível e o preço (o inteiro com ~100 px de altura) ser lido sem
// zoom. Mais que 3 colunas no celular deixa o preço do tamanho de uma
// legenda, e é aí que o encarte perde a função. Por isso:
//
// - feed (4:5): grade 3x2 = 6. Destaque: 1 grande + 3 numa faixa = 4.
//   Lista: 6 linhas de ~140 px (foto, nome e preço lado a lado).
// - story (9:16): sobra altura, mas o topo (~130 px) e a base (~160 px)
//   ficam atrás da barra do Instagram/WhatsApp, então a área útil é
//   parecida com a do feed com cartões mais largos: grade 2x3 = 6, com
//   cartões de ~490 px (preço bem maior que no feed). Destaque: 1 + 2x2 = 5.
//   Lista: 7 linhas.
// - quadrado (1:1): grade 2x2 = 4 (cartões grandes, é o formato de
//   anúncio). Destaque: 1 + 2 = 3. Lista: 4.
// - a4 (impressão, 1240x1754 = A4 a 150 dpi): o papel é lido de perto, na
//   mão ou na parede, então cabe uma grade 3x4 = 12 com o preço ainda com
//   ~1,5 cm de altura impresso. Destaque: 1 + 3x2 = 7. Lista: 10 linhas
//   (cartaz de preço).
//
// O PDF usa o próprio PNG de cada página (ver app/api/encartes/[id]/pdf).

export type LayoutCapacity = {
  perPage: number; // total de produtos por página (no destaque, inclui o grande)
  columns: number; // colunas da grade (no destaque, dos cartões pequenos)
};

export type FormatSpec = {
  key: EncarteFormat;
  label: string;
  width: number;
  height: number;
  // faixas que ficam atrás da interface do app (story): o conteúdo
  // importante não vai ali, só fundo e decoração
  safeTop: number;
  safeBottom: number;
  capacity: Record<EncarteLayout, LayoutCapacity>;
};

export const FORMATS: Record<EncarteFormat, FormatSpec> = {
  feed: {
    key: "feed",
    label: "Feed do Instagram (4:5)",
    width: 1080,
    height: 1350,
    safeTop: 0,
    safeBottom: 0,
    capacity: {
      grade: { perPage: 6, columns: 3 },
      destaque: { perPage: 4, columns: 3 },
      lista: { perPage: 6, columns: 1 },
    },
  },
  story: {
    key: "story",
    label: "Story / Status (9:16)",
    width: 1080,
    height: 1920,
    safeTop: 130,
    safeBottom: 160,
    capacity: {
      grade: { perPage: 6, columns: 2 },
      destaque: { perPage: 5, columns: 2 },
      lista: { perPage: 7, columns: 1 },
    },
  },
  quadrado: {
    key: "quadrado",
    label: "Quadrado (1:1)",
    width: 1080,
    height: 1080,
    safeTop: 0,
    safeBottom: 0,
    capacity: {
      grade: { perPage: 4, columns: 2 },
      destaque: { perPage: 3, columns: 2 },
      lista: { perPage: 4, columns: 1 },
    },
  },
  a4: {
    key: "a4",
    label: "A4 para imprimir",
    width: 1240,
    height: 1754,
    safeTop: 0,
    safeBottom: 0,
    capacity: {
      grade: { perPage: 12, columns: 3 },
      destaque: { perPage: 7, columns: 3 },
      lista: { perPage: 10, columns: 1 },
    },
  },
};

// tamanho de página A4 em pontos PDF (1 pt = 1/72 pol)
export const A4_PDF_SIZE = { width: 595.28, height: 841.89 } as const;

// Tamanho da página do PDF para cada formato: A4 de verdade para o a4; para
// os formatos de tela, mesma proporção do PNG com a largura de um A4 (o
// PDF serve para mandar ao cliente ou à gráfica, então fica num tamanho
// familiar em vez de 1080 pt de largura).
export function pdfPageSize(format: EncarteFormat): { width: number; height: number } {
  if (format === "a4") return { ...A4_PDF_SIZE };
  const spec = FORMATS[format];
  return { width: A4_PDF_SIZE.width, height: Math.round((A4_PDF_SIZE.width * spec.height) / spec.width * 100) / 100 };
}
