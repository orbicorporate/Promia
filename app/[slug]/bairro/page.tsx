import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeBairro, type BairroInsight } from "@/lib/ai/bairro";
import { regionalPromotions, MIN_MARKETS } from "@/lib/network";
import { BairroView } from "./bairro-view";

export const metadata = { title: "Bairro e público" };

export default async function BairroPage({ params }: PageProps<"/[slug]/bairro">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const [{ data }, rede] = await Promise.all([
    admin.from("market_insights").select("content").eq("market_id", market.id).eq("kind", "bairro").maybeSingle(),
    regionalPromotions(admin, market.id, market.city),
  ]);
  const raw = data?.content as Partial<BairroInsight> | undefined;
  const insight = raw ? normalizeBairro(raw, raw.entorno ?? []) : null;

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Bairro e público</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Quem está em volta do mercado, quais públicos trabalhar, que setores implantar e como expor os produtos.</p>
      </header>
      <BairroView marketId={market.id} slug={slug} hasAddress={!!(market.address || market.city)} initial={insight} rede={rede} minMarkets={MIN_MARKETS} />
    </div>
  );
}
