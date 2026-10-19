import { describe, expect, it } from "vitest";
import { resumoWhatsApp } from "@/lib/competition/resumo";
import { chaveTelefone } from "@/lib/whatsapp";

describe("resumo do WhatsApp", () => {
  it("compara e lista o que está mais caro e mais barato", () => {
    const t = resumoWhatsApp("Mercado A", [
      { product_name: "Arroz 5kg", product_id: "1", price: 27.99 },
      { product_name: "Leite 1L", product_id: "2", price: 5.5 },
      { product_name: "Outro", product_id: null, price: 3 },
    ], [{ id: "1", name: "Arroz Camil 5kg", price: 29.9 }, { id: "2", name: "Leite Italac 1L", price: 4.99 }], "https://x/y");
    expect(t).toMatch(/Li 3 preços do Mercado A/);
    expect(t).toMatch(/mais caro em 1 e mais barato em 1/);
    expect(t).toMatch(/Arroz Camil 5kg: você R\$ 29,90, eles R\$ 27,99/);
  });
  it("avisa quando nada bate com o catálogo", () => {
    expect(resumoWhatsApp("B", [{ product_name: "x", product_id: null, price: 1 }], [], "l")).toMatch(/Nenhum bateu/);
  });
  it("compara telefone com e sem 55 e com o 9 extra", () => {
    expect(chaveTelefone("5515991234567")).toBe(chaveTelefone("(15) 99123-4567"));
    expect(chaveTelefone("551591234567")).toBe(chaveTelefone("15991234567"));
  });
});
