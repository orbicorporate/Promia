"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, RotateCw, Users, Store, LayoutPanelTop, Clock, MapPin, ChevronDown, CalendarClock, Megaphone, MessageSquareQuote, ShoppingBasket, Check, Flame, Zap, Leaf, Target, School, GraduationCap, Dumbbell, HeartPulse, Building2, Building, UtensilsCrossed, Church, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, cn } from "@/components/ui";
import type { BairroInsight } from "@/lib/ai/bairro";

// Cores do Promia, só nas bolinhas e nos ícones: o resto é vidro.
const TONS = [
  { bola: "bg-[#138a4c] text-white shadow-[0_8px_18px_-8px_rgba(19,138,76,0.9)]", suave: "bg-[#138a4c]/12 text-[#138a4c]" },
  { bola: "bg-[#ef4127] text-white shadow-[0_8px_18px_-8px_rgba(239,65,39,0.9)]", suave: "bg-[#ef4127]/12 text-[#d63318]" },
  { bola: "bg-[#6b4dff] text-white shadow-[0_8px_18px_-8px_rgba(107,77,255,0.9)]", suave: "bg-[#6b4dff]/12 text-[#6b4dff]" },
  { bola: "bg-[#ffcf3a] text-[#5a3f00] shadow-[0_8px_18px_-8px_rgba(255,207,58,1)]", suave: "bg-[#ffcf3a]/25 text-[#8a6200]" },
] as const;
const tom = (i: number) => TONS[i % TONS.length];

const ICONE_ENTORNO: Record<string, LucideIcon> = { escolas: School, faculdades: GraduationCap, academias: Dumbbell, saude: HeartPulse, empresas: Building2, condominios: Building, restaurantes: UtensilsCrossed, igrejas: Church };
const PRIO = {
  alta: { Icone: Flame, bola: TONS[1].bola, etiqueta: "bg-[#ef4127]/12 text-[#d63318]", texto: "Prioridade alta" },
  media: { Icone: Zap, bola: TONS[3].bola, etiqueta: "bg-[#ffcf3a]/30 text-[#7a5500]", texto: "Prioridade média" },
  baixa: { Icone: Leaf, bola: TONS[0].bola, etiqueta: "bg-[#138a4c]/12 text-[#138a4c]", texto: "Prioridade baixa" },
} as const;

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

function Titulo({ id, Icone, cor, children, extra }: { id: string; Icone: LucideIcon; cor: number; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-3 font-display text-xl font-extrabold sm:text-2xl">
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tom(cor).bola)}><Icone className="size-5" /></span>
        {children}
      </h2>
      {extra}
    </div>
  );
}

