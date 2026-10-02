"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ParsedProduct, ParseResult, ProductField } from "@/lib/products";

type DraftProduct = ParsedProduct & { include: boolean };

const FIELD_LABEL: Record<ProductField, string> = {
  sku: "código",
  ean: "código de barras",
  name: "nome",
  brand: "marca",
  category: "categoria",
  price: "preço",
  cost: "custo",
  stock: "estoque",
  unit: "unidade",
};

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function ImportProducts({ marketId, onImported }: { marketId: string; onImported?: () => void }) {
  const [products, setProducts] = useState<DraftProduct[] | null>(null);
  const [meta, setMeta] = useState<Omit<ParseResult, "products"> | null>(null);
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setDoneCount(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Esse arquivo tem ${(file.size / (1024 * 1024)).toFixed(1)} MB e o limite é 20 MB.`);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setReading(true);
    setProducts(null);
    setMeta(null);
    setFileName(file.name);
    try {
      const upload = await postJson("/api/produtos/importar/upload-url", { marketId, fileName: file.name });
      if (!upload.ok) {
        setError(upload.data.error || "Não consegui preparar o envio da planilha.");
        return;
      }

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("imports")
        .uploadToSignedUrl(upload.data.path, upload.data.token, file);
      if (uploadError) {
        setError("Não consegui enviar a planilha. Tente de novo.");
        return;
      }

      const read = await postJson("/api/produtos/importar/ler", { marketId, path: upload.data.path });
      if (!read.ok) {
        setError(read.data.error || "Não consegui ler a planilha.");
        return;
      }
      const { products: parsed, ...rest } = read.data as ParseResult;
      setProducts(parsed.map((p) => ({ ...p, include: true })));
      setMeta(rest);
    } catch {
      setError("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function updateProduct(idx: number, patch: Partial<DraftProduct>) {
    setProducts((prev) => (prev ? prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)) : prev));
  }

  async function handleConfirm() {
    if (!products || !meta) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toCreate = products.filter((p) => p.include).map(({ include, ...p }) => p);
    if (toCreate.length === 0) {
      setError("Marque pelo menos um produto para importar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await postJson("/api/produtos/importar/gravar", {
        marketId,
        products: toCreate,
        fileName,
        columns: meta.columns,
        skippedRows: meta.skippedRows,
      });
      if (!res.ok) {
        setError(res.data.error || "Não consegui gravar os produtos.");
        return;
      }
      setDoneCount(res.data.imported);
      setProducts(null);
      setMeta(null);
      onImported?.();
    } catch {
      setError("Sem conexão agora. Nada foi perdido: confirme de novo.");
    } finally {
      setSaving(false);
    }
  }

  const included = products?.filter((p) => p.include).length ?? 0;
  const understood = meta
    ? (Object.entries(meta.columns) as [ProductField, string][]).map(([field, col]) => `${FIELD_LABEL[field]} (${col})`)
    : [];

  return (
    <div className="space-y-4">
      {!products && (
        <div className="space-y-2">
          <label className="inline-flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-4 py-2 text-sm cursor-pointer hover:border-neutral-400">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv"
              disabled={reading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {reading ? "Lendo a planilha..." : "Escolher planilha (.xlsx ou .csv)"}
          </label>
          <p className="text-xs text-neutral-500">
            Precisa de uma coluna com o nome do produto. Código, código de barras, preço, custo, categoria, marca,
            estoque e unidade são lidos quando existirem.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {doneCount != null && <p className="text-sm text-green-700">{doneCount} produto(s) importado(s).</p>}

      {products && meta && (
        <div className="space-y-3">
          <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3 text-sm text-neutral-700 space-y-1">
            <p>
              Entendi: {products.length} produto(s) a partir da linha {meta.headerRow + 1} de {fileName}.
            </p>
            <p className="text-neutral-500">Colunas lidas: {understood.join(", ")}.</p>
            {meta.generatedSkus > 0 && (
              <p className="text-amber-700">
                {meta.generatedSkus} produto(s) sem código: o código foi criado pelo nome. Se o nome mudar numa próxima
                planilha, ele entra como produto novo.
              </p>
            )}
            {meta.skippedRows.length > 0 && (
              <details className="text-neutral-500">
                <summary className="cursor-pointer">{meta.skippedRows.length} linha(s) ignorada(s)</summary>
                <ul className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                  {meta.skippedRows.slice(0, 200).map((s, i) => (
                    <li key={i}>
                      Linha {s.rowIndex}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 max-h-[28rem] overflow-y-auto bg-white">
            {products.slice(0, 1000).map((p, i) => (
              <div key={p.sku} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  aria-label={`Importar ${p.name}`}
                  checked={p.include}
                  onChange={(e) => updateProduct(i, { include: e.target.checked })}
                />
                <input
                  value={p.name}
                  aria-label="Nome"
                  onChange={(e) => updateProduct(i, { name: e.target.value })}
                  className="flex-1 min-w-[10rem] border border-transparent hover:border-neutral-200 rounded px-2 py-1"
                />
                <span className="text-xs text-neutral-400 w-24 truncate" title={p.sku}>
                  {p.sku.startsWith("n:") ? "sem código" : p.sku}
                </span>
                <input
                  value={p.category ?? ""}
                  placeholder="categoria"
                  aria-label="Categoria"
                  onChange={(e) => updateProduct(i, { category: e.target.value || null })}
                  className="w-28 border border-transparent hover:border-neutral-200 rounded px-2 py-1 text-neutral-500"
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={p.price ?? ""}
                  placeholder="preço"
                  aria-label="Preço"
                  onChange={(e) => updateProduct(i, { price: e.target.value ? Number(e.target.value) : null })}
                  className="w-24 border border-transparent hover:border-neutral-200 rounded px-2 py-1"
                />
                <span className="text-xs text-neutral-400 w-8">{p.unit ?? ""}</span>
              </div>
            ))}
            {products.length > 1000 && (
              <p className="px-3 py-2 text-xs text-neutral-500">
                Mostrando os primeiros 1.000 de {products.length}. Todos serão importados.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "Importando..." : `Confirmar importação (${included})`}
            </button>
            <button
              onClick={() => {
                setProducts(null);
                setMeta(null);
              }}
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
