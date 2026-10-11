import type { EncarteData, EncarteModelo } from "../types";
import { renderFeira } from "./feira";
import { compor } from "./brilho";
import { CardBarra, CardLinhas, CardMercado, CardSelo, CardVidro } from "./caixas";
import { renderPainel } from "./painel";
import { CardPomar, renderPomar } from "./pomar";
import { renderVitrine } from "./vitrine";

// Registro dos modelos de arte. Cada modelo desenha a página inteira (mesmo
// formato de retorno de renderEncartePage) e usa a capacidade da grade do
// formato para paginar.

type Pg = { element: import("react").ReactElement; width: number; height: number; pageIndex: number; pageCount: number };

export const MODELOS: Record<EncarteModelo, { label: string; hint: string; render: (data: EncarteData, pageIndex: number) => Pg | null }> = {
  feira: { label: "Feira", hint: "Papel kraft, placa de madeira e etiquetas de preço", render: renderFeira },
  vitrine: { label: "Vitrine", hint: "Cartões brancos com brilho, preço em relevo e cores do emblema", render: renderVitrine },
  painel: { label: "Painel", hint: "Produtos grandes soltos sobre fundo de luz e bokeh", render: renderPainel },
  vidro: { label: "Vidro", hint: "Cartões translúcidos com selo festonado de preço", render: (d, i) => compor(d, i, { estilo: "bokeh", Card: CardVidro, gap: 24, padX: 34 }) },
  barra: { label: "Barra", hint: "Cartões escuros com etiqueta preta e contorno dourado", render: (d, i) => compor(d, i, { estilo: "diagonal", Card: CardBarra, gap: 24, padX: 34 }) },
  mercado: { label: "Mercado", hint: "Cartões de papel da Feira sobre fundo à escolha", render: (d, i) => compor(d, i, { estilo: "kraft", Card: CardMercado, gap: 22, padX: 34 }) },
  selo: { label: "Selo", hint: "Produto grande com selo redondo de preço dourado", render: (d, i) => compor(d, i, { estilo: "vinheta", Card: CardSelo, gap: 22, padX: 34 }) },
  cerca: { label: "Cerca", hint: "Caixotes, barra de preço e cerca de madeira no rodapé", render: (d, i) => compor(d, i, { estilo: "feira", Card: CardPomar, gap: 22, padX: 34, cardMaxRatio: 1.1, rodape: "cerca" }) },
  linhas: { label: "Linhas", hint: "Faixas amarelas e menta, uma por produto", render: (d, i) => compor(d, i, { estilo: "estudio", Card: CardLinhas, gap: 14, padX: 34, cols: (f) => (f === "a4" ? 2 : 1), cardMaxRatio: 1.0 }) },
  pomar: { label: "Pomar", hint: "Produto sobre caixote de madeira e barra de preço escura", render: renderPomar },
};

export function renderModelo(data: EncarteData, pageIndex: number): Pg | null {
  const m = data.modelo ? MODELOS[data.modelo] : null;
  return m ? m.render(data, pageIndex) : null;
}
