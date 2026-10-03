import { FORMATS } from "./formats";
import type { EncarteData, EncarteFormat, EncarteItem, EncarteLayout } from "./types";

// Divide os produtos do encarte em páginas.
//
// - Produtos marcados como destaque vêm primeiro (mantendo a ordem em que
//   o dono os colocou), depois o resto na ordem original.
// - Grade e lista: fatias de `perPage`.
// - Destaque: cada página tem uma posição grande e (perPage - 1) pequenas.
//   Cada produto em destaque ocupa a posição grande de uma página (um por
//   página); quando acabam os destaques, o próximo produto da fila vai para
//   a posição grande. Assim um encarte sem nenhum destaque marcado ainda
//   tem um produto grande por página (o primeiro).

export type EncartePage = {
  index: number; // 0-based
  total: number;
  featured: EncarteItem | null; // só no layout destaque
  items: EncarteItem[]; // grade/lista: todos; destaque: os pequenos
};

type PaginateInput = { format: EncarteFormat; layout: EncarteLayout; items: EncarteItem[] };

function splitByHighlight(items: EncarteItem[]) {
  return { highlights: items.filter((i) => i.highlight), others: items.filter((i) => !i.highlight) };
}

export function orderItems(items: EncarteItem[]): EncarteItem[] {
  const { highlights, others } = splitByHighlight(items);
  return [...highlights, ...others];
}

export function paginate(data: PaginateInput): EncartePage[] {
  const { perPage } = FORMATS[data.format].capacity[data.layout];
  const pages: Omit<EncartePage, "total">[] = [];

  if (data.layout === "destaque") {
    const { highlights, others } = splitByHighlight(data.items);
    const small = Math.max(0, perPage - 1);
    let h = 0;
    let o = 0;
    while (h < highlights.length || o < others.length) {
      const featured = h < highlights.length ? highlights[h++] : others[o++];
      const items = others.slice(o, o + small);
      o += items.length;
      pages.push({ index: pages.length, featured, items });
    }
  } else {
    const ordered = orderItems(data.items);
    for (let i = 0; i < ordered.length; i += perPage) {
      pages.push({ index: pages.length, featured: null, items: ordered.slice(i, i + perPage) });
    }
  }

  // encarte sem produtos ainda tem uma página (a prévia mostra o cabeçalho)
  if (pages.length === 0) pages.push({ index: 0, featured: null, items: [] });
  return pages.map((p) => ({ ...p, total: pages.length }));
}

export function pageCount(data: PaginateInput): number {
  return paginate(data).length;
}

// pageIndex é 0-based; fora do intervalo devolve null
export function getPage(data: Pick<EncarteData, "format" | "layout" | "items">, pageIndex: number): EncartePage | null {
  const pages = paginate(data);
  if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= pages.length) return null;
  return pages[pageIndex];
}
