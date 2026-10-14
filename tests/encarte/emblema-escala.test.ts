import { describe, expect, it } from "vitest";
import { clampEscala, juntarEmblema, lerEmblema } from "@/lib/encarte/emblema-escala";

describe("tamanho do logo", () => {
  it("limita entre 60% e 160%", () => {
    expect(clampEscala(0.1)).toBe(0.6);
    expect(clampEscala(9)).toBe(1.6);
    expect(clampEscala("x")).toBe(1);
    expect(clampEscala(undefined)).toBe(1);
  });
  it("guarda e lê o fator junto do slug", () => {
    expect(juntarEmblema("ofertas-da-semana", 1)).toBe("ofertas-da-semana");
    expect(juntarEmblema("ofertas-da-semana", 1.25)).toBe("ofertas-da-semana~125");
    expect(lerEmblema("ofertas-da-semana~125")).toEqual({ slug: "ofertas-da-semana", escala: 1.25 });
    expect(lerEmblema("ofertas-da-semana")).toEqual({ slug: "ofertas-da-semana", escala: 1 });
    expect(lerEmblema(null)).toEqual({ slug: null, escala: 1 });
    expect(juntarEmblema(null, 1.2)).toBeNull();
  });
});
