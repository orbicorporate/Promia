"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { Button, cn } from "@/components/ui";
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
  const [dragging, setDragging] = useState(false);
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
      // em lotes, pra cada requisição ficar bem abaixo do limite da Vercel
      const CHUNK = 2000;
      let imported = 0;
      for (let i = 0; i < toCreate.length; i += CHUNK) {
        const last = i + CHUNK >= toCreate.length;
        const res = await postJson("/api/produtos/importar/gravar", {
          marketId,
          products: toCreate.slice(i, i + CHUNK),
          columns: meta.columns,
          final: last,
          ...(last ? { fileName, skippedRows: meta.skippedRows, totalImported: imported + Math.min(CHUNK, toCreate.length - i) } : {}),
        });
        if (!res.ok) {
          setError(
            (res.data.error || "Não consegui gravar os produtos.") +
              (imported > 0 ? ` ${imported} já foram gravados; confirmar de novo não duplica nada.` : "")
          );
          return;
        }
        imported += res.data.imported ?? 0;
      }
      setDoneCount(imported);
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
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file && !reading) handleFile(file);
          }}
          className={cn(
            "relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-[22px] border-2 border-dashed px-6 py-10 text-center transition",
            dragging ? "border-[var(--folha)] bg-[var(--folha-soft)] scale-[1.01]" : "border-[var(--line-strong)] hover:border-[var(--ink-3)] hover:bg-[var(--glass)]",
            reading && "varredura pointer-events-none"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={reading}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <span className="grid size-14 place-items-center rounded-2xl bg-[var(--folha)] text-white shadow-[0_12px_30px_-12px_var(--folha)]">
            {reading ? <Loader2 className="size-6 animate-spin" /> : <FileSpreadsheet className="size-6" />}
          </span>
          <span className="font-display text-xl font-bold">{reading ? `Lendo ${fileName}` : "Solte a planilha aqui"}</span>
          <span className="max-w-md text-sm text-[var(--ink-2)]">
            {reading
              ? "Encontrando as colunas de nome, código e preço."
              : "Ou toque para escolher. Excel (.xlsx) ou CSV exportado do seu sistema. Só precisa ter o nome do produto; código, código de barras, preço, categoria e marca entram quando existirem."}
          </span>
        </label>
      )}

      {error && <p className="rounded-2xl bg-[color-mix(in_srgb,var(--perigo)_12%,transparent)] px-4 py-3 text-sm text-[var(--perigo)]">{error}</p>}
      {doneCount != null && (
        <p className="flex items-center gap-2 rounded-2xl bg-[var(--folha-soft)] px-4 py-3 text-sm font-medium text-[var(--folha)]">
          <CheckCircle2 className="size-5" /> {doneCount} produto(s) importado(s). As fotos começam a ser buscadas na lista de produtos.
        </p>
      )}

      {products && meta && (
        <div className="space-y-3">
          <div className="space-y-1.5 rounded-2xl bg-[var(--glass-strong)] px-4 py-3 text-sm ring-1 ring-[var(--line)]">
            <p className="font-medium">
              {products.length} produto(s) a partir da linha {meta.headerRow + 1} de {fileName}.
            </p>
            <p className="text-[var(--ink-2)]">Colunas lidas: {understood.join(", ")}.</p>
            {meta.generatedSkus > 0 && (
              <p className="text-[var(--banana-ink)] dark:text-[var(--banana)]">
                {meta.generatedSkus} produto(s) sem código: o código foi criado pelo nome. Se o nome mudar numa próxima planilha, ele entra como produto novo.
              </p>
            )}
            {meta.skippedRows.length > 0 && (
              <details className="text-[var(--ink-3)]">
                <summary className="cursor-pointer">{meta.skippedRows.length} linha(s) ignorada(s)</summary>
                <ul className="rolagem mt-1 max-h-40 space-y-0.5 overflow-y-auto">
                  {meta.skippedRows.slice(0, 200).map((s, i) => (
                    <li key={i}>
                      Linha {s.rowIndex}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="rolagem max-h-[26rem] divide-y divide-[var(--line)] overflow-y-auto rounded-2xl bg-[var(--glass-strong)] ring-1 ring-[var(--line)]">
            {products.slice(0, 1000).map((p, i) => (
              <div key={p.sku} className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-sm", !p.include && "opacity-45")}>
                <input
                  type="checkbox"
                  aria-label={`Importar ${p.name}`}
                  checked={p.include}
                  onChange={(e) => updateProduct(i, { include: e.target.checked })}
                  className="size-4 accent-[var(--folha)]"
                />
                <input
                  value={p.name}
                  aria-label="Nome"
                  onChange={(e) => updateProduct(i, { name: e.target.value })}
                  className="min-w-[10rem] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 hover:border-[var(--line-strong)] focus:border-[var(--uva)] outline-none"
                />
                <span className="w-24 truncate text-xs text-[var(--ink-3)]" title={p.sku}>
                  {p.sku.startsWith("n:") ? "sem código" : p.sku}
                </span>
                <input
                  value={p.category ?? ""}
                  placeholder="categoria"
                  aria-label="Categoria"
                  onChange={(e) => updateProduct(i, { category: e.target.value || null })}
                  className="w-28 rounded-lg border border-transparent bg-transparent px-2 py-1 text-[var(--ink-2)] hover:border-[var(--line-strong)] outline-none"
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
                  className="w-24 rounded-lg border border-transparent bg-transparent px-2 py-1 tabular hover:border-[var(--line-strong)] outline-none"
                />
                <span className="w-8 text-xs text-[var(--ink-3)]">{p.unit ?? ""}</span>
              </div>
            ))}
            {products.length > 1000 && (
              <p className="px-3 py-2 text-xs text-[var(--ink-3)]">Mostrando os primeiros 1.000 de {products.length}. Todos serão importados.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleConfirm} loading={saving}>
              {saving ? "Importando" : `Importar ${included} produto(s)`}
            </Button>
            <Button
              variant="fantasma"
              onClick={() => {
                setProducts(null);
                setMeta(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
