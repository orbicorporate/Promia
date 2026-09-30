"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FindImagesButton({ marketId, pendingCount }: { marketId: string; pendingCount: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(pendingCount);
  const [error, setError] = useState("");

  async function handleClick() {
    setRunning(true);
    setError("");
    try {
      let remaining = left;
      // processa em lotes até zerar a fila, pra não precisar clicar várias vezes
      while (remaining > 0) {
        const res = await fetch("/api/master/products/find-images", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ marketId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Erro ao buscar imagens.");
          break;
        }
        remaining = data.remaining;
        setLeft(remaining);
        if (data.processed === 0) break;
      }
    } finally {
      setRunning(false);
      router.refresh();
    }
  }

  if (pendingCount === 0 && left === 0) return null;

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={running}
        className="bg-white border border-neutral-300 rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {running ? `Buscando imagens... (${left} restante(s))` : `Buscar imagens automaticamente (${left} pendente(s))`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
