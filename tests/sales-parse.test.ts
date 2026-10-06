import { describe, expect, it } from "vitest";
import { rowsToSales } from "@/lib/sales/parse";

describe("relatório de vendas", () => {
  it("acha as colunas com nomes de ERP e ignora total e linhas zeradas", () => {
    const r = rowsToSales([
      ["Relatório de vendas por produto", null, null, null, null],
      ["Cód.", "Descrição", "Qtd. Vendida", "Valor Total", "Custo Total"],
      ["001", "Arroz Camil 5kg", "120", "R$ 3.108,00", "2.400,00"],
      ["002", "Banana Prata", "85,5", "597,65", null],
      ["003", "Produto parado", "0", "0", null],
      [null, "TOTAL", "205,5", "3.705,65", null],
    ]);
    expect(r.columns).toMatchObject({ sku: "Cód.", name: "Descrição", qty: "Qtd. Vendida", revenue: "Valor Total", cost: "Custo Total" });
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0]).toMatchObject({ sku: "1", qty: 120, revenue: 3108, cost: 2400 });
    expect(r.rows[1].qty).toBe(85.5);
    expect(r.skipped).toBe(1);
  });

  it("aceita relatório só com valor vendido", () => {
    const r = rowsToSales([["Produto", "Faturamento"], ["Leite Italac", "1.250,40"]]);
    expect(r.rows[0]).toMatchObject({ name: "Leite Italac", qty: 0, revenue: 1250.4 });
  });

  it("explica quando não acha as colunas", () => {
    expect(() => rowsToSales([["a", "b"], ["1", "2"]])).toThrow(/colunas do relatório/);
  });
});
