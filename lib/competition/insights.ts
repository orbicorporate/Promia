import type { CompareRow, OurProduct, PriceObs } from "./compare";
import { priceRole } from "./pricing";

// Leituras em cima dos preços observados nos encartes dos concorrentes.

export type Placar = { name: string; comuns: number; indice: number; maisBarato: number; maisCaro: number; visto: string };

// por concorrente: quanto você está acima (+) ou abaixo (-) dos preços dele
export function placar(obs: PriceObs[], products: OurProduct[]): Placar[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const latest = new Map<string, PriceObs>();
  for (const o of obs) {
    if (!o.product_id || !byId.get(o.product_id)?.price) continue;
    const k = `${o.product_id}|${o.competitor_name}`;
    const cur = latest.get(k);
    if (!cur || o.observed_on > cur.observed_on) latest.set(k, o);
  }
  const por = new Map<string, { diffs: number[]; visto: string }>();
  for (const o of latest.values()) {
    const ours = byId.get(o.product_id!)!.price!;
    const e = por.get(o.competitor_name) ?? { diffs: [], visto: "" };
    e.diffs.push(ours / o.price - 1);
    if (o.observed_on > e.visto) e.visto = o.observed_on;
    por.set(o.competitor_name, e);
  }
  return [...por.entries()]
    .map(([name, e]) => ({
      name,
      comuns: e.diffs.length,
      indice: e.diffs.reduce((s, d) => s + d, 0) / e.diffs.length,
      maisBarato: e.diffs.filter((d) => d < -0.01).length,
      maisCaro: e.diffs.filter((d) => d > 0.01).length,
      visto: e.visto,
    }))
    .sort((a, b) => b.comuns - a.comuns);
}

// cesta de atração: só os produtos que o cliente compara entre mercados
export function cesta(rows: CompareRow[]): { itens: number; indice: number } | null {
  const r = rows.filter((x) => x.role === "atracao" && x.diff != null);
  if (r.length < 3) return null;
  return { itens: r.length, indice: r.reduce((s, x) => s + (x.diff ?? 0), 0) / r.length };
}

export type Movimento = { competitor: string; product: string; antes: number; agora: number; change: number; em: string };

// o que mudou: mesmo produto no mesmo concorrente, preço novo contra o anterior
export function movimentos(obs: PriceObs[], minimo = 0.05): Movimento[] {
  const grupos = new Map<string, PriceObs[]>();
  for (const o of obs) {
    const k = `${o.competitor_name}|${(o.product_id ?? o.product_name).toString().toLowerCase()}`;
    const g = grupos.get(k) ?? [];
    g.push(o);
    grupos.set(k, g);
  }
  const out: Movimento[] = [];
  for (const g of grupos.values()) {
    if (g.length < 2) continue;
    const s = [...g].sort((a, b) => b.observed_on.localeCompare(a.observed_on));
    const [novo, velho] = s;
    if (novo.observed_on === velho.observed_on || velho.price <= 0) continue;
    const change = novo.price / velho.price - 1;
    if (Math.abs(change) >= minimo) out.push({ competitor: novo.competitor_name, product: novo.product_name, antes: velho.price, agora: novo.price, change, em: novo.observed_on });
  }
  return out.sort((a, b) => a.change - b.change);
}

export type Cadencia = { competitor: string; dia: number; vezes: number; total: number };

// dia da semana em que o concorrente costuma soltar encarte (precisa de 3 ou mais encartes lidos)
export function cadencia(flyers: { competitor_name: string; observed_on: string }[]): Cadencia[] {
  const por = new Map<string, number[]>();
  for (const f of flyers) {
    const d = new Date(`${f.observed_on}T12:00:00Z`).getUTCDay();
    por.set(f.competitor_name, [...(por.get(f.competitor_name) ?? []), d]);
  }
  const out: Cadencia[] = [];
  for (const [competitor, dias] of por) {
    if (dias.length < 3) continue;
    const cont = new Map<number, number>();
    for (const d of dias) cont.set(d, (cont.get(d) ?? 0) + 1);
    const [dia, vezes] = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
    if (vezes >= 2 && vezes / dias.length >= 0.5) out.push({ competitor, dia, vezes, total: dias.length });
  }
  return out;
}

export { priceRole };
