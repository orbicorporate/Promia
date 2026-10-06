import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { photoKey } from "@/lib/photos/key";

type Admin = SupabaseClient<Database>;

// Rede Promia: o que os mercados da mesma cidade estão colocando em
// encarte, sempre agregado e anônimo. Só aparece com pelo menos 3 outros
// mercados na cidade, e cada produto só entra se 3 ou mais mercados o
// promoveram, para nunca dar para saber o que um mercado específico fez.
export const MIN_MARKETS = 3;

export async function regionalPromotions(admin: Admin, marketId: string, city: string | null) {
  if (!city) return { markets: 0, items: [] as { name: string; markets: number }[] };
  const { data: peers } = await admin.from("markets").select("id").ilike("city", city.trim()).neq("id", marketId).limit(500);
  const ids = (peers ?? []).map((p) => p.id);
  if (ids.length < MIN_MARKETS) return { markets: ids.length, items: [] };
  const since = addDaysISO(todayInSaoPaulo(), -30);
  const { data: tabloids } = await admin
    .from("tabloids")
    .select("market_id, tabloid_products(products(name, canonical_name))")
    .in("market_id", ids)
    .gte("valid_until", since)
    .limit(1000);
  const byKey = new Map<string, { name: string; markets: Set<string> }>();
  for (const t of tabloids ?? []) {
    for (const tp of (t.tabloid_products ?? []) as { products: { name: string; canonical_name: string | null } | null }[]) {
      const p = tp.products;
      if (!p) continue;
      const label = p.canonical_name ?? p.name;
      const k = photoKey(label);
      const cur = byKey.get(k) ?? { name: label, markets: new Set<string>() };
      cur.markets.add(t.market_id);
      byKey.set(k, cur);
    }
  }
  const items = [...byKey.values()]
    .filter((v) => v.markets.size >= MIN_MARKETS)
    .map((v) => ({ name: v.name, markets: v.markets.size }))
    .sort((a, b) => b.markets - a.markets)
    .slice(0, 15);
  return { markets: ids.length, items };
}
