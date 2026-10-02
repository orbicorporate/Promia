"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FindImagesButton({ marketId, pendingCount }: { marketId: string; pendingCount: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  // durante a busca mostra o progresso local; fora dela, a contagem que vem
  // do servidor (antes o botão ficava preso no valor da primeira carga e
  // sumia depois de uma importação até recarregar a página)
  const [progress, setProgress] = useState<number | null>(null);
  const left = progress ?? pendingCount;
  const [found, setFound] = useState(0);
  const [error, setError] = useState("");

  async function handleClick() {
    setRunning(true);
    setError("");
    setFound(0);
    try {
      let remaining = left;
      while (remaining > 0) {
        const res = await fetch("/api/produtos/buscar-imagens", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ marketId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(
            data.error ||
              (res.status === 504 ? "A busca demorou demais nesse lote. Clique de novo para continuar." : "Erro ao buscar fotos.")
          );
          break;
        }
        remaining = data.remaining ?? 0;
        setProgress(remaining);
        setFound((f) => f + (data.found ?? 0));
        // nada processado: outra aba está cuidando do resto da fila
        if (!data.processed) break;
      }
    } catch {
      setError("Sem conexão agora. Clique de novo para continuar de onde parou.");
    } finally {
      setRunning(false);
      setProgress(null);
      router.refresh();
    }
  }

  if (left === 0 && !running) {
    return found > 0 ? <p className="text-sm text-green-700">{found} foto(s) encontrada(s) nesta busca.</p> : null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={running}
        className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {running ? `Buscando fotos... (${left} na fila)` : `Buscar fotos automaticamente (${left} na fila)`}
      </button>
      {running && <p className="text-xs text-neutral-500">Pode deixar a página aberta; a busca continua sozinha.</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
