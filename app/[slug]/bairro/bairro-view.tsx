"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, RotateCw, Users, Store, LayoutPanelTop, Clock, MapPin, ChevronDown, CalendarClock, Megaphone, MessageSquareQuote, ShoppingBasket, Check, Flame, Zap, Leaf, Target } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, cn } from "@/components/ui";
import type { BairroInsight } from "@/lib/ai/bairro";

// cores cheias que se repetem em ordem, uma por cartão
const CORES = [
  "[background-image:linear-gradient(145deg,#22b866_0%,#0b6b3c_100%)]",
  "[background-image:linear-gradient(145deg,#f2584a_0%,#b3122f_100%)]",
  "[background-image:linear-gradient(145deg,#8a6bff_0%,#4527b8_100%)]",
  "[background-image:linear-gradient(145deg,#f08a00_0%,#b34700_100%)]",
  "[background-image:linear-gradient(145deg,#18b4c4_0%,#0a6377_100%)]",
  "[background-image:linear-gradient(145deg,#ee4f9a_0%,#a3125f_100%)]",
];
// versões translúcidas das cores, para os blocos de vidro sobre o banner
const VIDROS = [
  "bg-[#22b866]/55",
  "bg-[#f2584a]/55",
  "bg-[#8a6bff]/55",
  "bg-[#f08a00]/55",
  "bg-[#18b4c4]/55",
  "bg-[#ee4f9a]/55",
];
const PRIO_ICONE = { alta: Flame, media: Zap, baixa: Leaf } as const;
const PRIO_COR = { alta: "bg-[#e8284f]", media: "bg-[#f5a300]", baixa: "bg-[#6b7280]" } as const;
const PRIO_TEXTO = { alta: "Prioridade alta", media: "Prioridade média", baixa: "Prioridade baixa" } as const;
const PRIO = { alta: "bg-[#e8284f] text-white", media: "bg-[#f5a300] text-[#3a2600]", baixa: "bg-[#6b7280] text-white" } as const;

export function BairroView({
  marketId,
  slug,
  hasAddress,
  initial,
}: {
  marketId: string;
  slug: string;
  hasAddress: boolean;
  initial: BairroInsight | null;
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
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  href={`/${slug}/mercado#contatos`}
                  className="relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-5 text-sm font-semibold text-white [background-image:linear-gradient(135deg,#e8284f_0%,#b3122f_55%,#8c0c26_100%)] shadow-[0_14px_30px_-14px_rgba(179,18,47,0.8)] transition before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/30 before:to-transparent hover:-translate-y-px active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b3122f]"
                >
                  <MapPin className="size-4" /> Cadastrar endereço do mercado
                </Link>
                <span className="text-sm text-[var(--ink-3)]">Sem o endereço não dá para analisar o bairro.</span>
              </div>
            )}
          </div>
          <Button variant="ia" size="lg" onClick={run} loading={running} disabled={!hasAddress} icon={<Sparkles className="size-5" />}>
            {running ? "Analisando" : "Analisar"}
          </Button>
        </Glass>
      </div>
    );
  }

  return <Resultado insight={insight} running={running} run={run} />;
}

