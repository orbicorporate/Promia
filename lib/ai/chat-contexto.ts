import type { SupabaseClient } from "@supabase/supabase-js";
import { promptSafe, weekdayName } from "./gerente";
import type { EspecialistaKey } from "./chat";
import { seasonalDatesInRange } from "@/lib/seasonalDates";
import { addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { loadSalesAnalysis } from "@/lib/sales/load";
import { compareprices } from "@/lib/competition/compare";

// Monta o bloco <dados> do chat: só o que o especialista precisa, compacto,
// para a conversa ficar barata e a resposta ficar no assunto.

const pct = (n: number) => `${n > 0 ? "+" : ""}${Math.round(n * 100)}%`;

export async function montarContexto(admin: SupabaseClient, marketId: string, esp: EspecialistaKey): Promise<{ nome: string; slug: string; dados: string } | null> {
  const hoje = todayInSaoPaulo();
  const quer = (...e: EspecialistaKey[]) => esp === "geral" || e.includes(esp);

  const [{ data: market }, sales, { data: obs }, { data: bairro }, { data: weekly }, { data: cat }] = await Promise.all([
    admin.from("markets").select("name, slug, niche, city").eq("id", marketId).single(),
    quer("vendas", "encartes", "bairro") ? loadSalesAnalysis(admin, marketId) : Promise.resolve(null),
    quer("concorrencia") ? admin.from("competitor_prices").select("product_id, product_name, competitor_name, price, observed_on").eq("market_id", marketId).gte("observed_on", addDaysISO(hoje, -45)).limit(2000) : Promise.resolve({ data: null }),
    quer("bairro", "encartes") ? admin.from("market_insights").select("content").eq("market_id", marketId).eq("kind", "bairro").maybeSingle() : Promise.resolve({ data: null }),
    quer("encartes", "vendas") ? admin.from("weekly_promotions").select("weekday, name").eq("market_id", marketId).eq("active", true) : Promise.resolve({ data: null }),
    quer("encartes", "concorrencia") ? admin.from("products").select("name, category, price").eq("market_id", marketId).eq("active", true).not("price", "is", null).order("name").limit(80) : Promise.resolve({ data: null }),
  ]);
  if (!market) return null;

  const blocos: string[] = [`Mercado: ${promptSafe(market.name)}${market.niche ? ` (${promptSafe(market.niche)})` : ""}${market.city ? `, ${promptSafe(market.city)}` : ""}. Hoje: ${hoje}.`];

  const a = sales?.analysis;
  if (a?.period) {
    blocos.push(
      `<vendas>\nPeríodo ${a.period.start} a ${a.period.end}. Faturamento R$ ${Math.round(a.kpis.revenue)}${a.kpis.revenueChange != null ? ` (${pct(a.kpis.revenueChange)} no ritmo)` : ""}.\n` +
        `Mais vendidos: ${a.top.slice(0, 12).map((t) => promptSafe(t.name)).join(", ")}.\n` +
        (a.rising.length ? `Em alta: ${a.rising.map((t) => `${promptSafe(t.name)} ${pct(t.change)}`).join(", ")}.\n` : "") +
        (a.falling.length ? `Em queda: ${a.falling.map((t) => `${promptSafe(t.name)} ${pct(t.change)}`).join(", ")}.\n` : "") +
        (a.stale.length ? `Sem venda no período: ${a.stale.slice(0, 12).map((t) => promptSafe(t.name)).join(", ")}.\n` : "") +
        (a.categories.length ? `Categorias: ${a.categories.slice(0, 8).map((c) => `${promptSafe(c.name)} ${Math.round(c.share * 100)}%`).join(", ")}.\n` : "") +
        (a.campaigns.length ? `Encartes anteriores: ${a.campaigns.map((c) => `${promptSafe(c.name)} ${c.lift != null ? pct(c.lift) : "sem base"}`).join(", ")}.` : "") +
        `\n</vendas>`
    );
  } else if (quer("vendas", "encartes")) {
    blocos.push("<vendas>Nenhum relatório de vendas enviado ainda.</vendas>");
  }

  if (quer("concorrencia")) {
    if (obs?.length) {
      const ids = [...new Set(obs.map((o) => o.product_id).filter((x): x is string => !!x))].slice(0, 500);
      const { data: ours } = ids.length ? await admin.from("products").select("id, name, category, price").in("id", ids) : { data: [] };
      const cmp = compareprices(
        obs.map((o) => ({ ...o, price: Number(o.price) })),
        (ours ?? []).map((p) => ({ ...p, price: p.price == null ? null : Number(p.price) }))
      );
      const linhas = cmp.rows.slice(0, 30).map((r) => `${promptSafe(r.name)}: seu R$ ${r.ours ?? "?"} x ${promptSafe(r.competitor)} R$ ${r.theirs}`);
      blocos.push(`<concorrencia>\n${linhas.join("\n") || "Sem produtos em comum com o concorrente ainda."}\n</concorrencia>`);
    } else {
      blocos.push("<concorrencia>Nenhum preço de concorrente nos últimos 45 dias.</concorrencia>");
    }
  }

  const b = bairro?.content as { perfil?: string; publicos?: { nome: string; descricao?: string }[] } | undefined;
  if (b?.perfil) blocos.push(`<bairro>\n${promptSafe(b.perfil)}\nPúblicos: ${(b.publicos ?? []).map((p) => promptSafe(p.nome)).join(", ")}.\n</bairro>`);
  else if (quer("bairro")) blocos.push("<bairro>Análise de bairro ainda não feita.</bairro>");

  if (quer("encartes", "bairro")) {
    const datas = seasonalDatesInRange(hoje, addDaysISO(hoje, 45)).map((d) => `${d.date}: ${d.title}`);
    blocos.push(`<datas>\n${datas.join("\n") || "nenhuma data relevante nos próximos 45 dias"}\n</datas>`);
  }
  if (weekly?.length) blocos.push(`<promocoes_fixas>\n${weekly.map((w) => `${weekdayName(w.weekday)}: ${promptSafe(w.name)}`).join("\n")}\n</promocoes_fixas>`);
  if (cat?.length) blocos.push(`<catalogo amostra="${cat.length}">\n${cat.map((p) => `${promptSafe(p.name)} (${promptSafe(p.category) || "sem categoria"}) R$ ${p.price}`).join("\n")}\n</catalogo>`);

  return { nome: market.name, slug: market.slug, dados: blocos.join("\n\n") };
}
