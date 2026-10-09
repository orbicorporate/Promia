import type { EncarteData, EncarteModelo } from "../types";
import { renderFeira } from "./feira";

// Registro dos modelos de arte. Cada modelo desenha a página inteira (mesmo
// formato de retorno de renderEncartePage) e usa a capacidade da grade do
// formato para paginar.

type Pg = { element: import("react").ReactElement; width: number; height: number; pageIndex: number; pageCount: number };

export const MODELOS: Record<EncarteModelo, { label: string; hint: string; render: (data: EncarteData, pageIndex: number) => Pg | null }> = {
  feira: { label: "Feira", hint: "Papel kraft, placa de madeira e etiquetas de preço", render: renderFeira },
};

export function renderModelo(data: EncarteData, pageIndex: number): Pg | null {
  const m = data.modelo ? MODELOS[data.modelo] : null;
  return m ? m.render(data, pageIndex) : null;
}
