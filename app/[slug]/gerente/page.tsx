import { requireMarketPage } from "@/lib/market";
import { ChatView } from "./chat-view";

export const metadata = { title: "Gerente" };

export default async function GerentePage({ params }: PageProps<"/[slug]/gerente">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  return (
    <div className="space-y-5 pt-2">
      <header>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Gerente</h1>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Converse com o gerente do seu mercado. Ele responde com os seus dados de vendas, concorrência e bairro, e já te leva para a ação.</p>
      </header>
      <ChatView marketId={market.id} marketName={market.name} />
    </div>
  );
}
