import { describe, expect, it } from "vitest";
import { origemDe, primeiroPreco, ufDaCidade } from "@/lib/competition/pesquisa-online";

describe("pesquisa online", () => {
  it("separa rede social de site", () => {
    expect(origemDe("https://www.instagram.com/p/abc")).toEqual({ kind: "rede_social", name: "Instagram" });
    expect(origemDe("https://m.facebook.com/x")).toEqual({ kind: "rede_social", name: "Facebook" });
    expect(origemDe("https://www.mercadoexemplo.com.br/oferta")).toEqual({ kind: "site", name: "mercadoexemplo.com.br" });
  });
  it("lê o primeiro preço plausível", () => {
    expect(primeiroPreco("Arroz 5kg por R$ 28,90 hoje")).toBe(28.9);
    expect(primeiroPreco("De R$ 1.249,00 por")).toBe(1249);
    expect(primeiroPreco("sem preço")).toBeNull();
    expect(primeiroPreco("R$ 9.999,00")).toBeNull();
  });
  it("acha o estado na cidade", () => {
    expect(ufDaCidade("Sorocaba - SP")).toBe("SP");
    expect(ufDaCidade("Sorocaba")).toBe("");
  });
});
