import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { suggestThemesInRange } from "@/lib/themes";
import { TabloidBuilder } from "./tabloid-builder";

export default async function NewTabloidPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, market_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const admin = createAdminClient();
  const { data: market } = await admin
    .from("markets")
    .select("id, slug, name, niche")
    .eq("slug", slug)
    .single();
  if (!market) notFound();
  if (profile.role === "mercado" && profile.market_id !== market.id) redirect("/login");

  const [{ data: products }, { data: themes }, { data: weeklyPromotions }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, brand, category, price, image_url")
      .eq("market_id", market.id)
      .order("name"),
    admin
      .from("themes")
      .select("id, name, kind, source_seasonal_title, source_weekday")
      .or(`market_id.eq.${market.id},market_id.is.null`),
    admin.from("weekly_promotions").select("id, market_id, weekday, name, category_hint, active").eq("market_id", market.id),
  ]);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in14days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

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
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Novo tabloide</h1>
          <p className="text-sm text-neutral-500">{market.name}</p>
        </div>

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
