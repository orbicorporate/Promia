import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPaulo } from "@/lib/dates";
import { normalizePlan, type ContentPlan } from "@/lib/ai/pautas";
import { PautasView } from "./pautas-view";

export const metadata = { title: "Pautas" };

export default async function PautasPage({ params }: PageProps<"/[slug]/pautas">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const { data } = await createAdminClient()
    .from("content_plans")
    .select("content")
    .eq("market_id", market.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const raw = data?.content as Partial<ContentPlan> | undefined;
  const plan = raw && raw.de && raw.ate ? normalizePlan(raw, raw.de, raw.ate) : null;

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Pautas</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">O que postar em cada dia dos próximos 30, com datas do varejo, promoções fixas, produtos da estação e a previsão do tempo da sua cidade.</p>
      </header>
      <PautasView marketId={market.id} slug={slug} today={todayInSaoPaulo()} initial={plan} hasCity={!!market.city} />
    </div>
  );
}
