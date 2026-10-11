import type { EncarteFormat, EncarteLayout, EncarteModelo } from "./types";

// Nomes curtos para a interface (os longos ficam em FORMATS[x].label).
export const FORMAT_SHORT: Record<EncarteFormat, string> = { feed: "Feed", story: "Story", quadrado: "Quadrado", a4: "A4" };
export const FORMAT_HINT: Record<EncarteFormat, string> = {
  feed: "Instagram e Facebook",
  story: "Story e status do WhatsApp",
  quadrado: "Oferta do dia",
  a4: "Imprimir e distribuir",
};
export const LAYOUT_SHORT: Record<EncarteLayout, string> = { grade: "Grade", destaque: "Destaque", lista: "Lista" };
export const LAYOUT_HINT: Record<EncarteLayout, string> = {
  grade: "Todos do mesmo tamanho",
  destaque: "Um produto grande por página",
  lista: "Muitos produtos, estilo cartaz",
};
export const ITEM_LABELS = ["Só hoje", "Leve 3 pague 2", "Imperdível", "Preço de atacado", "Novidade"];

// Modelos de arte (lib/encarte/modelos): nome e descrição para o editor.
import { BOXES } from "./modelos/boxes";

const MODELO_LABELS_CAIXA = Object.fromEntries(BOXES.map((b) => [b.id, { label: `${b.id.slice(2)} ${b.nome}`, hint: "Caixa de referência com cores fixas; fundo e emblema à escolha" }])) as Record<Extract<EncarteModelo, `cx${string}`>, { label: string; hint: string }>;

export const MODELO_LABELS: Record<EncarteModelo, { label: string; hint: string }> = {
  feira: { label: "Feira", hint: "Papel kraft, placa de madeira e etiquetas de preço" },
  vitrine: { label: "Vitrine", hint: "Cartões brancos com brilho, preço em relevo e cores do emblema" },
  painel: { label: "Painel", hint: "Produtos soltos sobre fundo de luz" },
  vidro: { label: "Vidro", hint: "Cartões translúcidos com selo festonado de preço" },
  barra: { label: "Barra", hint: "Cartões escuros com etiqueta preta e contorno dourado" },
  mercado: { label: "Mercado", hint: "Cartões de papel da Feira sobre fundo à escolha" },
  selo: { label: "Selo", hint: "Produto grande com selo redondo de preço dourado" },
  cerca: { label: "Cerca", hint: "Caixotes, barra de preço e cerca de madeira no rodapé" },
  linhas: { label: "Linhas", hint: "Faixas amarelas e menta, uma por produto" },
  pomar: { label: "Pomar", hint: "Caixotes e barras de preço" },
  ...MODELO_LABELS_CAIXA,
};

// Fundos dos modelos brilhantes (lib/encarte/modelos/brilho.tsx).
export const FUNDO_LABELS: Record<import("./types").EncarteFundo, string> = {
  raios: "Raios de luz",
  bokeh: "Luzes desfocadas",
  diagonal: "Faixas diagonais",
  aros: "Aros",
  kraft: "Papel kraft",
  madeira: "Madeira",
  estudio: "Estúdio",
  vinheta: "Raios com vinheta",
  xadrez: "Quadriculado",
  feira: "Toldo de feira",
};
