// Análise das vendas importadas: o que o gerente de marketing olharia
// toda semana. Função pura sobre os registros já buscados do banco.

export type SaleRec = { product_id: string | null; name: string; category: string | null; period_start: string; period_end: string; qty: number; revenue: number; cost: number | null };
export type CatalogRef = { id: string; name: string; category: string | null; price: number | null; cost: number | null; stock: number | null };
export type EncarteRef = { id: string; name: string; valid_from: string | null; valid_until: string | null; productIds: string[] };

export type ProductLine = { key: string; productId: string | null; name: string; category: string | null; qty: number; revenue: number; share: number; margin: number | null };
export type Trend = { key: string; productId: string | null; name: string; change: number; before: number; now: number };
export type CampaignResult = { id: string; name: string; lift: number | null; revenueDuring: number; products: number };

export type SalesAnalysis = {
  period: { start: string; end: string; days: number } | null;
  previousPeriods: number;
  kpis: { revenue: number; qty: number; products: number; grossMargin: number | null; revenueChange: number | null };
  abc: { a: ProductLine[]; countA: number; countB: number; countC: number; shareA: number };
  top: ProductLine[];
  rising: Trend[];
  falling: Trend[];
  categories: { name: string; revenue: number; share: number; change: number | null }[];
  stale: { id: string; name: string; stock: number | null }[];
  campaigns: CampaignResult[];
};

const days = (a: string, b: string) => Math.max(1, Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000) + 1);
const keyOf = (r: { product_id: string | null; name: string }) => r.product_id ?? `n:${r.name.toLowerCase()}`;
const overlaps = (s: string, e: string, from: string | null, until: string | null) => (!from || from <= e) && (!until || until >= s);

