"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { plural } from "@/lib/plural";

// Roda a fila de fotos em lotes até acabar, mostrando o progresso.
export function FindPhotos({ marketId, pending, semFoto = 0, auto = true }: { marketId: string; pending: number; semFoto?: number; auto?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [found, setFound] = useState(0);
  const [total, setTotal] = useState(pending);

  async function refazer() {
    setRunning(true);
    try {
      const res = await fetch("/api/produtos/buscar-imagens", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, refazer: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.requeued) {
        setRunning(false);
        if (!res.ok) toast.error(data.error || "Não consegui recolocar na fila.");
        else if (data.applied) toast.success(`${data.applied} fotos aplicadas das opções já encontradas. Confira as marcadas para revisar.`);
        else toast.message("Nenhum produto para buscar de novo. Os que sobraram pedem foto manual.");
        router.refresh();
        return;
      }
      setRunning(false);
      await start(data.requeued);
    } catch {
      setRunning(false);
      toast.error("Sem conexão. Tente de novo.");
    }
  }

  async function start(qtd: number = pending) {
    setRunning(true);
    setDone(0);
    setFound(0);
    setTotal(qtd);
    let processed = 0;
    let achadas = 0;
    try {
      for (let guard = 0; guard < 500; guard++) {
        const res = await fetch("/api/produtos/buscar-imagens", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ marketId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.error || "A busca parou. Tente de novo.");
          break;
        }
        processed += data.processed ?? 0;
        achadas += data.found ?? 0;
        setDone(processed);
        setFound(achadas);
        setTotal(processed + (data.remaining ?? 0));
        if (!data.processed || !data.remaining) break;
        if (guard % 2 === 1) router.refresh();
      }
      if (processed) toast.success(`${achadas} de ${processed} fotos encontradas. Confira as que pedem revisão.`);
    } catch {
      toast.error("Sem conexão. O que já foi encontrado ficou salvo.");
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  // a fila começa sozinha ao abrir a tela (uma vez): ninguém precisa lembrar de clicar
  const iniciou = useRef(false);
  useEffect(() => {
    if (auto && pending > 0 && !iniciou.current) {
      iniciou.current = true;
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, pending]);

  if (!pending && !running && !semFoto) return null;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div data-trabalhando={running} className="borda-ia vidro flex flex-wrap items-center gap-4 rounded-[22px] p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {running ? `Buscando fotos: ${done} de ${total}` : pending > 0 ? `${plural(pending, "produto esperando", "produtos esperando")} foto` : `${plural(semFoto, "produto sem foto", "produtos sem foto")}`}
        </p>
        <p className="text-sm text-[var(--ink-2)]">
          {running ? `${plural(found, "encontrada", "encontradas")} até agora. Pode continuar usando o Promia.` : pending > 0 ? "Primeiro pelo código de barras, depois na internet com conferência da IA." : "A busca agora olha também o Google Shopping e o catálogo aberto de produtos."}
        </p>
        {running && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]">
            <motion.div className="h-full rounded-full [background-image:var(--ai)]" animate={{ width: `${Math.max(4, pct)}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
          </div>
        )}
      </div>
      {!running && pending > 0 && (
        <Button variant="ia" icon={<Sparkles className="size-4" />} onClick={() => start()}>
          Buscar fotos
        </Button>
      )}
      {!running && pending === 0 && semFoto > 0 && (
        <Button variant="ia" icon={<Sparkles className="size-4" />} onClick={refazer}>
          Buscar de novo os {semFoto} sem foto
        </Button>
      )}
    </div>
  );
}
