"use client";

import { useState } from "react";
import type { GerenteRecommendation } from "@/lib/ai/gerente";

export function RunGerenteButton({ marketId }: { marketId: string }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [recs, setRecs] = useState<GerenteRecommendation[] | null>(null);

  async function handleClick() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/ia/gerente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setErro(data.error || "Erro ao rodar o gerente.");
      return;
    }
    setRecs(data.recommendations);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Analisando catálogo..." : "Rodar gerente inteligente"}
      </button>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {recs && (
        <ul className="space-y-2">
          {recs.map((r, i) => (
            <li key={i} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wide text-neutral-400">{r.type.replace("_", " ")}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{r.priority}</span>
              </div>
              <p className="text-sm font-medium text-neutral-900 mt-1">{r.target}</p>
              <p className="text-sm text-neutral-600 mt-1">{r.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
