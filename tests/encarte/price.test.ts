import { describe, expect, it } from "vitest";
import { discountLabel, discountPercent, effectiveOldPrice, formatBRL, limitLabel, oldPriceLabel, priceParts, unitSuffix } from "@/lib/encarte/price";

describe("priceParts", () => {
  it("separa R$, inteiro e centavos", () => {
    expect(priceParts(9.9)).toEqual({ currency: "R$", integer: "9", cents: ",90" });
    expect(priceParts(0.99)).toEqual({ currency: "R$", integer: "0", cents: ",99" });
    expect(priceParts(54)).toEqual({ currency: "R$", integer: "54", cents: ",00" });
  });

  it("põe ponto de milhar", () => {
    expect(priceParts(1299.9).integer).toBe("1.299");
    expect(priceParts(1234567.5)).toEqual({ currency: "R$", integer: "1.234.567", cents: ",50" });
  });

  it("arredonda centavos sem erro de ponto flutuante", () => {
    expect(priceParts(4.785).cents).toBe(",79");
    expect(priceParts(19.999)).toEqual({ currency: "R$", integer: "20", cents: ",00" });
    expect(priceParts(0.1 + 0.2).cents).toBe(",30");
  });

  it("nunca mostra negativo nem NaN", () => {
    expect(priceParts(-3).integer).toBe("0");
    expect(priceParts(Number.NaN)).toEqual({ currency: "R$", integer: "0", cents: ",00" });
  });
});

describe("formatBRL", () => {
  it("formata no padrão brasileiro", () => {
    expect(formatBRL(9.99)).toBe("R$ 9,99");
    expect(formatBRL(1299.9)).toBe("R$ 1.299,90");
  });
});

describe("unitSuffix", () => {
  it("kg e afins viram /unidade", () => {
    expect(unitSuffix("kg")).toBe("/kg");
    expect(unitSuffix("KG")).toBe("/kg");
    expect(unitSuffix("bdj")).toBe("/bandeja");
    expect(unitSuffix("fd")).toBe("/fardo");
  });
  it("un vira 'cada', nunca '/un'", () => {
    expect(unitSuffix("un")).toBe("cada");
  });
  it("sem unidade não tem sufixo", () => {
    expect(unitSuffix(null)).toBe("");
    expect(unitSuffix(undefined)).toBe("");
    expect(unitSuffix("  ")).toBe("");
  });
});

describe("preço de/por e desconto", () => {
  it("só usa o preço 'de' quando é maior", () => {
    expect(effectiveOldPrice(9.9, 12.9)).toBe(12.9);
    expect(effectiveOldPrice(9.9, 9.9)).toBeNull();
    expect(effectiveOldPrice(9.9, 5)).toBeNull();
    expect(effectiveOldPrice(9.9, null)).toBeNull();
    expect(oldPriceLabel(7.49, 9.99)).toBe("de R$ 9,99");
    expect(oldPriceLabel(7.49, 7.49)).toBeNull();
  });

  it("calcula o desconto arredondado", () => {
    expect(discountPercent(7.99, 9.99)).toBe(20);
    expect(discountPercent(42.9, 54.9)).toBe(22);
    expect(discountLabel(42.9, 54.9)).toBe("-22%");
  });

  it("não mostra selo abaixo de 5%", () => {
    expect(discountPercent(9.6, 10)).toBeNull(); // 4%
    expect(discountPercent(9.5, 10)).toBe(5);
    expect(discountLabel(9.9, 9.99)).toBeNull();
    expect(discountLabel(9.9, null)).toBeNull();
  });
});

describe("limitLabel", () => {
  it("monta o texto de limite", () => {
    expect(limitLabel(3)).toBe("Limite de 3 por cliente");
    expect(limitLabel(1)).toBe("Limite de 1 por cliente");
  });
  it("ignora valores inválidos", () => {
    expect(limitLabel(0)).toBeNull();
    expect(limitLabel(null)).toBeNull();
    expect(limitLabel(Number.NaN)).toBeNull();
  });
});
