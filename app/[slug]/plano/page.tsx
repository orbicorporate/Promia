import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlanoMarketing } from "@/lib/ai/plano";
import { PlanoView } from "./plano-view";

export const metadata = { title: "Plano de marketing" };

export default async function PlanoPage({ params }: PageProps<"/[slug]/plano">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const { data } = await createAdminClient().from("market_insights").select("content").eq("market_id", market.id).eq("kind", "plano").maybeSingle();
  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Plano de marketing</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Quatro semanas, passo a passo, feitas para o público do seu bairro e para os seus produtos. Marque o que já fez.</p>
      </header>
      <PlanoView marketId={market.id} initial={(data?.content as PlanoMarketing | undefined) ?? null} />
    </div>
  );
}
