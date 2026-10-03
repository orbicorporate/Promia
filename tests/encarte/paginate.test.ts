import { describe, expect, it } from "vitest";
import { FORMATS } from "@/lib/encarte/formats";
import { getPage, orderItems, pageCount, paginate } from "@/lib/encarte/paginate";
import { ENCARTE_FORMATS, ENCARTE_LAYOUTS, type EncarteItem } from "@/lib/encarte/types";

const items = (n: number, highlights: number[] = []): EncarteItem[] =>
  Array.from({ length: n }, (_, i) => ({ name: `P${i}`, price: i + 1, highlight: highlights.includes(i) }));

describe("paginate", () => {
  it("grade divide pela capacidade do formato", () => {
    const data = { format: "feed" as const, layout: "grade" as const, items: items(13) };
    expect(pageCount(data)).toBe(3); // 6 + 6 + 1
    expect(getPage(data, 2)!.items.map((i) => i.name)).toEqual(["P12"]);
    expect(getPage(data, 0)!.total).toBe(3);
  });

  it("destaques vão primeiro, mantendo a ordem", () => {
    const ordered = orderItems(items(5, [3, 1]));
    expect(ordered.map((i) => i.name)).toEqual(["P1", "P3", "P0", "P2", "P4"]);
    const page = getPage({ format: "quadrado", layout: "grade", items: items(5, [4]) }, 0)!;
    expect(page.items[0].name).toBe("P4");
  });

  it("no layout destaque, cada destaque ocupa a posição grande de uma página", () => {
    const data = { format: "feed" as const, layout: "destaque" as const, items: items(10, [5, 8]) };
    const pages = paginate(data);
    // feed destaque = 1 grande + 3 pequenos
    expect(pages.map((p) => p.featured?.name)).toEqual(["P5", "P8", "P7"]);
    expect(pages[0].items.map((i) => i.name)).toEqual(["P0", "P1", "P2"]);
    expect(pages[1].items.map((i) => i.name)).toEqual(["P3", "P4", "P6"]);
    expect(pages[2].items.map((i) => i.name)).toEqual(["P9"]);
    // nenhum produto some nem repete
    const all = pages.flatMap((p) => [p.featured!, ...p.items]).map((i) => i.name).sort();
    expect(all).toEqual(items(10).map((i) => i.name).sort());
  });

  it("sem destaque marcado, o primeiro item de cada página é o grande", () => {
    const pages = paginate({ format: "quadrado", layout: "destaque", items: items(6) });
    expect(pages.map((p) => p.featured?.name)).toEqual(["P0", "P3"]);
    expect(pages[0].items.map((i) => i.name)).toEqual(["P1", "P2"]);
  });

  it("mais destaques que páginas: cada um ganha a sua página", () => {
    const pages = paginate({ format: "a4", layout: "destaque", items: items(4, [0, 1, 2, 3]) });
    expect(pages).toHaveLength(4);
    expect(pages.every((p) => p.items.length === 0)).toBe(true);
  });

  it("encarte vazio ainda tem uma página", () => {
    const data = { format: "story" as const, layout: "lista" as const, items: [] };
    expect(pageCount(data)).toBe(1);
    expect(getPage(data, 0)).toMatchObject({ index: 0, total: 1, featured: null, items: [] });
  });

  it("página fora do intervalo devolve null", () => {
    const data = { format: "feed" as const, layout: "grade" as const, items: items(3) };
    expect(getPage(data, 1)).toBeNull();
    expect(getPage(data, -1)).toBeNull();
    expect(getPage(data, 0.5)).toBeNull();
  });

  it("nenhuma página passa da capacidade, em todo formato e layout", () => {
    for (const format of ENCARTE_FORMATS) {
      for (const layout of ENCARTE_LAYOUTS) {
        const pages = paginate({ format, layout, items: items(41, [7, 20, 33]) });
        const cap = FORMATS[format].capacity[layout].perPage;
        for (const p of pages) expect(p.items.length + (p.featured ? 1 : 0)).toBeLessThanOrEqual(cap);
        expect(pages.reduce((n, p) => n + p.items.length + (p.featured ? 1 : 0), 0)).toBe(41);
      }
    }
  });
});
