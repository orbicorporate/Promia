import { describe, expect, it } from "vitest";
import { salvageList } from "@/lib/ai/salvage";

describe("salvageList", () => {
  it("aproveita os objetos completos de uma resposta cortada", () => {
    const text = '{"resumo":"Mês de \\"calor\\"","pautas":[{"data":"2026-10-10","titulo":"A {x}"},{"data":"2026-10-11","titulo":"B"},{"data":"2026-10-12","tit';
    expect(salvageList(text, "pautas", ["resumo"])).toEqual({ pautas: [{ data: "2026-10-10", titulo: "A {x}" }, { data: "2026-10-11", titulo: "B" }], resumo: 'Mês de "calor"' });
  });
  it("pula objeto quebrado e devolve null sem lista", () => {
    expect(salvageList('{"pautas":[{"a":1,}, {"b":2}]}', "pautas")).toEqual({ pautas: [{ b: 2 }] });
    expect(salvageList("nada aqui", "pautas")).toBeNull();
  });
});
