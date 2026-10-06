"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, RotateCw, CloudSun, Copy, Check, LayoutGrid, MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, Segmented, cn } from "@/components/ui";
import type { ContentPlan, Pauta } from "@/lib/ai/pautas";

const OBJ = {
  vender: { label: "Vender", dot: "bg-[var(--tomate)]" },
  atrair: { label: "Atrair", dot: "bg-[var(--uva)]" },
  relacionar: { label: "Relacionar", dot: "bg-[var(--folha)]" },
} as const;
const FORMATO = { feed: "Feed", story: "Story", reels: "Reels", whatsapp: "WhatsApp" } as const;
type Filtro = "todas" | Pauta["objetivo"];

function weekKey(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}
const dayParts = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return {
    dow: d.toLocaleDateString("pt-BR", { weekday: "short", timeZone: "UTC" }).replace(".", ""),
    day: d.getUTCDate(),
    month: d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", ""),
  };
};

function CopyIcon({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Não consegui copiar.");
        }
      }}
      className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
    >
      {done ? <Check className="size-4 text-[var(--folha)]" /> : <Copy className="size-4" />} {done ? "Copiado" : "Copiar legenda"}
    </button>
  );
}

export function PautasView({ marketId, slug, today, initial, hasCity }: { marketId: string; slug: string; today: string; initial: ContentPlan | null; hasCity: boolean }) {
  const [plan, setPlan] = useState(initial);
  const [running, setRunning] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todas");

  async function generate() {
    setRunning(true);
    try {
      const res = await fetch("/api/pautas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não consegui montar o calendário.");
        return;
      }
      setPlan(data.plan);
      toast.success("Calendário pronto.");
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setRunning(false);
    }
  }

  const weeks = useMemo(() => {
    const list = (plan?.pautas ?? []).filter((p) => filtro === "todas" || p.objetivo === filtro);
    const map = new Map<string, Pauta[]>();
    for (const p of list) map.set(weekKey(p.data), [...(map.get(weekKey(p.data)) ?? []), p]);
    return [...map.entries()];
  }, [plan, filtro]);

  if (!plan) {
    return (
      <Glass data-trabalhando={running} className={cn("borda-ia flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8", running && "varredura")}>
        <div className="max-w-xl">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-[var(--uva)]" /> Calendário dos próximos 30 dias
          </h2>
          <p className="mt-1 text-[var(--ink-2)]">
            {running ? "A IA está montando o calendário. Leva menos de um minuto." : "Uma pauta por dia, de 4 a 5 por semana, com legenda pronta e indicação de quando vale montar encarte."}
          </p>
          {!hasCity && !running && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--ink-3)]">
              <MapPin className="size-4" /> Coloque a cidade em <Link href={`/${slug}/mercado#contatos`} className="underline underline-offset-4">Mercado</Link> para as pautas usarem a previsão do tempo.
            </p>
          )}
        </div>
        <Button variant="ia" size="lg" onClick={generate} loading={running} icon={<Sparkles className="size-5" />}>
          {running ? "Montando" : "Montar calendário"}
        </Button>
      </Glass>
    );
  }

  return (
    <div className="space-y-5">
      <Glass className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="min-w-0 max-w-2xl space-y-2">
          {plan.resumo && <p className="font-display text-xl font-bold leading-snug">{plan.resumo}</p>}
          {plan.clima && (
            <p className="flex items-start gap-2 text-sm text-[var(--ink-2)]">
              <CloudSun className="mt-0.5 size-4 shrink-0 text-[var(--uva)]" /> {plan.clima}
            </p>
          )}
        </div>
        <Button size="sm" variant="fantasma" onClick={generate} loading={running} icon={<RotateCw className="size-4" />}>
          Refazer
        </Button>
      </Glass>

      <div className="rolagem -mx-1 overflow-x-auto px-1">
        <Segmented
          label="Objetivo"
          value={filtro}
          onChange={setFiltro}
          size="sm"
          options={[
            { value: "todas", label: `Todas (${plan.pautas.length})` },
            { value: "vender", label: "Vender" },
            { value: "atrair", label: "Atrair" },
            { value: "relacionar", label: "Relacionar" },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={filtro}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          className="space-y-6"
        >
          {weeks.map(([wk, items]) => (
            <section key={wk} className="space-y-2">
              <h2 className="px-1 text-sm font-semibold text-[var(--ink-3)]">Semana de {dayParts(wk).day} de {dayParts(wk).month}</h2>
              <ul className="space-y-3">
                {items.map((p) => {
                  const d = dayParts(p.data);
                  const past = p.data < today;
                  const isToday = p.data === today;
                  return (
                    <li key={`${p.data}-${p.titulo}`} className={cn("vidro grid grid-cols-[56px_minmax(0,1fr)] gap-4 rounded-[22px] p-4 sm:grid-cols-[64px_minmax(0,1fr)] sm:p-5", past && "opacity-55", isToday && "ring-2 ring-[var(--tomate)]")}>
                      <div className="flex flex-col items-center pt-0.5 text-center">
                        <span className="text-xs capitalize text-[var(--ink-3)]">{isToday ? "hoje" : d.dow}</span>
                        <span className="font-display text-3xl font-extrabold leading-none">{d.day}</span>
                        <span className="text-xs text-[var(--ink-3)]">{d.month}</span>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-full bg-[var(--line)] px-2.5 py-0.5 font-medium">{FORMATO[p.formato]}</span>
                          <span className="flex items-center gap-1.5 text-[var(--ink-2)]">
                            <span className={cn("size-2 rounded-full", OBJ[p.objetivo].dot)} /> {OBJ[p.objetivo].label}
                          </span>
                        </div>
                        <h3 className="font-semibold leading-snug">{p.titulo}</h3>
                        <p className="text-sm text-[var(--ink-2)]">{p.ideia}</p>
                        {p.legenda && <p className="whitespace-pre-line rounded-2xl bg-[var(--glass-strong)] p-3 text-[15px] leading-relaxed ring-1 ring-[var(--line)]">{p.legenda}</p>}
                        {p.produtos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {p.produtos.map((x) => (
                              <span key={x} className="rounded-full bg-[var(--folha-soft)] px-2.5 py-0.5 text-xs text-[var(--folha)]">{x}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {p.legenda && <CopyIcon text={p.legenda} />}
                          {p.pedeEncarte && !past && (
                            <Link
                              href={`/${slug}/encartes/novo?titulo=${encodeURIComponent(p.titulo)}&de=${p.data}&ate=${p.data}`}
                              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)] hover:text-[var(--ink)]"
                            >
                              <LayoutGrid className="size-4" /> Montar encarte
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
