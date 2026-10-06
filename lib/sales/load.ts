import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { analyzeSales, type SaleRec, type CatalogRef, type EncarteRef } from "./analyze";

type Admin = SupabaseClient<Database>;

// O Supabase devolve no máximo 1000 linhas por consulta: pagina até o limite.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, max: number): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += 1000) {
    const { data } = await page(from, Math.min(from + 999, max - 1));
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export async function loadSalesAnalysis(admin: Admin, marketId: string) {
  // os 8 períodos mais recentes bastam para tendência e campanhas
  const { data: imports } = await admin
    .from("sales_imports")
    .select("id, file_name, period_start, period_end, rows, matched, created_at")
    .eq("market_id", marketId)
    .order("period_end", { ascending: false })
    .limit(8);
  if (!imports?.length) return { imports: [], analysis: null };
  const ids = imports.map((i) => i.id);
  const minStart = imports.reduce((m, i) => (i.period_start < m ? i.period_start : m), imports[0].period_start);

  const [records, catalog, encartes] = await Promise.all([
    fetchAll<SaleRec>(
      (a, b) =>
        admin.from("sales_records").select("product_id, name, category, period_start, period_end, qty, revenue, cost").eq("market_id", marketId).in("import_id", ids).range(a, b) as unknown as PromiseLike<{ data: SaleRec[] | null }>,
      60000
    ),
    fetchAll<CatalogRef>(
      (a, b) => admin.from("products").select("id, name, category, price, cost, stock").eq("market_id", marketId).eq("active", true).range(a, b) as unknown as PromiseLike<{ data: CatalogRef[] | null }>,
      20000
    ),
    admin
      .from("tabloids")
      .select("id, name, valid_from, valid_until, tabloid_products(product_id)")
      .eq("market_id", marketId)
      .gte("valid_until", minStart)
      .limit(40),
  ]);
  const encRefs: EncarteRef[] = (encartes.data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    valid_from: e.valid_from,
    valid_until: e.valid_until,
    productIds: ((e.tabloid_products ?? []) as { product_id: string }[]).map((t) => t.product_id),
  }));
  const num = (v: unknown) => (v == null ? null : Number(v));
  const recs = records.map((r) => ({ ...r, qty: Number(r.qty), revenue: Number(r.revenue), cost: num(r.cost) }));
  const cat = catalog.map((c) => ({ ...c, price: num(c.price), cost: num(c.cost), stock: num(c.stock) }));
  return { imports, analysis: analyzeSales(recs, cat, encRefs) };
}
