"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

// Roda a fila de fotos em lotes até acabar, mostrando o progresso.
export function FindPhotos({ marketId, pending }: { marketId: string; pending: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [found, setFound] = useState(0);
  const [total, setTotal] = useState(pending);

  async function start() {
    setRunning(true);
    setDone(0);
    setFound(0);
    setTotal(pending);
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

  if (!pending && !running) return null;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="borda-ia vidro flex flex-wrap items-center gap-4 rounded-[22px] p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {running ? `Buscando fotos: ${done} de ${total}` : `${pending} produto(s) esperando foto`}
        </p>
        <p className="text-sm text-[var(--ink-2)]">
          {running ? `${found} encontrada(s) até agora. Pode continuar usando o Promia.` : "Primeiro pelo código de barras, depois na internet com conferência da IA."}
        </p>
        {running && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--line)]">
            <motion.div className="h-full rounded-full [background-image:var(--ai)]" animate={{ width: `${Math.max(4, pct)}%` }} transition={{ type: "spring", stiffness: 80, damping: 20 }} />
          </div>
        )}
      </div>
      {!running && (
        <Button variant="ia" icon={<Sparkles className="size-4" />} onClick={start}>
          Buscar fotos
        </Button>
      )}
    </div>
  );
}
