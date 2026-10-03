import { describe, expect, it } from "vitest";
import { measureText, slugify, validityLabel, wrapLines, wrapMeasured } from "@/lib/encarte/text";

describe("wrapLines", () => {
  it("quebra por palavra respeitando o limite", () => {
    expect(wrapLines("Café Torrado e Moído 500g", 14, 2)).toEqual(["Café Torrado e", "Moído 500g"]);
  });
  it("corta com reticências quando passa de maxLines", () => {
    const lines = wrapLines("Papel Higiênico Folha Dupla Neutro 12 rolos", 16, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(16);
  });
  it("corta palavra gigante", () => {
    const lines = wrapLines("Superextraordinariamente", 10, 1);
    expect(lines[0].length).toBeLessThanOrEqual(10);
    expect(lines[0].endsWith("…")).toBe(true);
  });
  it("texto vazio não gera linha", () => {
    expect(wrapLines("   ", 10, 2)).toEqual([]);
  });
});

describe("wrapMeasured", () => {
  it("mede com a fonte real: maiúsculas ocupam mais que minúsculas", () => {
    expect(measureText("MMMM", "display800", 100)).toBeGreaterThan(measureText("iiii", "display800", 100));
    expect(measureText("abc", "text600", 20)).toBeCloseTo(measureText("abc", "text600", 10) * 2);
  });
  it("nenhuma linha passa da largura", () => {
    const lines = wrapMeasured("Queijo Mussarela Fatiado Tirolez 150g Embalagem Econômica", 260, "text600", 24, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
    for (const l of lines) expect(measureText(l, "text600", 24)).toBeLessThanOrEqual(260);
  });
});

describe("validityLabel", () => {
  it("de/até", () => {
    expect(validityLabel("2026-10-03", "2026-10-09")).toBe("Ofertas válidas de 03/10 a 09/10");
  });
  it("só até", () => {
    expect(validityLabel(null, "2026-10-09")).toBe("Ofertas válidas até 09/10");
  });
  it("só a partir de", () => {
    expect(validityLabel("2026-10-03", null)).toBe("Ofertas válidas a partir de 03/10");
  });
  it("um dia só", () => {
    expect(validityLabel("2026-10-07", "2026-10-07")).toBe("Oferta válida somente em 07/10");
  });
  it("sem datas", () => {
    expect(validityLabel(null, undefined)).toBeNull();
  });
});

describe("slugify", () => {
  it("gera nome de arquivo amigável", () => {
    expect(slugify("Ofertas da Semana — Açougue!")).toBe("ofertas-da-semana-acougue");
    expect(slugify("   ")).toBe("encarte");
  });
});
