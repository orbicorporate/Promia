import { describe, expect, it } from "vitest";
import { normalizeName, photoKey } from "@/lib/photos/key";

describe("chave de foto por nome", () => {
  it("ignora caixa, acento, ordem e espaço na unidade", () => {
    expect(photoKey("Leite Italac 1L")).toBe(photoKey("LEITE  ITALAC 1 L"));
    expect(photoKey("leite italac 1l")).toBe(photoKey("Italac Leite 1 l"));
    expect(photoKey("Café Pilão 500gr")).toBe(photoKey("cafe pilao 500 g"));
  });

  it("junta a marca quando vem em coluna separada", () => {
    expect(photoKey("Leite integral 1L", "Italac")).toBe(photoKey("Leite integral Italac 1L"));
  });

  it("não confunde tamanhos diferentes", () => {
    expect(photoKey("Coca-Cola 2L")).not.toBe(photoKey("Coca-Cola 600ml"));
  });

  it("normaliza vírgula decimal", () => {
    expect(normalizeName("Sabão em pó Omo 1,6kg")).toBe("sabao em po omo 1.6kg");
  });
});
