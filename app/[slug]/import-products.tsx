"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ParsedProduct } from "@/lib/products";

type DraftProduct = ParsedProduct & { include: boolean };

function toDraft(products: ParsedProduct[]): DraftProduct[] {
  return products.map((p) => ({ ...p, include: true }));
}

export function ImportProducts({ marketId, onImported }: { marketId: string; onImported?: () => void }) {
  const [products, setProducts] = useState<DraftProduct[] | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

  async function handleFile(file: File) {
    setError(null);
    setDoneCount(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Esse arquivo tem ${(file.size / (1024 * 1024)).toFixed(1)}MB e o limite é 20MB.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setReading(true);
    setProducts(null);
    try {
      const urlRes = await fetch("/api/master/import-products/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, fileName: file.name }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok) {
        setError(urlData.error || "Erro ao preparar o envio da planilha.");
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("imports")
        .uploadToSignedUrl(urlData.path, urlData.token, file);
      if (uploadError) {
        setError(`Erro ao enviar a planilha: ${uploadError.message}`);
        return;
      }

      const res = await fetch("/api/master/import-products/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, path: urlData.path }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao ler a planilha.");
      } else {
        setProducts(toDraft(data.products));
        setSkippedCount(data.skippedRows?.length ?? 0);
      }
    } catch {
      setError("Falha de conexão ao enviar a planilha.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function updateProduct(idx: number, patch: Partial<DraftProduct>) {
    setProducts((prev) => (prev ? prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)) : prev));
  }

  function removeProduct(idx: number) {
    setProducts((prev) => (prev ? prev.filter((_, i) => i !== idx) : prev));
  }

  async function handleConfirm() {
    if (!products) return;
    const toCreate = products.filter((p) => p.include);
    if (toCreate.length === 0) {
      setError("Marque pelo menos um produto pra importar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/master/import-products/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, products: toCreate }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao gravar os produtos.");
      } else {
        setDoneCount(data.imported);
        setProducts(null);
        onImported?.();
      }
    } catch {
      setError("Falha de conexão ao gravar os produtos.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {!products && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv,.xls"
            disabled={reading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm"
          />
          {reading && <p className="text-sm text-neutral-500 mt-2">Lendo a planilha...</p>}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {doneCount != null && (
        <p className="text-sm text-green-700">{doneCount} produto(s) importado(s) com sucesso.</p>
      )}

      {products && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-600">
            {products.length} produto(s) identificado(s){skippedCount > 0 ? `, ${skippedCount} linha(s) ignorada(s)` : ""}.
            Confira antes de confirmar (você pode desmarcar ou remover o que não fizer sentido).
          </p>

          <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-96 overflow-y-auto">
            {products.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.include}
                  onChange={(e) => updateProduct(i, { include: e.target.checked })}
                />
                <input
                  value={p.name}
                  onChange={(e) => updateProduct(i, { name: e.target.value })}
                  className="flex-1 border border-transparent hover:border-neutral-200 rounded px-2 py-1"
                />
                <input
                  value={p.category ?? ""}
                  placeholder="categoria"
                  onChange={(e) => updateProduct(i, { category: e.target.value || null })}
                  className="w-32 border border-transparent hover:border-neutral-200 rounded px-2 py-1 text-neutral-500"
                />
                <input
                  type="number"
                  step="0.01"
                  value={p.price ?? ""}
                  placeholder="preço"
                  onChange={(e) => updateProduct(i, { price: e.target.value ? Number(e.target.value) : null })}
                  className="w-24 border border-transparent hover:border-neutral-200 rounded px-2 py-1"
                />
                <button
                  onClick={() => removeProduct(i)}
                  className="text-neutral-400 hover:text-red-600 text-xs"
                >
                  remover
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Importando..." : `Confirmar importação (${products.filter((p) => p.include).length})`}
            </button>
            <button
              onClick={() => setProducts(null)}
              className="text-sm text-neutral-500 px-3 py-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