function Resultado({ insight, running, run }: { insight: BairroInsight; running: boolean; run: () => void }) {
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [feitas, setFeitas] = useState<Set<string>>(new Set());
  const alternar = (set: typeof abertos, fn: typeof setAbertos, k: string) => { const n = new Set(set); if (n.has(k)) n.delete(k); else n.add(k); fn(n); };
  const entorno = insight.entorno.filter((e) => e.count > 0);
  const longo = insight.perfil.length > 280;
  const resumo = longo && !perfilAberto ? insight.perfil.slice(0, 280).replace(/\s+\S*$/, "") + "..." : insight.perfil;

  return (
    <div className="space-y-6">
      <Glass as="section" className="space-y-5 p-6 sm:p-8" aria-labelledby="resumo">
        <Titulo id="resumo" Icone={MapPin} cor={0} extra={
          <Button size="sm" variant="fantasma" onClick={run} loading={running} icon={<RotateCw className="size-4" />}>Refazer análise</Button>
        }>Seu bairro em resumo</Titulo>
        <div>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--ink)] sm:text-lg">{resumo}</p>
          {longo && (
            <button onClick={() => setPerfilAberto((v) => !v)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--folha)] hover:underline">
              {perfilAberto ? "Mostrar menos" : "Ler análise completa"} <ChevronDown className={cn("size-4 transition", perfilAberto && "rotate-180")} />
            </button>
          )}
        </div>
        {entorno.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {entorno.map((e, i) => {
              const Icone = ICONE_ENTORNO[e.key] ?? Building;
              return (
                <li key={e.key} title={e.examples.join(", ")} className="flex items-center gap-3.5 rounded-3xl bg-[var(--glass-strong)] p-3.5 ring-1 ring-[var(--line)]">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tom(i).bola)}><Icone className="size-5" /></span>
                  <span className="min-w-0">
                    <span className="tabular block text-2xl font-extrabold leading-none">{e.count >= 10 ? "10+" : e.count}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-[var(--ink-2)]">{e.label}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Glass>

      <section className="space-y-4" aria-labelledby="publicos">
        <Titulo id="publicos" Icone={Users} cor={2}>Públicos para trabalhar</Titulo>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-2 xl:grid-cols-3">
          {insight.publicos.map((p, i) => {
            const aberto = abertos.has(p.nome);
            return (
              <Glass as="article" key={p.nome} className="flex flex-col gap-4 p-6">
                <div className="flex items-center gap-3.5">
                  <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", tom(i).bola)}><Users className="size-5" /></span>
                  <h3 className="font-display text-xl font-extrabold leading-tight">{p.nome}</h3>
                </div>
                <p className="line-clamp-3 text-base leading-snug text-[var(--ink-2)]">{p.quem}</p>
                {p.compra.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-sm font-bold"><span className={cn("grid size-7 place-items-center rounded-full", tom(i).suave)}><ShoppingBasket className="size-4" /></span> Eles compram</p>
                    <div className="flex flex-wrap gap-2">
                      {p.compra.slice(0, aberto ? 12 : 3).map((c) => (
                        <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--glass-strong)] py-1 pl-1.5 pr-3 text-sm font-semibold ring-1 ring-[var(--line)]">
                          <span className="grid size-5 place-items-center rounded-full bg-[#138a4c] text-white"><Check className="size-3.5" strokeWidth={3} /></span>{c}
                        </span>
                      ))}
                      {!aberto && p.compra.length > 3 && <span className="rounded-full bg-[var(--line)] px-3 py-1 text-sm font-semibold text-[var(--ink-2)]">+{p.compra.length - 3}</span>}
                    </div>
                  </div>
                )}
                <button onClick={() => alternar(abertos, setAbertos, p.nome)} aria-expanded={aberto} className="mt-auto inline-flex h-12 items-center justify-between gap-2 rounded-full bg-[var(--glass-strong)] px-5 text-base font-bold ring-1 ring-[var(--line-strong)] transition hover:bg-white">
                  Como chegar neles <ChevronDown className={cn("size-5 transition", aberto && "rotate-180")} />
                </button>
                {aberto && (
                  <dl className="space-y-3.5 text-base">
                    {([[CalendarClock, "Quando", p.quando, 0], [Megaphone, "Canal", p.canal, 1], [MessageSquareQuote, "Mensagem", p.mensagem, 2]] as const).map(([Icone, rotulo, texto, t]) => (
                      <div key={rotulo} className="flex gap-3">
                        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tom(t).suave)}><Icone className="size-5" /></span>
                        <div><dt className="text-sm font-bold text-[var(--ink-3)]">{rotulo}</dt><dd className="leading-snug">{texto}</dd></div>
                      </div>
                    ))}
                  </dl>
                )}
              </Glass>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Glass as="section" className="space-y-4 p-6 sm:p-7" aria-labelledby="setores-b">
          <Titulo id="setores-b" Icone={Store} cor={0}>Setores para implantar ou reforçar</Titulo>
          <ul className="space-y-1">
            {insight.setores.map((s) => {
              const pr = PRIO[s.prioridade];
              return (
                <li key={s.nome} className="flex gap-4 rounded-3xl p-3 transition hover:bg-[var(--glass-strong)]">
                  <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-full", pr.bola)}><pr.Icone className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold leading-snug">{s.nome}</p>
                    <span className={cn("mt-1 inline-block rounded-full px-2.5 py-0.5 text-sm font-bold", pr.etiqueta)}>{pr.texto}</span>
                    <p className="mt-1.5 text-base leading-snug text-[var(--ink-2)]">{s.porque}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Glass>
        <Glass as="section" className="space-y-4 p-6 sm:p-7" aria-labelledby="gondolas">
          <Titulo id="gondolas" Icone={LayoutPanelTop} cor={1}>Gôndolas e exposição</Titulo>
          <ul className="space-y-1">
            {insight.gondolas.map((g, i) => (
              <li key={g.onde + g.oque} className="flex gap-4 rounded-3xl p-3 transition hover:bg-[var(--glass-strong)]">
                <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-full", tom(i + 1).suave)}><MapPin className="size-5" /></span>
                <div className="min-w-0">
                  <p className="text-lg font-extrabold leading-snug">{g.onde}</p>
                  <p className="mt-1 flex gap-2 text-base leading-snug"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#138a4c] text-white"><Check className="size-3.5" strokeWidth={3} /></span> {g.oque}</p>
                  <p className="mt-1 text-sm leading-snug text-[var(--ink-3)]">{g.porque}</p>
                </div>
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <Glass as="section" className="space-y-4 p-6 sm:p-8" aria-labelledby="oport">
        <Titulo id="oport" Icone={Target} cor={3} extra={<span className="rounded-full bg-[var(--glass-strong)] px-4 py-1.5 text-sm font-bold ring-1 ring-[var(--line)]">{feitas.size} de {insight.oportunidades.length} feitas</span>}>Próximas ações</Titulo>
        <p className="text-base text-[var(--ink-2)]">Toque na ação para marcar como feita.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {insight.oportunidades.map((o) => {
            const feita = feitas.has(o);
            return (
              <li key={o}>
                <button onClick={() => alternar(feitas, setFeitas, o)} aria-pressed={feita} className={cn("flex w-full items-start gap-3.5 rounded-3xl p-4 text-left text-base leading-snug ring-1 transition", feita ? "bg-[var(--folha-soft)] text-[var(--ink-3)] ring-[#138a4c]/25" : "bg-[var(--glass-strong)] ring-[var(--line)] hover:-translate-y-px")}>
                  <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full transition", feita ? "bg-[#138a4c] text-white" : "ring-2 ring-[var(--line-strong)]")}>
                    {feita && <Check className="size-5" strokeWidth={3.5} />}
                  </span>
                  <span className={cn(feita && "line-through")}>{o}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {insight.horarios && (
          <p className="flex items-start gap-3 rounded-3xl bg-[var(--glass-strong)] p-4 text-base ring-1 ring-[var(--line)]">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-full", tom(2).suave)}><Clock className="size-5" /></span> {insight.horarios}
          </p>
        )}
      </Glass>
    </div>
  );
}
