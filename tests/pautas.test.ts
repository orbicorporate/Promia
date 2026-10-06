import { describe, expect, it } from "vitest";
import { normalizePlan } from "@/lib/ai/pautas";

describe("calendário de pautas", () => {
  it("filtra datas fora do período, ordena e corrige formato", () => {
    const p = normalizePlan(
      {
        resumo: "Mês do churrasco",
        pautas: [
          { data: "2026-10-09", titulo: "Sexta da cerveja", formato: "reels", objetivo: "vender", ideia: "x", legenda: "y", produtos: ["cerveja"], pedeEncarte: true },
          { data: "2026-10-07", titulo: "Receita rápida", formato: "tiktok", objetivo: "atrair", ideia: "x", legenda: "y" },
          { data: "2026-12-01", titulo: "Fora", formato: "feed", objetivo: "vender", ideia: "x", legenda: "y" },
        ],
      },
      "2026-10-06",
      "2026-11-04"
    )!;
    expect(p.pautas.map((x) => x.data)).toEqual(["2026-10-07", "2026-10-09"]);
    expect(p.pautas[0].formato).toBe("feed");
    expect(p.pautas[1].pedeEncarte).toBe(true);
  });

  it("sem pauta válida não há calendário", () => {
    expect(normalizePlan({ pautas: [] }, "2026-10-06", "2026-11-04")).toBeNull();
  });
});
