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
  image_url: string | null;
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
  const [creatingImage, setCreatingImage] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q));
  }, [products, search]);

  function toggleProduct(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    setError("");
    if (!name.trim()) return setError("Dê um nome pro tabloide.");
    if (selected.size === 0) return setError("Selecione ao menos um produto.");

    setSaving(true);
    try {
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar o tabloide.");
        return;
      }

      const renderRes = await fetch(`/api/tabloides/${data.id}/render`);
      const renderData = await renderRes.json();
      if (renderRes.ok) {
        setPreviewHtml(renderData.html);
      }
    } catch {
      setError("Falha de conexão ao criar o tabloide.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadImage() {
    if (!previewRef.current) return;
    setCreatingImage(true);
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(previewRef.current, { backgroundColor: "#ffffff", scale: 2 });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "tabloide"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setCreatingImage(false);
    }
  }

  if (previewHtml) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-white p-4">
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={creatingImage}
            className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {creatingImage ? "Gerando imagem..." : "Baixar imagem"}
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
                {s.label} — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
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

        <div className="grid grid-cols-3 gap-4">
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
        <div className="flex items-center justify-between">
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
              <span className="flex-1">{p.name}</span>
              {p.category && <span className="text-neutral-400 text-xs">{p.category}</span>}
              <span className="text-neutral-700 font-medium">
                {p.price != null ? p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}
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
        {saving ? "Gerando..." : "Gerar tabloide"}
      </button>
    </div>
  );
}
