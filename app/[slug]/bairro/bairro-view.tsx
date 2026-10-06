"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, RotateCw, Users, Store, LayoutPanelTop, Clock, Lightbulb, MapPin, Network } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, cn } from "@/components/ui";
import type { BairroInsight } from "@/lib/ai/bairro";

const PRIO = { alta: "bg-[var(--tomate)] text-white", media: "bg-[color-mix(in_srgb,var(--banana)_45%,transparent)] text-[var(--banana-ink)]", baixa: "bg-[var(--line)] text-[var(--ink-2)]" } as const;

export function BairroView({
  marketId,
  slug,
  hasAddress,
  initial,
  rede,
  minMarkets,
}: {
  marketId: string;
  slug: string;
  hasAddress: boolean;
  initial: BairroInsight | null;
  rede: { markets: number; items: { name: string; markets: number }[] };
  minMarkets: number;
}) {
  const [insight, setInsight] = useState(initial);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/bairro", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.error || "Não consegui analisar o bairro.");
      setInsight(d.insight);
      toast.success("Análise do bairro pronta.");
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setRunning(false);
    }
  }

  const redeBox = (
    <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="rede">
      <h2 id="rede" className="flex items-center gap-2 text-lg font-bold">
        <Network className="size-5 text-[var(--uva)]" /> Na sua região
      </h2>
      {rede.items.length === 0 ? (
        <p className="text-sm text-[var(--ink-2)]">
          Quando houver pelo menos {minMarkets} outros mercados da sua cidade no Promia, aparece aqui o que eles mais estão colocando em oferta, sempre de forma anônima.
          {rede.markets > 0 && ` Hoje são ${rede.markets}.`}
        </p>
      ) : (
        <>
          <p className="text-sm text-[var(--ink-2)]">Produtos mais colocados em encarte nos últimos 30 dias por mercados da sua cidade.</p>
          <ul className="divide-y divide-[var(--line)]">
            {rede.items.map((i) => (
              <li key={i.name} className="flex justify-between gap-3 py-2 text-sm">
                <span className="truncate">{i.name}</span>
                <span className="shrink-0 tabular text-[var(--ink-3)]">{i.markets} mercados</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Glass>
  );

  if (!insight) {
    return (
      <div className="space-y-5">
        <Glass data-trabalhando={running} className={cn("borda-ia flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8", running && "varredura")}>
          <div className="max-w-xl">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="size-5 text-[var(--uva)]" /> Analisar o bairro
            </h2>
            <p className="mt-1 text-[var(--ink-2)]">
              {running
                ? "Levantando escolas, empresas, academias e o que mais há por perto, e cruzando com suas vendas. Leva menos de um minuto."
                : "O Promia levanta o que existe em volta do mercado, cruza com suas vendas, catálogo e concorrentes, e diz quais públicos trabalhar, que setores implantar e como expor."}
            </p>
            {!hasAddress && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--ink-3)]">
                <MapPin className="size-4" /> Coloque o endereço em <Link href={`/${slug}/mercado#contatos`} className="underline underline-offset-4">Mercado</Link> primeiro.
              </p>
            )}
          </div>
          <Button variant="ia" size="lg" onClick={run} loading={running} disabled={!hasAddress} icon={<Sparkles className="size-5" />}>
            {running ? "Analisando" : "Analisar"}
          </Button>
        </Glass>
        {redeBox}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Glass className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-lg font-bold">Perfil</h2>
          <Button size="sm" variant="fantasma" onClick={run} loading={running} icon={<RotateCw className="size-4" />}>
            Refazer
          </Button>
        </div>
        <p className="max-w-3xl text-[15px] leading-relaxed">{insight.perfil}</p>
        {insight.entorno.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {insight.entorno
              .filter((e) => e.count > 0)
              .map((e) => (
                <li key={e.key} className="rounded-full bg-[var(--glass-strong)] px-3 py-1 text-sm ring-1 ring-[var(--line)]" title={e.examples.join(", ")}>
                  {e.label}: <span className="font-semibold tabular">{e.count >= 10 ? "10+" : e.count}</span>
                </li>
              ))}
          </ul>
        )}
      </Glass>

      <section className="space-y-3" aria-labelledby="publicos">
        <h2 id="publicos" className="flex items-center gap-2 px-1 text-lg font-bold">
          <Users className="size-5 text-[var(--uva)]" /> Públicos para trabalhar
        </h2>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insight.publicos.map((p) => (
            <Glass as="article" key={p.nome} className="flex flex-col gap-3 p-5">
              <h3 className="font-display text-lg font-bold">{p.nome}</h3>
              <p className="text-sm text-[var(--ink-2)]">{p.quem}</p>
              {p.compra.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.compra.map((c) => (
                    <span key={c} className="rounded-full bg-[var(--folha-soft)] px-2.5 py-0.5 text-xs text-[var(--folha)]">{c}</span>
                  ))}
                </div>
              )}
              <dl className="mt-auto space-y-1.5 text-sm">
                <div><dt className="inline font-medium">Quando: </dt><dd className="inline text-[var(--ink-2)]">{p.quando}</dd></div>
                <div><dt className="inline font-medium">Canal: </dt><dd className="inline text-[var(--ink-2)]">{p.canal}</dd></div>
                <div><dt className="inline font-medium">Mensagem: </dt><dd className="inline text-[var(--ink-2)]">{p.mensagem}</dd></div>
              </dl>
            </Glass>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="setores-b">
          <h2 id="setores-b" className="flex items-center gap-2 text-lg font-bold">
            <Store className="size-5 text-[var(--folha)]" /> Setores para implantar ou reforçar
          </h2>
          <ul className="space-y-3">
            {insight.setores.map((s) => (
              <li key={s.nome} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{s.nome}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", PRIO[s.prioridade])}>{s.prioridade === "media" ? "média" : s.prioridade}</span>
                </div>
                <p className="text-sm text-[var(--ink-2)]">{s.porque}</p>
              </li>
            ))}
          </ul>
        </Glass>
        <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="gondolas">
          <h2 id="gondolas" className="flex items-center gap-2 text-lg font-bold">
            <LayoutPanelTop className="size-5 text-[var(--tomate)]" /> Gôndolas e exposição
          </h2>
          <ul className="space-y-3">
            {insight.gondolas.map((g) => (
              <li key={g.onde + g.oque} className="space-y-0.5">
                <p className="font-semibold">{g.onde}</p>
                <p className="text-sm">{g.oque}</p>
                <p className="text-sm text-[var(--ink-3)]">{g.porque}</p>
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="oport">
          <h2 id="oport" className="flex items-center gap-2 text-lg font-bold">
            <Lightbulb className="size-5 text-[#c99a00]" /> Próximas ações
          </h2>
          <ul className="space-y-2">
            {insight.oportunidades.map((o) => (
              <li key={o} className="rounded-2xl bg-[var(--glass-strong)] p-3 text-sm ring-1 ring-[var(--line)]">{o}</li>
            ))}
          </ul>
          {insight.horarios && (
            <p className="flex items-start gap-2 text-sm text-[var(--ink-2)]">
              <Clock className="mt-0.5 size-4 shrink-0" /> {insight.horarios}
            </p>
          )}
        </Glass>
        {redeBox}
      </div>
    </div>
  );
}
