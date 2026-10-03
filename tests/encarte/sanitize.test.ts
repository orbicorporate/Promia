import { describe, expect, it } from "vitest";
import { PREVIEW_MAX_ITEMS, sanitizePreviewInput } from "@/lib/encarte/sanitize";

const base = { name: "Semana 40", format: "feed", layout: "grade", themeKey: "ofertas", items: [] as unknown[] };

describe("sanitizePreviewInput", () => {
  it("aceita um encarte válido", () => {
    const r = sanitizePreviewInput({
      ...base,
      headline: "  Ofertas   da semana ",
      validFrom: "2026-10-03",
      validUntil: "2026-13-40",
      items: [{ name: "Arroz 5kg", price: 27.9, oldPrice: 31.9, highlight: true, limitQty: 2, label: "Leve 2", imageUrl: "https://cdn.test/a.png", unit: "Kilo" }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.headline).toBe("Ofertas da semana");
    expect(r.data.validFrom).toBe("2026-10-03");
    expect(r.data.validUntil).toBeNull();
    expect(r.data.items[0]).toEqual({ name: "Arroz 5kg", brand: null, unit: "kg", imageUrl: "https://cdn.test/a.png", price: 27.9, oldPrice: 31.9, highlight: true, limitQty: 2, label: "Leve 2" });
  });

  it("recusa formato, layout e tema fora da lista", () => {
    expect(sanitizePreviewInput({ ...base, format: "a3" })).toEqual({ ok: false, error: "Formato inválido." });
    expect(sanitizePreviewInput({ ...base, layout: "mosaico" })).toEqual({ ok: false, error: "Layout inválido." });
    expect(sanitizePreviewInput({ ...base, themeKey: "x" })).toEqual({ ok: false, error: "Tema inválido." });
    expect(sanitizePreviewInput(null).ok).toBe(false);
    expect(sanitizePreviewInput({ ...base, items: "x" }).ok).toBe(false);
  });

  it("descarta itens sem nome ou com preço inválido e limpa o resto", () => {
    const r = sanitizePreviewInput({
      ...base,
      items: [
        { name: "", price: 1 },
        { name: "Sem preço" },
        { name: "Negativo", price: -1 },
        { name: "Infinito", price: Infinity },
        { name: "Texto", price: "abc" },
        { name: "Vírgula", price: "4,99", oldPrice: 3, imageUrl: "http://inseguro.test/a.png", limitQty: 0, highlight: "sim" },
        "lixo",
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ignoredItems).toBe(6);
    expect(r.data.items).toHaveLength(1);
    expect(r.data.items[0]).toMatchObject({ name: "Vírgula", price: 4.99, oldPrice: null, imageUrl: null, limitQty: null, highlight: false });
  });

  it("corta textos e limita a quantidade de itens", () => {
    const r = sanitizePreviewInput({
      ...base,
      name: "x".repeat(500),
      items: Array.from({ length: PREVIEW_MAX_ITEMS + 50 }, (_, i) => ({ name: `Produto ${i} ${"y".repeat(300)}`, price: 1, label: "z".repeat(100) })),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.name.length).toBeLessThanOrEqual(120);
    expect(r.data.items).toHaveLength(PREVIEW_MAX_ITEMS);
    expect(r.data.items[0].name.length).toBeLessThanOrEqual(120);
    expect(r.data.items[0].label!.length).toBeLessThanOrEqual(28);
  });
});
