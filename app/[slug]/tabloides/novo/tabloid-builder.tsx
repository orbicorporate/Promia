"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ThemeSuggestion } from "@/lib/themes";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  image_status: string;
};

type ThemeOption = {
  id: string;
  name: string;
  kind: string;
};

export function TabloidBuilder({
  marketId,
  marketSlug,
  products,
  themes,
  suggestions,
}: {
  marketId: string;
  marketSlug: string;
  products: Product[];
  themes: ThemeOption[];
  suggestions: ThemeSuggestion[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [themeId, setThemeId] = useState(themes[0]?.id ?? "");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [tabloidId, setTabloidId] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState("");
  const [creatingImage, setCreatingImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }, [products, search]);

  const formKey = JSON.stringify([name, category, themeId, validFrom, validUntil, Array.from(selected).sort()]);

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function renderTabloid(id: string) {
    const renderRes = await fetch(`/api/tabloides/${id}/render`);
    const renderData = await renderRes.json().catch(() => ({}));
    if (!renderRes.ok || !renderData.html) {
      setError(renderData.error || "O tabloide foi salvo, mas não consegui montar a arte. Tente gerar de novo.");
      return;
    }
    setPreviewHtml(renderData.html);
  }

  async function handleCreate() {
    setError("");
    if (!name.trim()) return setError("Dê um nome pro tabloide.");
    if (!themeId) return setError("Escolha um tema.");
    if (selected.size === 0) return setError("Selecione ao menos um produto.");
    if (validFrom && validUntil && validFrom > validUntil) return setError("A data final vem antes da inicial.");

    setSaving(true);
    try {
      // se a arte falhou antes e nada mudou, só monta de novo, sem criar outro
      if (tabloidId && savedKey === formKey) {
        await renderTabloid(tabloidId);
        return;
      }
      const res = await fetch("/api/tabloides/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          marketId,
          name,
          category,
          themeId,
          validFrom: validFrom || null,
          validUntil: validUntil || null,
          productIds: Array.from(selected),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Não consegui criar o tabloide.");
        return;
      }
      setTabloidId(data.id);
      setSavedKey(formKey);
      await renderTabloid(data.id);
    } catch {
      setError("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadImage() {
    if (!previewRef.current) return;
    setCreatingImage(true);
    setError("");
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("sem imagem");
      const fileName = `${(name || "tabloide").replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "tabloide"}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      // no celular, abre o compartilhar (WhatsApp, Instagram); no computador, baixa
      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: name });
          return;
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError("Não consegui gerar a imagem. Tente de novo.");
    } finally {
      setCreatingImage(false);
    }
  }

  if (previewHtml) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-white p-2 sm:p-4">
          <div ref={previewRef} className="w-fit" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={creatingImage}
            className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {creatingImage ? "Gerando imagem..." : "Baixar ou compartilhar imagem"}
          </button>
          <button
            onClick={() => router.push(`/${marketSlug}`)}
            className="text-sm text-neutral-500 px-3 py-2"
          >
            Voltar pro painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {suggestions.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-neutral-700">Sugestões pros próximos dias</p>
          <ul className="space-y-1">
            {suggestions.slice(0, 5).map((s, i) => (
              <li key={i} className="text-sm text-neutral-600">
                <span className="text-neutral-400">{new Date(`${s.date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}:</span>{" "}
                {s.label}: {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Nome do tabloide</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ex.: Ofertas da Semana"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Categoria (opcional)</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Tema</label>
            <select
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">Válido de</label>
            <input
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-neutral-600">até</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-neutral-700">Produtos ({selected.size} selecionado(s))</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="border border-neutral-300 rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 border border-neutral-100 rounded-lg">
          {filteredProducts.length === 0 && (
            <p className="text-sm text-neutral-400 px-3 py-4">Nenhum produto encontrado.</p>
          )}
          {filteredProducts.map((p) => (
            <label key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-neutral-50">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleProduct(p.id)} />
              <span className="flex-1 min-w-0">
                {p.name}
                {p.image_status !== "encontrada" && <span className="ml-2 text-xs text-amber-700">sem foto</span>}
              </span>
              {p.category && <span className="text-neutral-400 text-xs">{p.category}</span>}
              <span className="text-neutral-700 font-medium">
                {p.price != null ? p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
                {p.unit && p.unit !== "un" ? `/${p.unit}` : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={saving}
        className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
      >
        {saving ? "Gerando..." : tabloidId && savedKey === formKey ? "Tentar montar a arte de novo" : "Gerar tabloide"}
      </button>
    </div>
  );
}
