import type { SalesAnalysis } from "./analyze";

// Sugestões do Promia: o que o gerente de marketing diria olhando os números.
// Cada uma traz o dado que motivou e o que fazer, em palavras de loja.

export type Sugestao = {
  id: string;
  tom: "alta" | "queda" | "parado" | "margem" | "campanha" | "aviso";
  titulo: string;
  porque: string;
  fazer: string;
  produtos?: (string | null)[];
  encarteId?: string;
};

const pct = (n: number) => `${Math.round(Math.abs(n) * 100)}%`;
const lista = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);

export function sugerir(a: SalesAnalysis): Sugestao[] {
  const out: Sugestao[] = [];
  if (!a.period) return out;

  const topKeys = new Set(a.top.map((t) => t.key));

  // queda em produto importante: promoção para recuperar
  const caiu = a.falling.filter((f) => topKeys.has(f.key) || f.now > 0).slice(0, 3);
  if (caiu.length) {
    out.push({
      id: "queda",
      tom: "queda",
      titulo: `Faça promoção de ${lista(caiu.map((c) => c.name))}`,
      porque: caiu.map((c) => `${c.name} caiu ${pct(c.change)} no ritmo semanal`).join("; ") + ".",
      fazer: "Coloque no encarte da semana com preço chamativo e na frente da loja para recuperar a venda.",
      produtos: caiu.map((c) => c.productId),
    });
  }

  // em alta: aproveite o embalo
  const subiu = a.rising.slice(0, 3);
  if (subiu.length) {
    out.push({
      id: "alta",
      tom: "alta",
      titulo: `Dê destaque a ${lista(subiu.map((c) => c.name))}`,
      porque: subiu.map((c) => `${c.name} subiu ${pct(c.change)}`).join("; ") + ".",
      fazer: "Está pegando. Ponha em destaque no topo do encarte e garanta estoque antes de anunciar.",
      produtos: subiu.map((c) => c.productId),
    });
  }

  // vende muito, margem baixa: revise o preço antes de dar desconto
  const magra = a.abc.a.filter((l) => l.margin != null && l.margin < 0.12).slice(0, 3);
  if (magra.length) {
    out.push({
      id: "margem",
      tom: "margem",
      titulo: `Cuidado com o preço de ${lista(magra.map((c) => c.name))}`,
      porque: magra.map((c) => `${c.name} é ${pct(c.share)} do faturamento e dá só ${pct(c.margin ?? 0)} de margem`).join("; ") + ".",
      fazer: "Não faça desconto nesses. Veja se dá para subir um pouco o preço ou negociar o custo com o fornecedor.",
    });
  }

  // parados com estoque: queima
  const parados = a.stale.filter((s) => (s.stock ?? 0) > 0);
  const base = parados.length >= 3 ? parados : a.stale;
  if (base.length >= 2) {
    const nomes = base.slice(0, 4).map((s) => s.name);
    out.push({
      id: "parado",
      tom: "parado",
      titulo: `Queime o estoque parado de ${lista(nomes.slice(0, 3))}${base.length > 3 ? " e outros" : ""}`,
      porque: `${base.length} produtos do catálogo não venderam nada no período${parados.length ? `, ${parados.length} com estoque` : ""}.`,
      fazer: "Monte um encarte de queima com preço de oportunidade ou leve dois, ou ponha na ponta de gôndola.",
      produtos: base.map((s) => s.id),
    });
  }

  // campanhas
  const boa = a.campaigns.find((c) => c.lift != null && c.lift >= 0.15);
  if (boa) {
    out.push({
      id: "repetir",
      tom: "campanha",
      titulo: `Repita o encarte ${boa.name}`,
      porque: `Os produtos dele venderam ${pct(boa.lift ?? 0)} mais durante a validade.`,
      fazer: "Funcionou. Refaça com os mesmos produtos de maior giro e renove a data.",
      encarteId: boa.id,
    });
  }
  const ruim = a.campaigns.find((c) => c.lift != null && c.lift < 0.03);
  if (ruim) {
    out.push({
      id: "revisar",
      tom: "campanha",
      titulo: `Mude os produtos do encarte ${ruim.name}`,
      porque: `Durante a validade, os produtos dele não venderam mais que o normal (${(ruim.lift ?? 0) >= 0 ? "+" : "-"}${pct(ruim.lift ?? 0)}).`,
      fazer: "Troque por itens da curva A ou em alta e destaque mais o preço.",
      encarteId: ruim.id,
    });
  }

  // curva A: proteger
  if (a.abc.a.length >= 3 && out.length < 5) {
    const t = a.abc.a.slice(0, 3);
    out.push({
      id: "curva-a",
      tom: "alta",
      titulo: `Não deixe faltar ${lista(t.map((x) => x.name))}`,
      porque: `${a.abc.countA === 1 ? "1 produto faz" : `${a.abc.countA} produtos fazem`} ${pct(a.abc.shareA)} do faturamento.`,
      fazer: "Confira o estoque toda segunda e evite subir o preço deles. São o que traz cliente.",
    });
  }

  if (a.previousPeriods === 0) {
    out.push({ id: "mais", tom: "aviso", titulo: "Envie mais uma semana de vendas", porque: "Com um período só não dá para ver o que sobe e o que cai.", fazer: "Envie o relatório da semana anterior para o Promia comparar e sugerir promoções melhores." });
  }
  return out.slice(0, 6);
}
