import { describe, expect, it } from "vitest";
import { bestMatch, similarity } from "@/lib/competition/match";
import { adviseOnPrice, priceRole, retailPrice } from "@/lib/competition/pricing";

describe("casar produto do concorrente", () => {
  it("casa nomes parecidos e recusa tamanho diferente", () => {
    expect(similarity("Arroz Camil 5kg", "Arroz Branco Tipo 1 Camil 5kg")).toBe(1);
    expect(similarity("Coca-Cola 2L", "Refrigerante Coca-Cola 600ml")).toBeLessThan(0.6);
    const cat = [{ id: "1", name: "Leite Integral Italac 1L" }, { id: "2", name: "Leite Condensado Italac 395g" }];
    expect(bestMatch("LEITE ITALAC INTEGRAL 1 L", cat)?.item.id).toBe("1");
    expect(bestMatch("Sabão Omo 1,6kg", cat)).toBeNull();
  });
});

describe("posição de preço", () => {
  it("arredonda para final de varejo", () => {
    expect(retailPrice(10.43)).toBe(10.39);
    expect(retailPrice(5.44)).toBe(5.39);
    expect(retailPrice(3.05)).toBe(2.99);
    expect(retailPrice(24.95)).toBe(24.89);
    expect(retailPrice(7.5)).toBe(7.49);
  });

  it("atração acompanha o concorrente, margem segura", () => {
    expect(priceRole("Arroz Camil 5kg")).toBe("atracao");
    expect(priceRole("Shampoo Elseve 400ml")).toBe("margem");
    expect(adviseOnPrice(25.9, 23.9, "atracao")).toMatchObject({ kind: "baixar", suggested: 23.79 });
    expect(adviseOnPrice(21.9, 23.9, "atracao").kind).toBe("anunciar");
    expect(adviseOnPrice(16.9, 15.9, "margem").kind).toBe("manter");
    expect(adviseOnPrice(12.9, 16.9, "margem")).toMatchObject({ kind: "subir" });
  });
});
