import { describe, expect, it } from "vitest";
import { normalizeRecommendations } from "@/lib/ai/gerente";

describe("normalizeRecommendations", () => {
  it("corrige prioridade sem acento, descarta tipo fora da lista e tira travessão", () => {
    const out = normalizeRecommendations({
      recommendations: [
        { type: "Repor Estoque", target: "Leite", reason: "Estoque baixo — só 3 unidades.", priority: "media" },
        { type: "inventado", target: "X", reason: "Y", priority: "alta" },
        { type: "destacar", target: "", reason: "sem alvo", priority: "alta" },
        { type: "promover", target: "Carnes", reason: "Fim de semana de churrasco.", priority: "ALTA" },
      ],
    });
    expect(out).toEqual([
      { type: "repor_estoque", target: "Leite", reason: "Estoque baixo, só 3 unidades.", priority: "média" },
      { type: "promover", target: "Carnes", reason: "Fim de semana de churrasco.", priority: "alta" },
    ]);
  });

  it("aguenta resposta vazia ou quebrada", () => {
    expect(normalizeRecommendations(null)).toEqual([]);
    expect(normalizeRecommendations({ recommendations: "x" })).toEqual([]);
  });
});
