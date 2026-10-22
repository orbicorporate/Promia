import { describe, expect, it } from "vitest";
import { especialistaValido, hrefDaAcao, normalizarResposta, respostaDoTexto } from "@/lib/ai/chat";

describe("chat do gerente", () => {
  it("monta botões só com endereços permitidos", () => {
    const out = normalizarResposta(
      { resposta: "Destaque o arroz.", acoes: [{ tipo: "montar_encarte", rotulo: "Montar encarte", ocasiao: "Halloween" }, { tipo: "hackear", rotulo: "Mal" }, { tipo: "ver_vendas", rotulo: "Ver vendas" }] },
      "mercado-x"
    );
    expect(out?.acoes).toEqual([
      { rotulo: "Montar encarte", href: "/mercado-x/encartes/novo?ocasiao=Halloween" },
      { rotulo: "Ver vendas", href: "/mercado-x/vendas" },
    ]);
  });
  it("limita a 3 botões, sem repetir", () => {
    const acoes = Array.from({ length: 6 }, (_, i) => ({ tipo: i % 2 ? "ver_vendas" : "ver_bairro", rotulo: `A${i}` }));
    expect(normalizarResposta({ resposta: "ok", acoes }, "m")?.acoes).toHaveLength(2);
  });
  it("tira travessão e negrito da resposta", () => {
    expect(normalizarResposta({ resposta: "**Arroz** — em alta" }, "m")?.resposta).toBe("Arroz, em alta");
  });
  it("sem resposta, devolve nulo", () => {
    expect(normalizarResposta({ resposta: "  " }, "m")).toBeNull();
    expect(normalizarResposta(null, "m")).toBeNull();
  });
  it("aceita texto puro quando a IA não devolve JSON", () => {
    expect(respostaDoTexto("Vale destacar o café.", "m")).toEqual({ resposta: "Vale destacar o café.", acoes: [] });
    expect(respostaDoTexto("", "m")).toBeNull();
  });
  it("valida o especialista e escapa a ocasião", () => {
    expect(especialistaValido("vendas")).toBe(true);
    expect(especialistaValido("rh")).toBe(false);
    expect(hrefDaAcao("m", "montar_encarte", "Dia das Mães & filhos")).toBe("/m/encartes/novo?ocasiao=Dia%20das%20M%C3%A3es%20%26%20filhos");
  });
});

import { normalizarPlano } from "@/lib/ai/plano";

describe("plano de marketing", () => {
  it("monta semanas e botões permitidos", () => {
    const p = normalizarPlano(
      { resumo: "Foco em famílias", semanas: [{ titulo: "Aquecer", foco: "Divulgar", passos: [{ acao: "Postar o encarte", canal: "Instagram", quando: "sexta", tipo: "montar_encarte", rotulo: "Montar", ocasiao: "Halloween" }, { acao: "Avisar clientes", canal: "WhatsApp", quando: "sábado", tipo: "x" }, { acao: "" }] }, { titulo: "vazia", passos: [] }], metricas: ["Mensagens"] },
      "m"
    );
    expect(p?.semanas).toHaveLength(1);
    expect(p?.semanas[0].passos).toHaveLength(2);
    expect(p?.semanas[0].passos[0].botao?.href).toBe("/m/encartes/novo?ocasiao=Halloween");
    expect(p?.semanas[0].passos[1].botao).toBeNull();
  });
  it("sem semanas, devolve nulo", () => {
    expect(normalizarPlano({ semanas: [] }, "m")).toBeNull();
    expect(normalizarPlano("x", "m")).toBeNull();
  });
});
