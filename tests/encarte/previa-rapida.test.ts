import { describe, expect, it } from "vitest";
import { renderModelo } from "@/lib/encarte/modelos";
import { carregarEmblema } from "@/lib/encarte/modelos/emblema";
import { FORMATS, specEscalada } from "@/lib/encarte/formats";
import type { EncarteData } from "@/lib/encarte/types";

// A prévia rápida só encolhe o desenho; o tamanho real (download, PDF, impressão)
// não pode ser afetado por ela.

const base: EncarteData = {
  id: "teste",
  name: "Teste",
  format: "feed",
  layout: "grade",
  modelo: "cx01",
  themeKey: "ofertas",
  market: { name: "Mercado" },
  items: [{ name: "Banana", price: 6.99, highlight: false }],
};

describe("prévia em escala menor", () => {
  it("sem escala, a página sai no tamanho real do formato", () => {
    const pg = renderModelo(base, 0)!;
    expect([pg.width, pg.height]).toEqual([FORMATS.feed.width, FORMATS.feed.height]);
  });

  it("com escala, a página encolhe de forma proporcional", () => {
    const pg = renderModelo({ ...base, escalaPrevia: 0.5 }, 0)!;
    expect([pg.width, pg.height]).toEqual([540, 675]);
    const sp = specEscalada("story", 0.4);
    expect(sp.width / sp.height).toBeCloseTo(FORMATS.story.width / FORMATS.story.height, 2);
  });

  it("escala fora de 0 a 1 é ignorada", () => {
    expect(specEscalada("feed", 1.5).width).toBe(1080);
    expect(specEscalada("feed", 0).width).toBe(1080);
  });
});

describe("logo na prévia rápida", () => {
  it("usa a miniatura leve e mantém o mesmo clima de cor do arquivo final", async () => {
    const rapido = await carregarEmblema("ofertas-da-semana", { rapido: true });
    const cheio = await carregarEmblema("ofertas-da-semana");
    expect(rapido && cheio).toBeTruthy();
    expect(rapido!.ilustrado.w).toBeLessThanOrEqual(440);
    expect(cheio!.ilustrado.w).toBeGreaterThan(440);
    const dh = Math.abs(rapido!.cores.hue - cheio!.cores.hue);
    expect(Math.min(dh, 360 - dh)).toBeLessThanOrEqual(20);
  });
});
