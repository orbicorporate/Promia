import { describe, expect, it } from "vitest";
import { cadencia, movimentos, placar } from "@/lib/competition/insights";

const o = (competitor_name: string, product_id: string, price: number, observed_on: string) => ({ product_id, product_name: `P ${product_id}`, competitor_name, price, observed_on });

describe("insights da concorrência", () => {
  it("placar: índice por concorrente", () => {
    const p = placar([o("A", "1", 10, "2026-10-01"), o("A", "2", 5, "2026-10-01"), o("B", "1", 12, "2026-10-01")], [{ id: "1", name: "x", category: null, price: 11 }, { id: "2", name: "y", category: null, price: 5 }]);
    expect(p[0]).toMatchObject({ name: "A", comuns: 2, maisCaro: 1 });
    expect(p[1].indice).toBeLessThan(0);
  });
  it("movimentos: queda de 10%", () => {
    const m = movimentos([o("A", "1", 10, "2026-10-01"), o("A", "1", 9, "2026-10-08")]);
    expect(m[0].change).toBeCloseTo(-0.1);
  });
  it("cadência: quinta é o dia", () => {
    const f = ["2026-10-01", "2026-10-08", "2026-10-15"].map((d) => ({ competitor_name: "A", observed_on: d }));
    expect(cadencia(f)[0]).toMatchObject({ dia: 4, vezes: 3 });
  });
});
