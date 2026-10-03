import { describe, expect, it } from "vitest";
import { FORMATS } from "@/lib/encarte/formats";
import { renderEncartePng } from "@/lib/encarte/png";
import { THEMES } from "@/lib/encarte/themes";
import { ENCARTE_FORMATS, ENCARTE_LAYOUTS, type EncarteData, type EncarteItem } from "@/lib/encarte/types";

// teste de fumaça: desenha de verdade (next/og) uma página de cada
// formato x layout e confere que sai um PNG do tamanho certo

// PNG 1x1 vermelho (foto de produto em data URI)
const PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

function pngSize(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

const items: EncarteItem[] = [
  { name: "Contrafilé Bovino kg", brand: "Friboi", unit: "kg", imageUrl: PIXEL, price: 42.9, oldPrice: 54.9, highlight: true, limitQty: 2 },
  { name: "Café Torrado e Moído Extraforte Embalagem Econômica 500g", brand: "Pilão", imageUrl: PIXEL, price: 19.9, highlight: false, label: "Leve 3 pague 2" },
  { name: "Arroz Branco Tipo 1 5kg", brand: "Camil", imageUrl: null, price: 1299.9, oldPrice: 1499.9, highlight: false },
  { name: "Banana Prata", unit: "bdj", price: 6.99, highlight: false },
  { name: "Óleo de Soja 900ml", brand: "Soya", unit: "un", price: 7.49, highlight: false },
  { name: "Refrigerante 2L", brand: "Coca-Cola", price: 10.99, oldPrice: 11, highlight: false },
  { name: "Detergente", brand: "Ypê", price: 2.79, highlight: false },
];

function data(format: EncarteData["format"], layout: EncarteData["layout"], themeKey = "ofertas"): EncarteData {
  return {
    id: "teste",
    name: "Teste",
    format,
    layout,
    themeKey,
    validFrom: "2026-10-03",
    validUntil: "2026-10-09",
    market: {
      name: "Supermercado Teste",
      logoUrl: PIXEL,
      colorPrimary: "#1B5E20",
      address: "Rua A, 1",
      city: "Sorocaba/SP",
      whatsapp: "(15) 99999-0000",
      instagram: "@teste",
      openingHours: "7h às 22h",
    },
    items,
  };
}

describe("renderEncartePng", () => {
  const cases = ENCARTE_FORMATS.flatMap((f) => ENCARTE_LAYOUTS.map((l) => [f, l] as const));
  it.each(cases)("%s / %s gera PNG", async (format, layout) => {
    const out = await renderEncartePng(data(format, layout), 0);
    expect(out).not.toBeNull();
    const png = out!.png;
    expect(png.byteLength).toBeGreaterThan(10_000);
    expect(Array.from(png.slice(0, 8))).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(pngSize(png)).toEqual({ width: FORMATS[format].width, height: FORMATS[format].height });
  }, 30_000);

  it("desenha todos os temas", async () => {
    for (const theme of THEMES) {
      const out = await renderEncartePng({ ...data("quadrado", "destaque", theme.key), market: { name: "Mercado" } }, 0);
      expect(out!.png.byteLength, theme.key).toBeGreaterThan(10_000);
    }
  }, 60_000);

  it("encarte vazio e página fora do intervalo", async () => {
    const empty = await renderEncartePng({ ...data("feed", "grade"), items: [] }, 0);
    expect(empty!.pageCount).toBe(1);
    expect(await renderEncartePng(data("feed", "grade"), 5)).toBeNull();
  }, 30_000);
});
