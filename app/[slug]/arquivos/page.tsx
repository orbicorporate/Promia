import { requireMarketPage } from "@/lib/market";
import { listarArquivos } from "@/lib/server/arquivos";
import { BibliotecaAbas } from "@/components/shell/biblioteca-abas";
import { ArquivosView } from "./arquivos-view";

export const metadata = { title: "Meus arquivos" };

export default async function ArquivosPage({ params }: PageProps<"/[slug]/arquivos">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const arquivos = await listarArquivos(market.id);
  return (
    <div className="space-y-6 pt-2">
      <BibliotecaAbas slug={slug} ativa="arquivos" />
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Meus arquivos</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Imagens do seu mercado, como fundos de campanha e fotos da loja. Envie aqui e use como fundo do encarte, na etapa Fundo.</p>
      </header>
      <ArquivosView marketId={market.id} inicial={arquivos} />
    </div>
  );
}
