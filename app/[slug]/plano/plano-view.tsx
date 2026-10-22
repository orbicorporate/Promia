"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, RotateCw, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, cn } from "@/components/ui";
import type { PlanoMarketing } from "@/lib/ai/plano";

const chave = (marketId: string, geradoEm: string) => `promia:plano:${marketId}:${geradoEm}`;

export function PlanoView({ marketId, initial }: { marketId: string; initial: PlanoMarketing | null }) {
  const [plano, setPlano] = useState(initial);
  const [rodando, setRodando] = useState(false);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!plano) return;
    const t = setTimeout(() => {
      try {
        const salvo = localStorage.getItem(chave(marketId, plano.geradoEm));
        setFeitos(new Set(salvo ? (JSON.parse(salvo) as string[]) : []));
      } catch {
        setFeitos(new Set());
      }
    }, 0);
    return () => clearTimeout(t);
  }, [plano, marketId]);

  function alternar(id: string) {
    if (!plano) return;
    const novo = new Set(feitos);
    if (!novo.delete(id)) novo.add(id);
    setFeitos(novo);
    try {
      localStorage.setItem(chave(marketId, plano.geradoEm), JSON.stringify([...novo]));
    } catch {
      /* sem armazenamento: o check vale só nesta tela */
    }
  }

  async function gerar() {
    setRodando(true);
    try {
      const res = await fetch("/api/ia/plano", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ marketId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não consegui montar o plano.");
        return;
      }
      setPlano(data.plano);
      setFeitos(new Set());
      toast.success("Plano pronto.");
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setRodando(false);
    }
  }

  if (!plano) {
    return (
      <Glass as="section" data-trabalhando={rodando} className={cn("borda-ia flex flex-col items-start gap-4 p-6 sm:p-8", rodando && "varredura")}>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Sparkles className="size-5 text-[var(--uva)]" aria-hidden /> Seu plano das próximas 4 semanas
        </h2>
        <p className="max-w-xl text-[var(--ink-2)]">{rodando ? "A IA está montando o plano com os seus dados. Leva cerca de 30 segundos." : "O gerente olha as suas vendas, os preços do concorrente, o bairro e as datas próximas, e monta o que fazer em cada semana."}</p>
        <Button variant="ia" size="lg" onClick={gerar} loading={rodando} icon={<Sparkles className="size-5" />}>
          {rodando ? "Montando" : "Montar meu plano"}
        </Button>
      </Glass>
    );
  }

  const total = plano.semanas.reduce((n, s) => n + s.passos.length, 0);

  return (
    <div className="space-y-5">
      <Glass className="space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-2xl space-y-2">
            {plano.resumo && <p className="text-lg font-semibold leading-snug">{plano.resumo}</p>}
            {plano.objetivo && <p className="text-[var(--ink-2)]"><span className="font-semibold text-[var(--ink)]">Objetivo:</span> {plano.objetivo}</p>}
            {plano.publico && <p className="text-[var(--ink-2)]"><span className="font-semibold text-[var(--ink)]">Para quem:</span> {plano.publico}</p>}
          </div>
          <Button size="sm" variant="fantasma" onClick={gerar} loading={rodando} icon={<RotateCw className="size-4" />}>
            Refazer plano
          </Button>
        </div>
        <div className="flex items-center gap-3" aria-label={`${feitos.size} de ${total} passos feitos`}>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full rounded-full bg-[var(--folha)] transition-[width]" style={{ width: `${total ? (feitos.size / total) * 100 : 0}%` }} />
          </div>
          <span className="text-sm tabular text-[var(--ink-2)]">{feitos.size} de {total}</span>
        </div>
      </Glass>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        {plano.semanas.map((s, si) => (
          <Glass as="section" key={si} className="space-y-3 p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--folha)]">Semana {si + 1}</p>
              <h3 className="text-lg font-bold leading-tight">{s.titulo}</h3>
              {s.foco && <p className="mt-0.5 text-sm text-[var(--ink-2)]">{s.foco}</p>}
            </div>
            <ol className="space-y-2">
              {s.passos.map((p, pi) => {
                const id = `${si}-${pi}`;
                const feito = feitos.has(id);
                return (
                  <li key={id} className="flex gap-3 rounded-2xl bg-[var(--glass-strong)] p-3 ring-1 ring-[var(--line)]">
                    <button type="button" role="checkbox" aria-checked={feito} aria-label={`Marcar como feito: ${p.acao}`} onClick={() => alternar(id)} className="grid size-11 shrink-0 place-items-center">
                      <span className={cn("grid size-6 place-items-center rounded-full ring-2 transition", feito ? "bg-[var(--folha)] text-white ring-[var(--folha)]" : "ring-[var(--line-strong)]")}>{feito && <Check className="size-4" strokeWidth={3} />}</span>
                    </button>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className={cn("text-[15px] leading-snug", feito && "text-[var(--ink-3)] line-through")}>{p.acao}</p>
                      <p className="text-xs text-[var(--ink-3)]">{[p.quando, p.canal].filter(Boolean).join(" · ")}</p>
                      {p.botao && (
                        <Link href={p.botao.href} className="inline-flex h-9 items-center rounded-full bg-[var(--folha)] px-3.5 text-sm font-semibold text-white transition active:scale-[0.97]">
                          {p.botao.rotulo}
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </Glass>
        ))}
      </div>

      {plano.metricas.length > 0 && (
        <Glass as="section" className="space-y-2 p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <Target className="size-5 text-[var(--ink-3)]" aria-hidden /> Como saber se está funcionando
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-[15px] text-[var(--ink-2)]">
            {plano.metricas.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </Glass>
      )}
    </div>
  );
}