function Resultado({ insight, running, run }: { insight: BairroInsight; running: boolean; run: () => void }) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [feitas, setFeitas] = useState<Set<string>>(new Set());
  const marcar = (t: string) => setFeitas((a) => { const n = new Set(a); if (n.has(t)) n.delete(t); else n.add(t); return n; });
  const alternar = (nome: string) => setAbertos((a) => { const n = new Set(a); if (n.has(nome)) n.delete(nome); else n.add(nome); return n; });
  const entorno = insight.entorno.filter((e) => e.count > 0);
  // o perfil começa com os primeiros ~280 caracteres, o resto abre sob demanda
  const longo = insight.perfil.length > 280;
  const resumo = longo && !perfilAberto ? insight.perfil.slice(0, 280).replace(/\s+\S*$/, "") + "..." : insight.perfil;

  return (
    <div className="space-y-8">
      <section className="relative isolate overflow-hidden rounded-[32px] p-6 text-white shadow-[0_30px_60px_-30px_rgba(11,107,60,0.7),inset_0_1px_0_rgba(255,255,255,0.45)] ring-1 ring-white/40 backdrop-blur-2xl backdrop-saturate-150 [background-image:linear-gradient(135deg,rgba(24,160,90,0.78)_0%,rgba(10,90,55,0.72)_55%,rgba(6,56,42,0.8)_100%)] sm:p-9">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 -z-10 size-96 rounded-full bg-[#7dffb0]/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/4 -z-10 size-80 rounded-full bg-[#ffd24a]/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Seu bairro em resumo</h2>
            <p className="mt-1 text-lg text-white/80">O que existe em volta e quem compra de você.</p>
          </div>
          <button onClick={run} disabled={running} className="inline-flex h-11 items-center gap-2 rounded-full bg-white/20 px-5 text-base font-semibold ring-1 ring-white/40 backdrop-blur-md transition hover:bg-white/30 disabled:opacity-60">
            <RotateCw className={cn("size-4", running && "animate-spin")} /> {running ? "Refazendo" : "Refazer análise"}
          </button>
        </div>
        <p className="relative mt-5 max-w-3xl text-lg leading-relaxed text-white/95 sm:text-xl">{resumo}</p>
        {longo && (
          <button onClick={() => setPerfilAberto((v) => !v)} className="relative mt-2 inline-flex items-center gap-1 text-base font-semibold underline underline-offset-4">
            {perfilAberto ? "Mostrar menos" : "Ler análise completa"} <ChevronDown className={cn("size-4 transition", perfilAberto && "rotate-180")} />
          </button>
        )}
        {entorno.length > 0 && (
          <ul className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {entorno.map((e, i) => (
              <li key={e.key} title={e.examples.join(", ")} className={cn("rounded-3xl p-4 shadow-lg ring-1 ring-white/35 backdrop-blur-md [box-shadow:inset_0_1px_0_rgba(255,255,255,0.4),0_14px_30px_-18px_rgba(0,0,0,0.6)]", VIDROS[(i + 1) % VIDROS.length])}>
                <span className="tabular block text-4xl font-extrabold leading-none sm:text-5xl">{e.count >= 10 ? "10+" : e.count}</span>
                <span className="mt-1.5 block text-base font-semibold sm:text-lg">{e.label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="publicos">
        <h2 id="publicos" className="flex items-center gap-3 font-display text-2xl font-extrabold sm:text-3xl">
          <span className="grid size-11 place-items-center rounded-2xl bg-[#6a4bf0] text-white"><Users className="size-6" /></span> Públicos para trabalhar
        </h2>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
          {insight.publicos.map((p, i) => {
            const aberto = abertos.has(p.nome);
            return (
              <article key={p.nome} className={cn("flex flex-col gap-4 rounded-[28px] p-6 text-white shadow-[0_24px_48px_-28px_rgba(0,0,0,0.6)]", CORES[i % CORES.length])}>
                <div className="flex items-center gap-3.5">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full bg-white/25 ring-1 ring-white/40 backdrop-blur-sm"><Users className="size-7" /></span>
                  <h3 className="font-display text-2xl font-extrabold leading-tight">{p.nome}</h3>
                </div>
                <p className="line-clamp-3 text-lg leading-snug text-white/90">{p.quem}</p>
                {p.compra.length > 0 && (
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-base font-bold"><ShoppingBasket className="size-4" /> Eles compram</p>
                    <div className="flex flex-wrap gap-2">
                      {p.compra.slice(0, aberto ? 12 : 3).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1.5 pr-3 text-base font-semibold text-[#1f2937]"><span className="grid size-5 place-items-center rounded-full bg-[#14a05a] text-white"><Check className="size-3.5" strokeWidth={3} /></span>{c}</span>
                      ))}
                      {!aberto && p.compra.length > 3 && <span className="rounded-full bg-white/25 px-3 py-1 text-base font-semibold">+{p.compra.length - 3}</span>}
                    </div>
                  </div>
                )}
                <button onClick={() => alternar(p.nome)} aria-expanded={aberto} className="mt-auto inline-flex h-12 items-center justify-between gap-2 rounded-2xl bg-white/20 px-4 text-lg font-bold ring-1 ring-white/30 transition hover:bg-white/30">
                  Como chegar neles <ChevronDown className={cn("size-5 transition", aberto && "rotate-180")} />
                </button>
                {aberto && (
                  <dl className="space-y-3 rounded-2xl bg-black/20 p-4 text-lg">
                    <div className="flex gap-3"><CalendarClock className="mt-1 size-5 shrink-0" /><div><dt className="text-base font-bold text-white/70">Quando</dt><dd>{p.quando}</dd></div></div>
                    <div className="flex gap-3"><Megaphone className="mt-1 size-5 shrink-0" /><div><dt className="text-base font-bold text-white/70">Canal</dt><dd>{p.canal}</dd></div></div>
                    <div className="flex gap-3"><MessageSquareQuote className="mt-1 size-5 shrink-0" /><div><dt className="text-base font-bold text-white/70">Mensagem</dt><dd>{p.mensagem}</dd></div></div>
                  </dl>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-[32px] bg-white/60 p-6 shadow-[0_24px_50px_-30px_rgba(11,107,60,0.5),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 backdrop-blur-xl sm:p-7" aria-labelledby="setores-b">
          <h2 id="setores-b" className="flex items-center gap-3.5 font-display text-2xl font-extrabold text-[#0b4a2a]">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#14a05a] text-white shadow-[0_10px_20px_-8px_rgba(20,160,90,0.8)]"><Store className="size-6" /></span>
            Setores para implantar ou reforçar
          </h2>
          <ul className="space-y-1">
            {insight.setores.map((s) => {
              const Icone = PRIO_ICONE[s.prioridade];
              return (
                <li key={s.nome} className="flex gap-4 rounded-3xl p-3 transition hover:bg-white/70">
                  <span className={cn("mt-0.5 grid size-12 shrink-0 place-items-center rounded-full text-white shadow-md", PRIO_COR[s.prioridade])}><Icone className="size-6" /></span>
                  <div className="min-w-0">
                    <p className="text-xl font-extrabold leading-snug text-[#111827]">{s.nome}</p>
                    <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold", PRIO[s.prioridade])}>{PRIO_TEXTO[s.prioridade]}</span>
                    <p className="mt-1.5 text-lg leading-snug text-[#4b5563]">{s.porque}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="space-y-5 rounded-[32px] bg-white/60 p-6 shadow-[0_24px_50px_-30px_rgba(179,18,47,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70 backdrop-blur-xl sm:p-7" aria-labelledby="gondolas">
          <h2 id="gondolas" className="flex items-center gap-3.5 font-display text-2xl font-extrabold text-[#7a1020]">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#e8284f] text-white shadow-[0_10px_20px_-8px_rgba(232,40,79,0.8)]"><LayoutPanelTop className="size-6" /></span>
            Gôndolas e exposição
          </h2>
          <ul className="space-y-1">
            {insight.gondolas.map((g) => (
              <li key={g.onde + g.oque} className="flex gap-4 rounded-3xl p-3 transition hover:bg-white/70">
                <span className="mt-0.5 grid size-12 shrink-0 place-items-center rounded-full bg-[#fde3e8] text-[#e8284f]"><MapPin className="size-6" /></span>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold leading-snug text-[#111827]">{g.onde}</p>
                  <p className="mt-1 flex gap-2 text-lg leading-snug text-[#1f2937]"><Check className="mt-1 size-5 shrink-0 text-[#14a05a]" strokeWidth={3} /> {g.oque}</p>
                  <p className="mt-1 text-base leading-snug text-[#6b7280]">{g.porque}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="relative isolate overflow-hidden rounded-[32px] p-6 text-white shadow-[0_30px_60px_-30px_rgba(69,39,184,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] ring-1 ring-white/30 [background-image:linear-gradient(135deg,#7a5cf5_0%,#3b1fa8_100%)] sm:p-8" aria-labelledby="oport">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 -z-10 size-80 rounded-full bg-white/15 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="oport" className="flex items-center gap-3.5 font-display text-2xl font-extrabold sm:text-3xl">
            <span className="grid size-12 place-items-center rounded-full bg-white text-[#4527b8]"><Target className="size-6" /></span> Próximas ações
          </h2>
          <span className="rounded-full bg-white/20 px-4 py-1.5 text-base font-bold ring-1 ring-white/30">{feitas.size} de {insight.oportunidades.length} feitas</span>
        </div>
        <p className="mt-2 text-lg text-white/80">Toque na ação para marcar como feita.</p>
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {insight.oportunidades.map((o) => {
            const feita = feitas.has(o);
            return (
              <li key={o}>
                <button onClick={() => marcar(o)} aria-pressed={feita} className={cn("flex w-full items-start gap-3.5 rounded-3xl p-4 text-left text-lg leading-snug ring-1 backdrop-blur-md transition", feita ? "bg-white/10 text-white/60 ring-white/15" : "bg-white/15 ring-white/30 hover:bg-white/25")}>
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition", feita ? "bg-[#7dffb0] text-[#0b4a2a]" : "bg-white/20 ring-2 ring-white/50")}>
                    {feita && <Check className="size-5" strokeWidth={3.5} />}
                  </span>
                  <span className={cn(feita && "line-through")}>{o}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {insight.horarios && (
          <p className="mt-6 flex items-start gap-3 rounded-3xl bg-black/15 p-4 text-lg text-white/90">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20"><Clock className="size-5" /></span> {insight.horarios}
          </p>
        )}
      </section>
    </div>
  );
}
