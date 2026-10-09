"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, ChevronRight, RotateCw, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Glass, Button, ButtonLink, cn } from "@/components/ui";

export type Rec = {
  id: string;
  type: string;
  target: string;
  reason: string;
  priority: string;
  productIds: string[];
};

const TYPE: Record<string, { label: string; tone: string }> = {
  destacar: { label: "Destacar no encarte", tone: "var(--folha)" },
  promover: { label: "Vale promover", tone: "var(--tomate)" },
  repor_estoque: { label: "Repor estoque", tone: "var(--uva)" },
  revisar_preco: { label: "Revisar preço", tone: "#c47f00" },
  queimar_estoque: { label: "Girar o estoque", tone: "#c2410c" },
};

const PRIO: Record<string, number> = { alta: 0, "média": 1, baixa: 2 };

export function GerenteCard({
  marketId,
  slug,
  recs: initial,
  generatedAt,
  hasProducts,
}: {
  marketId: string;
  slug: string;
  recs: Rec[];
  generatedAt: string | null;
  hasProducts: boolean;
}) {
  const router = useRouter();
  const recs = [...initial].sort((a, b) => (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1));
  const [i, setI] = useState(0);
  const [running, setRunning] = useState(false);
  const rec = recs[i % Math.max(recs.length, 1)];

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/ia/gerente", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || (res.status === 504 ? "A análise demorou demais. Tente de novo." : "O gerente não respondeu agora."));
        return;
      }
      if (data.warning) toast.warning(data.warning);
      else toast.success("Análise pronta.");
      setI(0);
      router.refresh();
    } catch {
      toast.error("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setRunning(false);
    }
  }

  const when = generatedAt
    ? new Date(generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Glass as="section" data-trabalhando={running} className={cn("borda-ia flex flex-col p-5 sm:p-6", running && "varredura")} aria-labelledby="gerente">
      <div className="flex items-center justify-between gap-3">
        <h2 id="gerente" className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-[var(--uva)]" />
          <span className="text-[var(--uva)]">Gerente</span>
        </h2>
        {when && <span className="text-xs text-[var(--ink-3)]">Análise de {when}</span>}
      </div>

      {!hasProducts ? (
        <div className="mt-3 flex flex-col items-start gap-4">
          <p className="text-[var(--ink-2)]">
            Com a planilha importada, o gerente lê preço, custo e estoque e diz o que destacar, promover ou repor.
          </p>
          <ButtonLink href={`/${slug}/produtos?importar=1`} variant="vidro">
            Enviar planilha
          </ButtonLink>
        </div>
      ) : recs.length === 0 ? (
        <div className="mt-3 flex flex-col items-start gap-4">
          <p className="text-[var(--ink-2)]">
            O gerente analisa o catálogo, as vendas, a concorrência, o bairro, as datas próximas e as promoções fixas, e aponta onde está a margem e o que precisa
            girar. Leva cerca de um minuto.
          </p>
          <Button variant="ia" onClick={run} loading={running} icon={<Sparkles className="size-4" />}>
            {running ? "Analisando o catálogo" : "Analisar catálogo"}
          </Button>
        </div>
      ) : (
        <>
          <div className="relative mt-4 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -6, filter: "blur(2px)", transition: { duration: 0.15 } }}
                transition={{ type: "spring", duration: 0.35, bounce: 0 }}
                className="space-y-2"
              >
                <p className="flex items-center gap-2 text-sm font-medium" style={{ color: TYPE[rec.type]?.tone }}>
                  <span className="size-2 rounded-full" style={{ background: TYPE[rec.type]?.tone }} />
                  {TYPE[rec.type]?.label ?? rec.type}
                  {rec.priority === "alta" && <span className="text-[var(--ink-3)] font-normal">· prioridade alta</span>}
                </p>
                <p className="font-display text-2xl font-extrabold leading-tight">{rec.target}</p>
                <p className="text-[15px] leading-relaxed text-[var(--ink-2)]">{rec.reason}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {rec.productIds.length > 0 && (rec.type === "destacar" || rec.type === "promover" || rec.type === "queimar_estoque") && (
              <Link
                href={`/${slug}/encartes/novo?produtos=${rec.productIds.join(",")}`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--ink)] px-4 text-sm font-medium text-[var(--bg)] transition hover:-translate-y-px"
              >
                <LayoutGrid className="size-4" /> Montar encarte com isso
              </Link>
            )}
            {recs.length > 1 && (
              <button
                onClick={() => setI((v) => (v + 1) % recs.length)}
                className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)]"
              >
                Próxima <ChevronRight className="size-4" />
              </button>
            )}
            <span className="ml-auto flex items-center" aria-label={`Sugestão ${i + 1} de ${recs.length}`}>
              {recs.map((r, idx) => (
                <button
                  key={r.id}
                  onClick={() => setI(idx)}
                  className="grid h-11 w-6 place-items-center"
                  aria-label={`Ver sugestão ${idx + 1}`}
                  aria-current={idx === i ? "true" : undefined}
                >
                  <span className={cn("h-1.5 w-5 rounded-full transition-[transform,background-color]", idx === i ? "scale-x-100 bg-[var(--ink)]" : "scale-x-[0.3] bg-[var(--line-strong)]")} />
                </button>
              ))}
            </span>
          </div>
          <button
            onClick={run}
            disabled={running}
            className="mt-2 inline-flex h-11 items-center gap-2 self-start text-sm text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-60"
          >
            <RotateCw className={cn("size-3.5", running && "animate-spin")} />
            {running ? "Analisando o catálogo, cerca de um minuto" : "Analisar de novo"}
          </button>
        </>
      )}
    </Glass>
  );
}
