import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { MercadoForm } from "./mercado-form";

export const metadata = { title: "Mercado" };

export default async function MercadoPage({ params }: PageProps<"/[slug]/mercado">) {
  const { slug } = await params;
  const { market: m } = await requireMarketPage(slug);
  const { data: promotions } = await createAdminClient()
    .from("weekly_promotions")
    .select("id, weekday, name, category_hint, active")
    .eq("market_id", m.id)
    .order("weekday");

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Seu mercado</h1>
        <p className="mt-1 text-[var(--ink-2)]">Logo, cores e contatos entram sozinhos em todo encarte.</p>
      </header>
      <MercadoForm
        promotions={promotions ?? []}
        initial={{
          id: m.id,
          name: m.name,
          tagline: m.tagline ?? "",
          niche: m.niche ?? "",
          logoUrl: m.logo_url,
          colorPrimary: m.color_primary ?? "",
          colorSecondary: m.color_secondary ?? "",
          whatsapp: m.whatsapp ?? "",
          phone: m.phone ?? "",
          instagram: m.instagram ?? "",
          address: m.address ?? "",
          city: m.city ?? "",
          openingHours: m.opening_hours ?? "",
          legalNote: m.legal_note ?? "",
        }}
      />
    </div>
  );
}
