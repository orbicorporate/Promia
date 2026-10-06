import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { compareprices } from "@/lib/competition/compare";
import { ConcorrenciaView } from "./concorrencia-view";

export const metadata = { title: "Concorrência" };

export default async function ConcorrenciaPage({ params }: PageProps<"/[slug]/concorrencia">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const since = addDaysISO(todayInSaoPaulo(), -45);
  const [{ data: competitors }, { data: flyers }, { data: obs }] = await Promise.all([
    admin.from("competitors").select("id, name, address, rating, reviews, category, latitude, longitude").eq("market_id", market.id).order("reviews", { ascending: false, nullsFirst: false }).limit(30),
    admin.from("competitor_flyers").select("id, competitor_name, observed_on, items, valid_until").eq("market_id", market.id).order("created_at", { ascending: false }).limit(12),
    admin.from("competitor_prices").select("product_id, product_name, competitor_name, price, observed_on").eq("market_id", market.id).gte("observed_on", since).limit(5000),
  ]);
  const ids = [...new Set((obs ?? []).map((o) => o.product_id).filter((x): x is string => !!x))];
  const { data: products } = ids.length ? await admin.from("products").select("id, name, category, price").in("id", ids.slice(0, 1000)) : { data: [] };
  const cmp = compareprices(
    (obs ?? []).map((o) => ({ ...o, price: Number(o.price) })),
    (products ?? []).map((p) => ({ ...p, price: p.price == null ? null : Number(p.price) }))
  );
  const unmatched = (obs ?? []).filter((o) => !o.product_id).length;

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Concorrência</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Quem está em volta, o que estão anunciando e como o seu preço se compara, com sugestão de preço para cada produto.</p>
      </header>
      <ConcorrenciaView
        slug={slug}
        marketId={market.id}
        hasAddress={!!(market.address || market.city)}
        competitors={(competitors ?? []).map((c) => ({ ...c, rating: c.rating == null ? null : Number(c.rating) }))}
        flyers={flyers ?? []}
        compare={cmp}
        unmatched={unmatched}
      />
    </div>
  );
}
