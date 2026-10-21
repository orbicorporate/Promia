import { describe, expect, it } from "vitest";
import { localDoMercado } from "@/lib/competition/places";

describe("localDoMercado", () => {
  it("termina sempre em Brasil para a busca não achar homônimo no exterior", () => {
    expect(localDoMercado("Rua Nápoles, 120", "Sorocaba")).toBe("Rua Nápoles, 120, Sorocaba, Brasil");
    expect(localDoMercado(null, "Sorocaba - SP")).toBe("Sorocaba - SP, Brasil");
  });
  it("não repete Brasil e devolve vazio sem endereço nem cidade", () => {
    expect(localDoMercado("Rua A", "Votorantim, Brasil")).toBe("Rua A, Votorantim, Brasil");
    expect(localDoMercado("", null)).toBe("");
  });
});

describe("localDoMercado com estado", () => {
  it("inclui a UF e não duplica quando a cidade já termina nela", () => {
    expect(localDoMercado("Rua A, 1", "Sorocaba", "SP")).toBe("Rua A, 1, Sorocaba, SP, Brasil");
    expect(localDoMercado("Rua A, 1", "Sorocaba - SP", "SP")).toBe("Rua A, 1, Sorocaba - SP, Brasil");
  });
});
