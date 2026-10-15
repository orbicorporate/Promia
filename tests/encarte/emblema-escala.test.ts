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
    expect(lerEmblema("ofertas-da-semana~125")).toMatchObject({ slug: "ofertas-da-semana", escala: 1.25 });
    expect(lerEmblema("ofertas-da-semana")).toMatchObject({ slug: "ofertas-da-semana", escala: 1 });
    expect(lerEmblema(null)).toMatchObject({ slug: null, escala: 1 });
    expect(juntarEmblema(null, 1.2)).toBeNull();
  });
});

describe("validade junto do emblema", () => {
  it("grava só o que foge do padrão e lê de volta", () => {
    expect(juntarEmblema("a", 1, "pilula", "sobre")).toBe("a");
    expect(juntarEmblema("a", 1.2, "selo", "canto")).toBe("a~120~vselo~pcanto");
    expect(lerEmblema("a~120~vselo~pcanto")).toEqual({ slug: "a", escala: 1.2, validadeEstilo: "selo", validadePosicao: "canto" });
    expect(lerEmblema("a~vlixo~pxx")).toEqual({ slug: "a", escala: 1, validadeEstilo: "pilula", validadePosicao: "sobre" });
    expect(lerEmblema("a~130")).toMatchObject({ escala: 1.3, validadePosicao: "sobre" });
  });
});
