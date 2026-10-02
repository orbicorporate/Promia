"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GerenteRecommendation } from "@/lib/ai/gerente";

const TYPE_LABEL: Record<string, string> = {
  destacar: "Destacar",
  promover: "Promover",
  repor_estoque: "Repor estoque",
  revisar_preco: "Revisar preço",
  queimar_estoque: "Queimar estoque",
};

export function RecommendationList({ items }: { items: GerenteRecommendation[] }) {
  return (
    <ul className="space-y-2">
      {items.map((r, i) => (
        <li key={i} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-neutral-500">{TYPE_LABEL[r.type] ?? r.type}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">prioridade {r.priority}</span>
          </div>
          <p className="text-sm font-medium text-neutral-900 mt-1">{r.target}</p>
          <p className="text-sm text-neutral-600 mt-1">{r.reason}</p>
        </li>
      ))}
    </ul>
  );
}

export function RunGerenteButton({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [unsaved, setUnsaved] = useState<GerenteRecommendation[] | null>(null);

  async function handleClick() {
    setLoading(true);
    setErro("");
    setAviso("");
    try {
      const res = await fetch("/api/ia/gerente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(
          data.error || (res.status === 504 ? "A análise demorou demais. Tente de novo." : "O gerente não respondeu agora. Tente de novo.")
        );
        return;
      }
      if (data.warning) {
        // não ficou salvo: mostra aqui mesmo, senão a tela exibiria a rodada antiga
        setAviso(data.warning);
        setUnsaved(data.recommendations ?? null);
        return;
      }
      setUnsaved(null);
      // a lista "Última análise" vem do servidor, já com a rodada nova
      router.refresh();
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {loading ? "Analisando o catálogo (leva cerca de 1 minuto)..." : "Rodar gerente inteligente"}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {aviso && <p className="text-sm text-amber-700">{aviso}</p>}
      {unsaved && unsaved.length > 0 && <RecommendationList items={unsaved} />}
    </div>
  );
}
