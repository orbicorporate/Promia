import { Plus, Images } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPaulo } from "@/lib/dates";
import { ButtonLink, EmptyState } from "@/components/ui";
import { EncarteThumb } from "../_ui/encarte-thumb";
import { plural } from "@/lib/plural";

export const metadata = { title: "Encartes" };

export default async function EncartesPage({ params }: PageProps<"/[slug]/encartes">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const { data } = await createAdminClient()
    .from("tabloids")
    .select("id, name, format, theme_key, valid_from, valid_until, updated_at")
    .eq("market_id", market.id)
    .order("updated_at", { ascending: false })
    .limit(120);
  const today = todayInSaoPaulo();
  const all = data ?? [];
  const vigentes = all.filter((t) => !t.valid_until || t.valid_until >= today);
  const antigos = all.filter((t) => t.valid_until && t.valid_until < today);

  return (
    <div className="space-y-8 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Encartes</h1>
          <p className="mt-1 text-[var(--ink-2)]">{all.length ? plural(all.length, "encarte criado", "encartes criados") : "Monte o primeiro em menos de um minuto."}</p>
        </div>
        <ButtonLink href={`/${slug}/encartes/novo`} icon={<Plus className="size-5" />} className="hidden sm:inline-flex">
          Novo encarte
        </ButtonLink>
      </header>

      {all.length === 0 ? (
        <div className="vidro rounded-[24px]">
          <EmptyState
            icon={<Images className="size-6" />}
            title="Nenhum encarte ainda"
            action={<ButtonLink href={`/${slug}/encartes/novo`} icon={<Plus className="size-5" />}>Novo encarte</ButtonLink>}
          >
            Escolha os produtos, o tema e o formato. O Promia desenha a arte pronta para o Instagram, o WhatsApp e a impressão.
          </EmptyState>
        </div>
      ) : (
        <>
          <Grid title="Valendo agora" slug={slug} items={vigentes} />
          <Grid title="Já passaram" slug={slug} items={antigos} />
        </>
      )}
    </div>
  );
}

function Grid({ title, slug, items }: { title: string; slug: string; items: Parameters<typeof EncarteThumb>[0]["encarte"][] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((t) => (
          <EncarteThumb key={t.id} slug={slug} encarte={t} />
        ))}
      </div>
    </section>
  );
}
