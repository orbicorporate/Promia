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

import { dataDoResultado } from "@/lib/competition/pesquisa-online";

describe("data do resultado da pesquisa", () => {
  const hoje = "2026-10-21";
  it("entende datas relativas em português e inglês", () => {
    expect(dataDoResultado("há 2 dias", hoje)).toBe("2026-10-19");
    expect(dataDoResultado("3 days ago", hoje)).toBe("2026-10-18");
    expect(dataDoResultado("5 horas atrás", hoje)).toBe(hoje);
    expect(dataDoResultado("1 semana atrás", hoje)).toBe("2026-10-14");
    expect(dataDoResultado("2 meses atrás", hoje)).toBe("2026-08-22");
  });
  it("entende data escrita e recusa o que não tem data", () => {
    expect(dataDoResultado("14 de out. de 2025", hoje)).toBe("2025-10-14");
    expect(dataDoResultado("Oct 14, 2025", hoje)).toBe("2025-10-14");
    expect(dataDoResultado(undefined, hoje)).toBeNull();
    expect(dataDoResultado("sem data", hoje)).toBeNull();
  });
});
