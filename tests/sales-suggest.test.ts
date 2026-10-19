import { describe, expect, it } from "vitest";
import { analyzeSales } from "@/lib/sales/analyze";
import { sugerir } from "@/lib/sales/suggest";

const cat = ["a", "b", "c", "d"].map((id) => ({ id, name: `Produto ${id}`, category: null, price: 10, cost: 8, stock: 5 }));
const rec = (id: string, s: string, e: string, revenue: number) => ({ product_id: id, name: `Produto ${id}`, category: null, period_start: s, period_end: e, qty: 10, revenue, cost: null });

describe("sugestões do Promia", () => {
  it("sugere promoção para o que caiu, destaque para o que subiu e queima do parado", () => {
    const a = analyzeSales([rec("a", "2026-09-07", "2026-09-13", 1000), rec("b", "2026-09-07", "2026-09-13", 500), rec("a", "2026-09-14", "2026-09-20", 500), rec("b", "2026-09-14", "2026-09-20", 900)], cat, []);
    const s = sugerir(a);
    expect(s.find((x) => x.id === "queda")?.titulo).toMatch(/Produto a/);
    expect(s.find((x) => x.id === "alta")?.titulo).toMatch(/Produto b/);
  });
  it("pede mais um período quando só há um", () => {
    const a = analyzeSales([rec("a", "2026-09-14", "2026-09-20", 500)], cat, []);
    expect(sugerir(a).some((x) => x.id === "mais")).toBe(true);
  });
});
