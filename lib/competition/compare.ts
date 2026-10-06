import { adviseOnPrice, priceRole, type PriceAdvice, type PriceRole } from "./pricing";

export type CompareRow = {
  productId: string;
  name: string;
  category: string | null;
  ours: number | null;
  competitor: string;
  theirs: number;
  theirsName: string;
  observedOn: string;
  diff: number | null;
  role: PriceRole;
  advice: PriceAdvice;
};

export type PriceObs = { product_id: string | null; product_name: string; competitor_name: string; price: number; observed_on: string };
export type OurProduct = { id: string; name: string; category: string | null; price: number | null };

// Para cada produto do catálogo com preço observado, o concorrente mais
// barato visto mais recentemente; índice = quanto você está acima (+) ou
// abaixo (-) nesses produtos, em média.
export function compareprices(obs: PriceObs[], products: OurProduct[]): { rows: CompareRow[]; index: number | null; cheaper: number; pricier: number } {
  const byId = new Map(products.map((p) => [p.id, p]));
  const latest = new Map<string, PriceObs>(); // produto|concorrente -> mais recente
  for (const o of obs) {
    if (!o.product_id || !byId.has(o.product_id)) continue;
    const k = `${o.product_id}|${o.competitor_name}`;
    const cur = latest.get(k);
    if (!cur || o.observed_on > cur.observed_on) latest.set(k, o);
  }
  const best = new Map<string, PriceObs>(); // produto -> concorrente mais barato
  for (const o of latest.values()) {
    const cur = best.get(o.product_id!);
    if (!cur || o.price < cur.price) best.set(o.product_id!, o);
  }
  const rows: CompareRow[] = [];
  for (const [pid, o] of best) {
    const p = byId.get(pid)!;
    const role = priceRole(p.name, p.category);
    rows.push({
      productId: pid,
      name: p.name,
      category: p.category,
      ours: p.price,
      competitor: o.competitor_name,
      theirs: o.price,
      theirsName: o.product_name,
      observedOn: o.observed_on,
      diff: p.price != null ? p.price / o.price - 1 : null,
      role,
      advice: adviseOnPrice(p.price, o.price, role),
    });
  }
  const priced = rows.filter((r) => r.diff != null);
  const index = priced.length ? priced.reduce((s, r) => s + (r.diff ?? 0), 0) / priced.length : null;
  rows.sort((a, b) => (b.diff ?? -9) - (a.diff ?? -9));
  return { rows, index, cheaper: priced.filter((r) => (r.diff ?? 0) < -0.01).length, pricier: priced.filter((r) => (r.diff ?? 0) > 0.01).length };
}
