import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/auth";
import { pageCount } from "@/lib/encarte/paginate";
import { validityLabel } from "@/lib/encarte/text";
import { isEncarteFormat, isEncarteLayout, type EncarteItem } from "@/lib/encarte/types";
import { FORMATS } from "@/lib/encarte/formats";
import { FORMAT_SHORT, LAYOUT_SHORT } from "@/lib/encarte/labels";
import { getTheme } from "@/lib/encarte/themes";
import { EncarteViewer } from "./viewer";
import { CampaignPanel } from "./campanha";
import { normalizeCampaign } from "@/lib/ai/campaign";

export async function generateMetadata({ params }: PageProps<"/[slug]/encartes/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Encarte" };
  const { data } = await createAdminClient().from("tabloids").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Encarte" };
}

export default async function EncartePage({ params, searchParams }: PageProps<"/[slug]/encartes/[id]">) {
  const { slug, id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const { data: t } = await admin
    .from("tabloids")
    .select("id, name, format, layout, theme_key, valid_from, valid_until, updated_at, tabloid_products(highlight, promo_price, products(price))")
    .eq("id", id)
    .eq("market_id", market.id)
    .maybeSingle();
  if (!t) notFound();

  const format = isEncarteFormat(t.format) ? t.format : "feed";
  const layout = isEncarteLayout(t.layout) ? t.layout : "grade";
  const rows = (t.tabloid_products ?? []) as { highlight: boolean | null; promo_price: number | null; products: { price: number | null } | null }[];
  const priced = rows.filter((r) => (r.promo_price ?? r.products?.price) != null);
  const pages = pageCount({ format, layout, items: priced.map((r) => ({ highlight: !!r.highlight }) as EncarteItem) });
  const validade = validityLabel(t.valid_from, t.valid_until);
  const { data: camp } = await admin.from("campaigns").select("content").eq("tabloid_id", id).maybeSingle();
  const f = FORMATS[format];

  return (
    <div className="space-y-6 pt-2">
      <header>
        <Link href={`/${slug}/encartes`} className="inline-flex items-center gap-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">
          <ArrowLeft className="size-4" /> Encartes
        </Link>
        <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl text-balance">{t.name}</h1>
        <p className="mt-1 text-[var(--ink-2)]">
          {FORMAT_SHORT[format]}, {LAYOUT_SHORT[layout].toLowerCase()}, tema {getTheme(t.theme_key).name.toLowerCase()}
          {validade ? `. ${validade}` : ""}
        </p>
      </header>
      <EncarteViewer
        id={t.id}
        slug={slug}
        name={t.name}
        pages={pages}
        version={t.updated_at}
        width={f.width}
        height={f.height}
        products={priced.length}
        celebrate={sp.novo === "1"}
      />
      <CampaignPanel
        encarteId={t.id}
        imageHref={`/api/encartes/${t.id}/imagem?pagina=1&download=1&v=${encodeURIComponent(t.updated_at)}`}
        initial={camp ? normalizeCampaign(camp.content) : null}
      />
    </div>
  );
}
