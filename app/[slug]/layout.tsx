import { AppShell } from "@/components/shell/app-shell";
import { requireMarketPage } from "@/lib/market";

export default async function MarketLayout({ children, params }: LayoutProps<"/[slug]">) {
  const { slug } = await params;
  const { market, viewer } = await requireMarketPage(slug);
  return (
    <AppShell
      market={{ name: market.name, slug: market.slug, logoUrl: market.logo_url, colorPrimary: market.color_primary }}
      isMaster={viewer.role === "master"}
    >
      {children}
    </AppShell>
  );
}
