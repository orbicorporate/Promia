import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { compareprices } from "@/lib/competition/compare";
import { whatsappConfigurado } from "@/lib/whatsapp";
import { cadencia, cesta, movimentos, placar } from "@/lib/competition/insights";
import { ConcorrenciaView } from "./concorrencia-view";
import { PesquisaOnline } from "./pesquisa-online";
import { ufDaCidade } from "@/lib/competition/pesquisa-online";

export const metadata = { title: "Concorrência" };

export default async function ConcorrenciaPage({ params }: PageProps<"/[slug]/concorrencia">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const since = addDaysISO(todayInSaoPaulo(), -45);
  const [{ data: competitors }, { data: flyers }, { data: obs }] = await Promise.all([
    admin.from("competitors").select("id, name, address, rating, reviews, category, latitude, longitude").eq("market_id", market.id).order("reviews", { ascending: false, nullsFirst: false }).limit(30),
    admin.from("competitor_flyers").select("id, competitor_name, observed_on, items, valid_until").eq("market_id", market.id).order("created_at", { ascending: false }).limit(60),
    admin.from("competitor_prices").select("product_id, product_name, competitor_name, price, observed_on").eq("market_id", market.id).gte("observed_on", since).limit(5000),
  ]);
  const ids = [...new Set((obs ?? []).map((o) => o.product_id).filter((x): x is string => !!x))];
  const { data: products } = ids.length ? await admin.from("products").select("id, name, category, price").in("id", ids.slice(0, 1000)) : { data: [] };
  const cmp = compareprices(
    (obs ?? []).map((o) => ({ ...o, price: Number(o.price) })),
    (products ?? []).map((p) => ({ ...p, price: p.price == null ? null : Number(p.price) }))
  );
  const obsNum = (obs ?? []).map((o) => ({ ...o, price: Number(o.price) }));
  const prodNum = (products ?? []).map((p) => ({ ...p, price: p.price == null ? null : Number(p.price) }));
  const unmatched = (obs ?? []).filter((o) => !o.product_id).length;

  // pesquisa na internet (se a tabela ainda não existir, fica vazia)
  const { data: pesq } = await admin.from("price_research").select("id, term, product_name, product_id, price, source_kind, source_name, source_url, scope, region, snippet, observed_on").eq("market_id", market.id).gte("observed_on", addDaysISO(todayInSaoPaulo(), -7)).order("observed_on", { ascending: false }).order("price", { ascending: true }).limit(200);
  const pids = [...new Set((pesq ?? []).map((r) => r.product_id).filter((x): x is string => !!x))];
  const { data: proprios } = pids.length ? await admin.from("products").select("id, price").in("id", pids) : { data: [] };
  const meuPreco = new Map((proprios ?? []).map((p) => [p.id, p.price == null ? null : Number(p.price)]));
  const achados = (pesq ?? []).map((r) => ({ id: r.id, term: r.term, product_name: r.product_name, price: Number(r.price), own_price: r.product_id ? (meuPreco.get(r.product_id) ?? null) : null, source_kind: r.source_kind, source_name: r.source_name, source_url: r.source_url, scope: r.scope, region: r.region, snippet: r.snippet, observed_on: r.observed_on }));

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
        origem={{ name: market.name, address: market.address, city: market.city, state: market.state }}
        competitors={(competitors ?? []).map((c) => ({ ...c, rating: c.rating == null ? null : Number(c.rating), latitude: c.latitude == null ? null : Number(c.latitude), longitude: c.longitude == null ? null : Number(c.longitude) }))}
        flyers={(flyers ?? []).slice(0, 12)}
        whatsapp={whatsappConfigurado() && process.env.WHATSAPP_DISPLAY_NUMBER ? { numero: process.env.WHATSAPP_DISPLAY_NUMBER.replace(/\D/g, ""), cadastrado: !!market.whatsapp } : null}
        placar={placar(obsNum, prodNum)}
        cesta={cesta(cmp.rows)}
        movimentos={movimentos(obsNum).slice(0, 12)}
        cadencia={cadencia(flyers ?? [])}
        compare={cmp}
        unmatched={unmatched}
      />
      <PesquisaOnline marketId={market.id} cidade={market.city} ufInicial={market.state || ufDaCidade(market.city)} achados={achados} />
    </div>
  );
}
