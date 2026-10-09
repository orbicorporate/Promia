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
export const MODELO_LABELS: Record<EncarteModelo, { label: string; hint: string }> = {
  feira: { label: "Feira", hint: "Papel kraft, placa de madeira e etiquetas de preço" },
};
