import { redirect, notFound } from "next/navigation";
import { getViewer, canAccessMarket } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/app-header";
import { todayInSaoPaulo, addDaysISO } from "@/lib/dates";
import { suggestThemesInRange } from "@/lib/themes";
import { TabloidBuilder } from "./tabloid-builder";

export default async function NewTabloidPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");
  if (who.status !== "ok") redirect("/");

  const admin = createAdminClient();
  const { data: market } = await admin
    .from("markets")
    .select("id, slug, name, niche")
    .eq("slug", slug)
    .maybeSingle();
  if (!market) notFound();
  if (!canAccessMarket(who.viewer, market.id)) redirect("/");

  const [{ data: products }, { data: themes }, { data: weeklyPromotions }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, brand, category, price, unit, image_url, image_status")
      .eq("market_id", market.id)
      .eq("active", true)
      .order("name")
      .limit(5000),
    admin
      .from("themes")
      .select("id, name, kind, source_seasonal_title, source_weekday")
      .or(`market_id.eq.${market.id},market_id.is.null`),
    admin.from("weekly_promotions").select("id, market_id, weekday, name, category_hint, active").eq("market_id", market.id),
  ]);

  const today = todayInSaoPaulo();
  const in14days = addDaysISO(today, 14);

  const suggestions = suggestThemesInRange({
    startISO: today,
    endISO: in14days,
    marketNiche: market.niche,
    weeklyPromotions: (weeklyPromotions || []).map((p) => ({
      id: p.id,
      marketId: p.market_id,
      weekday: p.weekday,
      name: p.name,
      categoryHint: p.category_hint,
      active: p.active,
    })),
    availableThemes: (themes || []).map((t) => ({
      id: t.id,
      marketId: market.id,
      name: t.name,
      kind: t.kind as "sazonal" | "dia_da_semana" | "livre",
      templatePath: "",
      sourceSeasonalTitle: t.source_seasonal_title || undefined,
      sourceWeekday: t.source_weekday ?? undefined,
    })),
  });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <AppHeader title="Novo tabloide" subtitle={market.name} back={{ href: `/${market.slug}`, label: market.name }} />

        <TabloidBuilder
          marketId={market.id}
          marketSlug={market.slug}
          products={products || []}
          themes={themes || []}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}
