import { describe, expect, it } from "vitest";
import { tamanhoEmblema } from "@/lib/encarte/modelos/brilho";

// Todos os logos devem ter o mesmo peso visual, qualquer que seja a proporção.

const arq = (ar: number) => ({ src: "x", w: 880, h: Math.round(880 / ar) });
const emb = (ar: number) => ({ ilustrado: arq(ar), horizontal: null });
const feed = { W: 1080, H: 1350 };

describe("tamanho do emblema", () => {
  it("nos fundos finos, logos de proporções diferentes ocupam áreas parecidas", () => {
    const m = { ...feed, boxW: 1080 * 0.74, boxH: Math.round(1080 * 0.28), fino: true, arte: true };
    const areas = [1.09, 1.2, 1.45, 1.6].map((ar) => {
      const t = tamanhoEmblema(emb(ar), m);
      return (t.w * t.h) / (feed.W * feed.H);
    });
    expect(Math.max(...areas) / Math.min(...areas)).toBeLessThan(1.35);
    expect(Math.min(...areas)).toBeGreaterThan(0.05); // antes ficava em 0,03 a 0,04
  });

  it("a proporção do desenho nunca muda", () => {
    const m = { ...feed, boxW: 700, boxH: 300, fino: true, arte: true, escala: 1.3 };
    for (const ar of [1.1, 1.5]) {
      const t = tamanhoEmblema(emb(ar), m);
      expect(t.w / t.h).toBeCloseTo(880 / Math.round(880 / ar), 5);
    }
  });

  it("o ajuste do usuário aumenta e diminui, sem passar do teto da página", () => {
    const m = { ...feed, boxW: 1080 * 0.9, boxH: 330, fino: false, arte: false };
    const base = tamanhoEmblema(emb(1.2), m);
    expect(tamanhoEmblema(emb(1.2), { ...m, escala: 0.6 }).w).toBeLessThan(base.w);
    expect(tamanhoEmblema(emb(1.2), { ...m, escala: 1.6 }).w).toBeGreaterThanOrEqual(base.w);
    expect(tamanhoEmblema(emb(3), { ...m, escala: 1.6 }).w).toBeLessThanOrEqual(feed.W * 0.94 + 0.001);
  });
});
