import { requireMarketPage } from "@/lib/market";
import { todayInSaoPaulo } from "@/lib/dates";
import { EMBLEMAS } from "@/lib/emblemas/catalog";
import { PLANEJADOS } from "@/lib/emblemas/planejados";
import { THEMES } from "@/lib/encarte/themes";
import { EmblemasGallery } from "./gallery";

export const metadata = { title: "Emblemas" };

export default async function EmblemasPage({ params }: PageProps<"/[slug]/emblemas">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const usados = new Set(EMBLEMAS.flatMap((e) => e.temas));
  const temas = THEMES.filter((t) => usados.has(t.key)).map((t) => ({ key: t.key, name: t.name }));

  return (
    <div className="space-y-6 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Emblemas</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">
          Logos de campanha prontos para o topo do encarte. Filtre por tipo de oferta, tema, data ou feriado, e veja o que ainda falta criar.
        </p>
      </header>
      <EmblemasGallery
        hoje={todayInSaoPaulo()}
        temas={temas}
        corMercado={market.color_primary ?? "#15803d"}
        emblemas={EMBLEMAS}
        planejados={PLANEJADOS}
      />
    </div>
  );
}