export function analyzeSales(records: SaleRec[], catalog: CatalogRef[], encartes: EncarteRef[]): SalesAnalysis {
  const periods = [...new Map(records.map((r) => [`${r.period_start}|${r.period_end}`, { start: r.period_start, end: r.period_end }])).values()].sort((a, b) => a.end.localeCompare(b.end));
  const empty: SalesAnalysis = { period: null, previousPeriods: 0, kpis: { revenue: 0, qty: 0, products: 0, grossMargin: null, revenueChange: null }, abc: { a: [], countA: 0, countB: 0, countC: 0, shareA: 0 }, top: [], rising: [], falling: [], categories: [], stale: [], campaigns: [] };
  if (periods.length === 0) return empty;

  const last = periods[periods.length - 1];
  const lastDays = days(last.start, last.end);
  const isLast = (r: SaleRec) => r.period_start === last.start && r.period_end === last.end;
  const current = records.filter(isLast);
  const previous = records.filter((r) => !isLast(r) && r.period_end < last.start);
  const prevPeriods = periods.filter((p) => p.end < last.start);
  const prevDays = prevPeriods.reduce((s, p) => s + days(p.start, p.end), 0);
  const byId = new Map(catalog.map((c) => [c.id, c]));

  // linhas do período atual por produto
  const lines = new Map<string, ProductLine & { costSum: number | null }>();
  for (const r of current) {
    const k = keyOf(r);
    const cat = r.product_id ? byId.get(r.product_id) : undefined;
    const l = lines.get(k) ?? { key: k, productId: r.product_id, name: cat?.name ?? r.name, category: cat?.category ?? r.category, qty: 0, revenue: 0, share: 0, margin: null, costSum: 0 };
    l.qty += r.qty;
    l.revenue += r.revenue;
    const unitCost = r.cost != null ? r.cost : cat?.cost != null ? cat.cost * r.qty : null;
    l.costSum = l.costSum == null || unitCost == null ? null : l.costSum + unitCost;
    lines.set(k, l);
  }
  const all = [...lines.values()].sort((a, b) => b.revenue - a.revenue);
  const revenue = all.reduce((s, l) => s + l.revenue, 0);
  const qty = all.reduce((s, l) => s + l.qty, 0);
  for (const l of all) {
    l.share = revenue ? l.revenue / revenue : 0;
    l.margin = l.costSum != null && l.revenue > 0 ? (l.revenue - l.costSum) / l.revenue : null;
  }
  const withCost = all.filter((l) => l.costSum != null);
  const grossMargin = withCost.length >= all.length * 0.5 && withCost.length > 0 ? withCost.reduce((s, l) => s + (l.revenue - (l.costSum ?? 0)), 0) / withCost.reduce((s, l) => s + l.revenue, 0) : null;

  // curva ABC: A até 80% do faturamento, B até 95%, C o resto
  let acc = 0;
  let countA = 0;
  let countB = 0;
  for (const l of all) {
    acc += l.share;
    if (acc <= 0.8 || countA === 0) countA++;
    else if (acc <= 0.95) countB++;
  }
  const countC = all.length - countA - countB;
  const clean = (l: ProductLine & { costSum?: number | null }): ProductLine => ({ key: l.key, productId: l.productId, name: l.name, category: l.category, qty: l.qty, revenue: l.revenue, share: l.share, margin: l.margin });

  // tendência: ritmo diário agora contra a média dos períodos anteriores
  const prevRate = new Map<string, { name: string; productId: string | null; qty: number; revenue: number }>();
  for (const r of previous) {
    const k = keyOf(r);
    const p = prevRate.get(k) ?? { name: r.name, productId: r.product_id, qty: 0, revenue: 0 };
    p.qty += r.qty;
    p.revenue += r.revenue;
    prevRate.set(k, p);
  }
  const trends: Trend[] = [];
  if (prevDays > 0) {
    const keys = new Set([...lines.keys(), ...prevRate.keys()]);
    for (const k of keys) {
      const nowL = lines.get(k);
      const before = prevRate.get(k);
      const nowRate = (nowL?.revenue ?? 0) / lastDays;
      const beforeRate = (before?.revenue ?? 0) / prevDays;
      if (Math.max(nowRate, beforeRate) * 7 < revenue / Math.max(1, all.length) * (7 / lastDays) * 0.5) continue; // ignora o miúdo
      if (beforeRate === 0) continue;
      trends.push({ key: k, productId: nowL?.productId ?? before?.productId ?? null, name: nowL?.name ?? before?.name ?? k, change: nowRate / beforeRate - 1, before: beforeRate * 7, now: nowRate * 7 });
    }
  }
  const rising = trends.filter((t) => t.change >= 0.15).sort((a, b) => b.change - a.change).slice(0, 8);
  const falling = trends.filter((t) => t.change <= -0.15).sort((a, b) => a.change - b.change).slice(0, 8);

  // setores
  const catNow = new Map<string, number>();
  const catBefore = new Map<string, number>();
  for (const l of all) catNow.set(l.category ?? "Sem categoria", (catNow.get(l.category ?? "Sem categoria") ?? 0) + l.revenue);
  for (const r of previous) {
    const c = (r.product_id ? byId.get(r.product_id)?.category : null) ?? r.category ?? "Sem categoria";
    catBefore.set(c, (catBefore.get(c) ?? 0) + r.revenue);
  }
  const categories = [...catNow.entries()]
    .map(([name, rev]) => {
      const b = catBefore.get(name);
      return { name, revenue: rev, share: revenue ? rev / revenue : 0, change: b && prevDays ? rev / lastDays / (b / prevDays) - 1 : null };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  // parados: no catálogo, sem venda no período
  const sold = new Set(current.map((r) => r.product_id).filter(Boolean));
  const stale = catalog
    .filter((c) => !sold.has(c.id))
    .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
    .slice(0, 12)
    .map((c) => ({ id: c.id, name: c.name, stock: c.stock }));

  // resultado das campanhas: ritmo dos produtos do encarte durante a
  // validade contra o ritmo nos períodos fora dela
  const campaigns: CampaignResult[] = [];
  for (const e of encartes) {
    if (!e.productIds.length) continue;
    const ids = new Set(e.productIds);
    let dur = 0;
    let durDays = 0;
    let out = 0;
    let outDays = 0;
    for (const p of periods) {
      const rev = records.filter((r) => r.period_start === p.start && r.period_end === p.end && r.product_id && ids.has(r.product_id)).reduce((s, r) => s + r.revenue, 0);
      if (overlaps(p.start, p.end, e.valid_from, e.valid_until)) {
        dur += rev;
        durDays += days(p.start, p.end);
      } else {
        out += rev;
        outDays += days(p.start, p.end);
      }
    }
    if (!durDays) continue;
    campaigns.push({ id: e.id, name: e.name, lift: outDays && out > 0 ? dur / durDays / (out / outDays) - 1 : null, revenueDuring: dur, products: ids.size });
  }

  const prevRevenueRate = prevDays ? previous.reduce((s, r) => s + r.revenue, 0) / prevDays : null;
  return {
    period: { start: last.start, end: last.end, days: lastDays },
    previousPeriods: prevPeriods.length,
    kpis: { revenue, qty, products: all.length, grossMargin, revenueChange: prevRevenueRate ? revenue / lastDays / prevRevenueRate - 1 : null },
    abc: { a: all.slice(0, Math.min(countA, 15)).map(clean), countA, countB, countC, shareA: all.slice(0, countA).reduce((s, l) => s + l.share, 0) },
    top: all.slice(0, 10).map(clean),
    rising,
    falling,
    categories,
    stale,
    campaigns: campaigns.sort((a, b) => (b.lift ?? -9) - (a.lift ?? -9)).slice(0, 8),
  };
}
