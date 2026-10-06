import { describe, expect, it } from "vitest";
import { analyzeSales, type SaleRec } from "@/lib/sales/analyze";

const rec = (product_id: string, name: string, start: string, end: string, revenue: number, qty = 1, category = "Mercearia"): SaleRec => ({ product_id, name, category, period_start: start, period_end: end, qty, revenue, cost: null });

describe("análise de vendas", () => {
  const records: SaleRec[] = [
    rec("a", "Arroz", "2026-09-22", "2026-09-28", 1000),
    rec("b", "Feijão", "2026-09-22", "2026-09-28", 500),
    rec("c", "Coca", "2026-09-22", "2026-09-28", 300, 1, "Bebidas"),
    rec("a", "Arroz", "2026-09-29", "2026-10-05", 1000),
    rec("b", "Feijão", "2026-09-29", "2026-10-05", 200),
    rec("c", "Coca", "2026-09-29", "2026-10-05", 900, 1, "Bebidas"),
  ];
  const catalog = [
    { id: "a", name: "Arroz", category: "Mercearia", price: 25, cost: 20, stock: 10 },
    { id: "b", name: "Feijão", category: "Mercearia", price: 8, cost: null, stock: 5 },
    { id: "c", name: "Coca", category: "Bebidas", price: 10, cost: null, stock: 50 },
    { id: "d", name: "Parado", category: "Limpeza", price: 5, cost: null, stock: 80 },
  ];
  const r = analyzeSales(records, catalog, [{ id: "e", name: "Bebidas da semana", valid_from: "2026-09-29", valid_until: "2026-10-05", productIds: ["c"] }]);

  it("usa o último período e compara com o anterior", () => {
    expect(r.period).toMatchObject({ start: "2026-09-29", end: "2026-10-05", days: 7 });
    expect(r.kpis.revenue).toBe(2100);
    expect(r.kpis.revenueChange).toBeCloseTo(2100 / 1800 - 1);
  });

  it("aponta alta, queda, parado e o efeito do encarte", () => {
    expect(r.rising[0]).toMatchObject({ productId: "c" });
    expect(r.falling[0]).toMatchObject({ productId: "b" });
    expect(r.stale[0].id).toBe("d");
    expect(r.campaigns[0].lift).toBeCloseTo(2);
  });

  it("curva ABC e setores", () => {
    expect(r.abc.countA).toBeGreaterThanOrEqual(1);
    expect(r.categories[0].name).toBe("Mercearia");
  });

  it("sem vendas não quebra", () => {
    expect(analyzeSales([], catalog, []).period).toBeNull();
  });
});
