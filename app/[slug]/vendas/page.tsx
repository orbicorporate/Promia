import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadSalesAnalysis } from "@/lib/sales/load";
import { todayInSaoPaulo } from "@/lib/dates";
import { VendasImport } from "./vendas-import";
import { VendasView } from "./vendas-view";

export const metadata = { title: "Vendas" };

export default async function VendasPage({ params }: PageProps<"/[slug]/vendas">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const { imports, analysis } = await loadSalesAnalysis(createAdminClient(), market.id);

  return (
    <div className="space-y-6 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Vendas</h1>
          <p className="mt-1 max-w-2xl text-[var(--ink-2)]">O que mais vende, o que está subindo ou caindo, o que está parado e quanto cada encarte fez vender.</p>
        </div>
        {analysis && <VendasImport marketId={market.id} today={todayInSaoPaulo()} compact />}
      </header>
      {analysis ? <VendasView slug={slug} analysis={analysis} imports={imports} /> : <VendasImport marketId={market.id} today={todayInSaoPaulo()} />}
    </div>
  );
}
