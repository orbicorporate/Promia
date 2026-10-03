import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/auth";
import { isThemeKey, DEFAULT_THEME_KEY } from "@/lib/encarte/themes";
import { isEncarteFormat, isEncarteLayout } from "@/lib/encarte/types";
import { EncarteBuilder, type BuilderInitial } from "../../_ui/builder";
import { loadBuilderData } from "../../_ui/builder-data";

export const metadata = { title: "Editar encarte" };

export default async function EditarEncartePage({ params }: PageProps<"/[slug]/encartes/[id]/editar">) {
  const { slug, id } = await params;
  if (!isUuid(id)) notFound();
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const { data: t } = await admin
    .from("tabloids")
    .select("id, name, headline, subheadline, format, layout, theme_key, valid_from, valid_until, tabloid_products(product_id, position, promo_price, old_price, highlight, limit_qty, label)")
    .eq("id", id)
    .eq("market_id", market.id)
    .maybeSingle();
  if (!t) notFound();

  const data = await loadBuilderData(market.id);
  const known = new Set(data.catalog.map((p) => p.id));
  const initial: BuilderInitial = {
    id: t.id,
    name: t.name,
    headline: t.headline ?? "",
    subheadline: t.subheadline ?? "",
    format: isEncarteFormat(t.format) ? t.format : "feed",
    layout: isEncarteLayout(t.layout) ? t.layout : "grade",
    themeKey: isThemeKey(t.theme_key) ? t.theme_key : DEFAULT_THEME_KEY,
    validFrom: t.valid_from ?? "",
    validUntil: t.valid_until ?? "",
    items: [...(t.tabloid_products ?? [])]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .filter((r) => known.has(r.product_id))
      .map((r) => ({
        productId: r.product_id,
        promoPrice: r.promo_price == null ? null : Number(r.promo_price),
        oldPrice: r.old_price == null ? null : Number(r.old_price),
        highlight: !!r.highlight,
        limitQty: r.limit_qty,
        label: r.label,
      })),
  };

  return (
    <div className="space-y-5 pt-2">
      <header>
        <Link href={`/${slug}/encartes/${id}`} className="inline-flex items-center gap-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Editar encarte</h1>
      </header>
      <EncarteBuilder
        marketId={market.id}
        slug={slug}
        catalog={data.catalog}
        themes={data.themes}
        suggestedThemeKeys={data.suggested}
        initial={initial}
        today={data.today}
      />
    </div>
  );
}
