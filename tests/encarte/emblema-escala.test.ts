import { describe, expect, it } from "vitest";
import { clampEscala, juntarEmblema, lerEmblema } from "@/lib/encarte/emblema-escala";
import { limparRodape, rodapeDados, RODAPE_PADRAO } from "@/lib/encarte/rodape";
import { limparValidade } from "@/lib/encarte/validade";

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
    expect(juntarEmblema("a", 1, {})).toBe("a");
    expect(juntarEmblema("a", 1.2, { estilo: "contorno", posicao: "base", alinhamento: "esquerda", cor: "preto" })).toBe("a~120~vcontorno~pbase~aesquerda~cpreto");
    expect(lerEmblema("a~120~vcontorno~pbase~aesquerda~cpreto")).toMatchObject({
      slug: "a",
      escala: 1.2,
      validade: { estilo: "contorno", posicao: "base", alinhamento: "esquerda", cor: "preto", rotulo: "" },
    });
    expect(lerEmblema("a~vlixo~pxx~cneon").validade).toEqual({ estilo: "cheia", posicao: "sobre", alinhamento: "direita", cor: "branco", rotulo: "" });
    expect(lerEmblema("a~130")).toMatchObject({ escala: 1.3 });
  });
  it("grava o texto da tag sem quebrar o separador", () => {
    const raw = juntarEmblema("a", 1, { rotulo: "Só até ~ sábado" });
    expect(raw).toBe(`a~t${encodeURIComponent("Só até sábado")}`);
    expect(lerEmblema(raw).validade.rotulo).toBe("Só até sábado");
    expect(juntarEmblema("a", 1, { rotulo: "  " })).toBe("a");
  });
  it("limpa o que vem de fora", () => {
    expect(limparValidade({ estilo: "x", cor: "verde", posicao: "base" })).toEqual({ cor: "verde", posicao: "base" });
    expect(limparValidade(null)).toEqual({});
  });
});

describe("rodapé junto do emblema", () => {
  it("grava estilo, cor e frase, e lê de volta", () => {
    const raw = juntarEmblema("a", 1, {}, { estilo: "pilula", cor: "preto", texto: "Aberto até as 22h ~" });
    expect(raw).toBe(`a~rpilula~kpreto~x${encodeURIComponent("Aberto até as 22h")}`);
    expect(lerEmblema(raw).rodape).toEqual({ ...RODAPE_PADRAO, estilo: "pilula", cor: "preto", texto: "Aberto até as 22h" });
    expect(lerEmblema("a").rodape).toEqual(RODAPE_PADRAO);
  });
  it("vale também sem logo de campanha", () => {
    const raw = juntarEmblema(null, 1, { posicao: "base" }, { estilo: "claro" });
    expect(raw).toBe("~pbase~rclaro");
    const lido = lerEmblema(raw);
    expect(lido.slug).toBeNull();
    expect(lido.validade.posicao).toBe("base");
    expect(lido.rodape.estilo).toBe("claro");
    expect(juntarEmblema(null, 1)).toBeNull();
  });
  it("grava nome, contatos, horário e as partes escondidas", () => {
    const op = { nome: "Mercado Bom Preço", whatsapp: "(15) 99999-0000", instagram: "bompreco", horario: "Seg a Sáb 8h às 20h", ocultar: ["selo", "endereco"] as ("selo" | "endereco")[] };
    const raw = juntarEmblema("a", 1, {}, op);
    expect(raw).toContain("~m" + "se");
    const lido = lerEmblema(raw).rodape;
    expect(lido).toMatchObject({ nome: "Mercado Bom Preço", whatsapp: "(15) 99999-0000", instagram: "bompreco", horario: "Seg a Sáb 8h às 20h", ocultar: ["selo", "endereco"] });
    expect(juntarEmblema("a", 1, {}, {})).toBe("a");
  });
  it("monta o que aparece, com o digitado por cima do cadastro", () => {
    const m = { name: "Mercado X", address: "Rua A, 1", city: "Votorantim", whatsapp: "111", instagram: "@mx" };
    expect(rodapeDados(m, RODAPE_PADRAO)).toMatchObject({ nome: "Mercado X", linha2: "Rua A, 1 - Votorantim", contato: "WhatsApp 111   @mx", horario: "", mostrarSelo: true });
    const d = rodapeDados(m, { ...RODAPE_PADRAO, nome: "MX Atacado", whatsapp: "222", ocultar: ["endereco", "selo"], horario: "24h" });
    expect(d).toMatchObject({ nome: "MX Atacado", linha2: "", contato: "WhatsApp 222   @mx", horario: "24h", mostrarSelo: false });
  });
  it("ignora valores inválidos", () => {
    expect(limparRodape({ estilo: "x", cor: "verde", texto: 5 })).toEqual({ cor: "verde" });
  });
});
