"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, Reorder, useReducedMotion } from "motion/react";
import {
  Search,
  Star,
  X,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Check,
  ImageOff,
  Loader2,
  Smartphone,
  Square,
  RectangleVertical,
  FileText,
  LayoutGrid,
  Rows3,
  Sparkle,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { Glass, Button, Segmented, Input, Field, PriceTag, cn, inputClass } from "@/components/ui";
import { FORMATS } from "@/lib/encarte/formats";
import { FORMAT_HINT, ITEM_LABELS, LAYOUT_HINT, LAYOUT_SHORT } from "@/lib/encarte/labels";
import type { EncarteFormat, EncarteLayout } from "@/lib/encarte/types";

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
};

export type ThemeOption = { key: string; name: string; headline: string; bg: string; text: string; tag: string; tagText: string; cardBg: string };

export type BuilderItem = {
  productId: string;
  promoPrice: number | null;
  oldPrice: number | null;
  highlight: boolean;
  limitQty: number | null;
  label: string | null;
};

export type BuilderInitial = {
  id?: string;
  name: string;
  headline: string;
  subheadline: string;
  format: EncarteFormat;
  layout: EncarteLayout;
  themeKey: string;
  validFrom: string;
  validUntil: string;
  items: BuilderItem[];
};

type Tab = "produtos" | "estilo" | "previa";

const money = (n: number | null | undefined) => (n == null ? "" : n.toFixed(2).replace(".", ","));
const parseMoney = (s: string) => {
  const t = s.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function EncarteBuilder({
  marketId,
  slug,
  catalog,
  themes,
  suggestedThemeKeys,
  initial,
  today,
}: {
  marketId: string;
  slug: string;
  catalog: CatalogProduct[];
  themes: ThemeOption[];
  suggestedThemeKeys: string[];
  initial: BuilderInitial;
  today: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("produtos");
  const [name, setName] = useState(initial.name);
  const [headline, setHeadline] = useState(initial.headline);
  const [subheadline, setSubheadline] = useState(initial.subheadline);
  const [format, setFormat] = useState<EncarteFormat>(initial.format);
  const [layout, setLayout] = useState<EncarteLayout>(initial.layout);
  const [themeKey, setThemeKey] = useState(initial.themeKey);
  const [validFrom, setValidFrom] = useState(initial.validFrom);
  const [validUntil, setValidUntil] = useState(initial.validUntil);
  const [items, setItems] = useState<BuilderItem[]>(initial.items);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const selected = useMemo(() => new Set(items.map((i) => i.productId)), [items]);
  const theme = themes.find((t) => t.key === themeKey) ?? themes[0];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of catalog) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return catalog
      .filter((p) => (!category || p.category === category) && (!q || norm(`${p.name} ${p.brand ?? ""} ${p.category ?? ""}`).includes(q)))
      .slice(0, 200);
  }, [catalog, query, category]);

  const orderedThemes = useMemo(() => {
    const rank = (k: string) => {
      const i = suggestedThemeKeys.indexOf(k);
      return i === -1 ? 999 : i;
    };
    return [...themes].sort((a, b) => rank(a.key) - rank(b.key));
  }, [themes, suggestedThemeKeys]);

  function toggle(p: CatalogProduct) {
    setItems((prev) =>
      prev.some((i) => i.productId === p.id)
        ? prev.filter((i) => i.productId !== p.id)
        : // sem preço de oferta próprio, o encarte usa o preço atual do catálogo
          [...prev, { productId: p.id, promoPrice: null, oldPrice: null, highlight: false, limitQty: null, label: null }]
    );
  }

  // alternativa ao arrastar, para teclado e leitor de tela
  function move(id: string, delta: number) {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.productId === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function patch(id: string, change: Partial<BuilderItem>) {
    setItems((prev) => prev.map((i) => (i.productId === id ? { ...i, ...change } : i)));
  }

  // -------------------------- prévia ao vivo --------------------------
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPages, setPreviewPages] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastUrl = useRef<string | null>(null);

  const previewData = useMemo(
    () => ({
      name: name || "Encarte",
      headline: headline || null,
      subheadline: subheadline || null,
      format,
      layout,
      themeKey,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      items: items
        .map((i) => {
          const p = byId.get(i.productId);
          const price = i.promoPrice ?? p?.price ?? null;
          if (!p || price == null) return null;
          const old = i.oldPrice ?? (p.price != null && p.price > price ? p.price : null);
          return {
            name: p.name,
            brand: p.brand,
            unit: p.unit,
            imageUrl: p.image_url,
            price,
            oldPrice: old,
            highlight: i.highlight,
            limitQty: i.limitQty,
            label: i.label,
          };
        })
        .filter(Boolean),
    }),
    [name, headline, subheadline, format, layout, themeKey, validFrom, validUntil, items, byId]
  );
  const previewKey = JSON.stringify(previewData);

  const loadPreview = useCallback(
    async (page: number) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPreviewLoading(true);
      setPreviewError(null);
      try {
        const res = await fetch("/api/encartes/previa", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ marketId, data: JSON.parse(previewKey), pagina: page }),
          signal: ctrl.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 404 && page > 1) {
            setPreviewPage(1);
            return;
          }
          setPreviewError(data.error || "Não consegui desenhar a prévia.");
          return;
        }
        const pages = Number(res.headers.get("x-encarte-paginas") || "1");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (lastUrl.current) setTimeout((u: string) => URL.revokeObjectURL(u), 1500, lastUrl.current);
        lastUrl.current = url;
        setPreviewUrl(url);
        setPreviewPages(pages);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setPreviewError("Sem conexão para gerar a prévia.");
      } finally {
        if (abortRef.current === ctrl) setPreviewLoading(false);
      }
    },
    [marketId, previewKey]
  );

  useEffect(() => {
    const t = setTimeout(() => loadPreview(previewPage), 550);
    return () => clearTimeout(t);
  }, [loadPreview, previewPage]);

  // ------------------------------ salvar ------------------------------
  async function save() {
    if (!name.trim()) {
      toast.error("Dê um nome para o encarte.");
      setTab("estilo");
      return;
    }
    if (items.length === 0) {
      toast.error("Escolha pelo menos um produto.");
      setTab("produtos");
      return;
    }
    const semPreco = items.filter((i) => (i.promoPrice ?? byId.get(i.productId)?.price) == null);
    if (semPreco.length) {
      toast.error(`${semPreco.length} produto(s) sem preço. Informe o preço de oferta.`);
      setTab("produtos");
      setEditing(semPreco[0].productId);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(initial.id ? `/api/encartes/${initial.id}` : "/api/encartes", {
        method: initial.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, name, headline, subheadline, format, layout, themeKey, validFrom, validUntil, items }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não consegui salvar o encarte.");
        return;
      }
      toast.success(initial.id ? "Encarte atualizado." : "Encarte criado.");
      router.push(`/${slug}/encartes/${data.id}?novo=1`);
      router.refresh();
    } catch {
      toast.error("Sem conexão agora. Nada foi perdido: tente salvar de novo.");
    } finally {
      setSaving(false);
    }
  }

  const f = FORMATS[format];
  const capacity = f.capacity[layout];
  const capacityLabel = layout === "destaque" ? `1 grande + ${capacity.perPage - 1} por página` : `${capacity.perPage} por página`;

  // ------------------------------- partes -----------------------------
  const productsPanel = (
    <div className="space-y-5">
      <Glass className="p-4 sm:p-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--ink-3)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${catalog.length} produtos`}
            className="pl-10"
            aria-label="Buscar produtos"
          />
        </div>
        {categories.length > 1 && (
          <div className="rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <Chip on={!category} onClick={() => setCategory(null)}>
              Todas
            </Chip>
            {categories.map((c) => (
              <Chip key={c} on={category === c} onClick={() => setCategory(category === c ? null : c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}
        <ul className="rolagem max-h-[340px] overflow-y-auto -mx-2 px-1">
          {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-[var(--ink-3)]">Nada encontrado com essa busca.</li>}
          {filtered.map((p) => {
            const on = selected.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition active:scale-[0.99]",
                    on ? "bg-[var(--folha-soft)]" : "hover:bg-[var(--line)]"
                  )}
                  aria-pressed={on}
                >
                  <Thumb url={p.image_url} name={p.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-[var(--ink-3)]">{[p.brand, p.category].filter(Boolean).join(" · ") || "sem categoria"}</span>
                  </span>
                  <PriceTag value={p.price} unit={p.unit} size="sm" />
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full border transition",
                      on ? "border-transparent bg-[var(--folha)] text-white" : "border-[var(--line-strong)]"
                    )}
                    aria-hidden
                  >
                    {on && <Check className="size-4" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Glass>

      <Glass className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold">No encarte ({items.length})</h3>
          {items.length > 0 && (
            <button onClick={() => setItems([])} className="text-sm text-[var(--ink-3)] hover:text-[var(--perigo)]">
              Limpar
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--ink-2)]">Toque nos produtos acima para colocar no encarte. A estrela deixa o produto em destaque.</p>
        ) : (
          <Reorder.Group axis="y" values={items} onReorder={setItems} className="mt-3 space-y-2">
            {items.map((it) => {
              const p = byId.get(it.productId);
              if (!p) return null;
              const open = editing === it.productId;
              const price = it.promoPrice ?? p.price;
              return (
                <Reorder.Item
                  key={it.productId}
                  value={it}
                  className="rounded-2xl bg-[var(--glass-strong)] ring-1 ring-[var(--line)]"
                  whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -20px rgba(0,0,0,0.4)" }}
                >
                  <div className="flex items-center gap-2 p-2 pr-3">
                    <span className="cursor-grab touch-none text-[var(--ink-3)] active:cursor-grabbing" aria-hidden>
                      <GripVertical className="size-5" />
                    </span>
                    <Thumb url={p.image_url} name={p.name} />
                    <button type="button" onClick={() => setEditing(open ? null : it.productId)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-[15px] font-medium">{p.name}</span>
                      <span className="block text-xs text-[var(--ink-3)]">
                        {it.oldPrice ? `de R$ ${money(it.oldPrice)} · ` : ""}
                        {it.label ?? ""}
                        {it.limitQty ? ` · limite ${it.limitQty}` : ""}
                        {!it.oldPrice && !it.label && !it.limitQty ? "Toque para ajustar preço e selo" : ""}
                      </span>
                    </button>
                    {price == null ? <span className="text-xs font-medium text-[var(--perigo)]">sem preço</span> : <PriceTag value={price} unit={p.unit} size="sm" />}
                    <button
                      type="button"
                      onClick={() => patch(it.productId, { highlight: !it.highlight })}
                      className={cn("grid size-11 place-items-center rounded-xl transition", it.highlight ? "text-[#e0a500]" : "text-[var(--ink-3)] hover:bg-[var(--line)]")}
                      aria-pressed={it.highlight}
                      aria-label={it.highlight ? "Tirar destaque" : "Destacar"}
                    >
                      <Star className="size-5" fill={it.highlight ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      className="grid size-11 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)] hover:text-[var(--perigo)]"
                      aria-label={`Tirar ${p.name}`}
                    >
                      <X className="size-5" />
                    </button>
                  </div>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-3 border-t border-[var(--line)] p-3 sm:grid-cols-4">
                          <div className="col-span-full flex items-center gap-2 text-sm text-[var(--ink-2)]">
                            <span className="flex-1">Ordem no encarte: {items.indexOf(it) + 1} de {items.length}</span>
                            <button type="button" onClick={() => move(it.productId, -1)} disabled={items.indexOf(it) === 0} className="grid size-11 place-items-center rounded-xl hover:bg-[var(--line)] disabled:opacity-35" aria-label="Subir uma posição">
                              <ArrowUp className="size-5" />
                            </button>
                            <button type="button" onClick={() => move(it.productId, 1)} disabled={items.indexOf(it) === items.length - 1} className="grid size-11 place-items-center rounded-xl hover:bg-[var(--line)] disabled:opacity-35" aria-label="Descer uma posição">
                              <ArrowDown className="size-5" />
                            </button>
                          </div>
                          <Field label="Preço de oferta">
                            <MoneyInput value={it.promoPrice} onChange={(v) => patch(it.productId, { promoPrice: v })} placeholder={money(p.price) || "0,00"} />
                          </Field>
                          <Field label='Preço "de"' hint="Riscado no encarte">
                            <MoneyInput value={it.oldPrice} onChange={(v) => patch(it.productId, { oldPrice: v })} placeholder="opcional" />
                          </Field>
                          <Field label="Limite por cliente">
                            <Input
                              inputMode="numeric"
                              value={it.limitQty ?? ""}
                              onChange={(e) => {
                                const n = Number(e.target.value.replace(/\D/g, ""));
                                patch(it.productId, { limitQty: n >= 1 && n <= 999 ? n : null });
                              }}
                              placeholder="sem limite"
                            />
                          </Field>
                          <Field label="Selo">
                            <Input
                              list="selos"
                              value={it.label ?? ""}
                              maxLength={28}
                              onChange={(e) => patch(it.productId, { label: e.target.value || null })}
                              placeholder="ex. Só hoje"
                            />
                          </Field>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}
        <datalist id="selos">
          {ITEM_LABELS.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
      </Glass>
    </div>
  );

  const stylePanel = (
    <div className="space-y-5">
      <Glass className="p-4 sm:p-5 space-y-4">
        <h3 className="font-bold">Formato</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(
            [
              ["feed", RectangleVertical],
              ["story", Smartphone],
              ["quadrado", Square],
              ["a4", FileText],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFormat(key);
                setPreviewPage(1);
              }}
              aria-pressed={format === key}
              className={cn(
                "flex flex-col items-start gap-2 rounded-2xl p-3 text-left ring-1 transition",
                format === key ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--glass-strong)] ring-[var(--line)] hover:-translate-y-0.5"
              )}
            >
              <Icon className="size-5" />
              <span>
                <span className="block text-sm font-semibold">{key === "a4" ? "A4" : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <span className={cn("block text-xs", format === key ? "opacity-70" : "text-[var(--ink-3)]")}>{FORMAT_HINT[key]}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label="Layout"
            value={layout}
            onChange={(v) => {
              setLayout(v);
              setPreviewPage(1);
            }}
            options={[
              { value: "grade", label: LAYOUT_SHORT.grade, icon: <LayoutGrid className="size-4" /> },
              { value: "destaque", label: LAYOUT_SHORT.destaque, icon: <Sparkle className="size-4" /> },
              { value: "lista", label: LAYOUT_SHORT.lista, icon: <Rows3 className="size-4" /> },
            ]}
          />
          <span className="text-sm text-[var(--ink-3)]">
            {LAYOUT_HINT[layout]}, {capacityLabel}
          </span>
        </div>
      </Glass>

      <Glass className="p-4 sm:p-5 space-y-3">
        <h3 className="font-bold">Tema</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {orderedThemes.map((t, idx) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setThemeKey(t.key);
                if (!headline || themes.some((x) => x.headline === headline)) setHeadline(t.headline);
              }}
              aria-pressed={themeKey === t.key}
              className={cn(
                "group relative overflow-hidden rounded-2xl text-left ring-2 transition hover:-translate-y-0.5",
                themeKey === t.key ? "ring-[var(--ink)]" : "ring-transparent"
              )}
            >
              <span className="flex h-14 items-end px-3 pb-2" style={{ background: t.bg, color: t.text }}>
                <span className="font-display text-sm font-extrabold leading-tight">{t.headline}</span>
              </span>
              <span className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: t.cardBg }}>
                <span className="truncate text-xs font-medium text-[#1d2420]">{t.name}</span>
                <span className="rounded-md px-1.5 py-0.5 text-[11px] font-extrabold" style={{ background: t.tag, color: t.tagText }}>
                  R$ 9,99
                </span>
              </span>
              {idx < 2 && suggestedThemeKeys.includes(t.key) && t.key !== "ofertas" && (
                <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-[#1d2420]">sugerido</span>
              )}
            </button>
          ))}
        </div>
      </Glass>

      <Glass className="p-4 sm:p-5 space-y-4">
        <h3 className="font-bold">Textos e validade</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome do encarte" hint="Só para você achar depois" htmlFor="enc-nome">
            <Input id="enc-nome" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="Ofertas da semana 41" />
          </Field>
          <Field label="Título na arte" htmlFor="enc-titulo">
            <Input id="enc-titulo" value={headline} maxLength={80} onChange={(e) => setHeadline(e.target.value)} placeholder={theme?.headline} />
          </Field>
          <Field label="Frase de apoio" className="sm:col-span-2" htmlFor="enc-sub">
            <Input id="enc-sub" value={subheadline} maxLength={120} onChange={(e) => setSubheadline(e.target.value)} placeholder="Preço baixo de verdade, toda semana" />
          </Field>
          <Field label="Válido de" htmlFor="enc-de">
            <Input id="enc-de" type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
          </Field>
          <Field label="Até" htmlFor="enc-ate">
            <Input id="enc-ate" type="date" value={validUntil} min={validFrom || undefined} onChange={(e) => setValidUntil(e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={false} onClick={() => { setValidFrom(today); setValidUntil(today); }}>Só hoje</Chip>
          <Chip on={false} onClick={() => { setValidFrom(today); setValidUntil(addDays(today, 6)); }}>7 dias</Chip>
          <Chip on={false} onClick={() => { const s = nextWeekday(today, 6); setValidFrom(s); setValidUntil(addDays(s, 1)); }}>Fim de semana</Chip>
          <Chip on={false} onClick={() => { setValidFrom(""); setValidUntil(""); }}>Sem data</Chip>
        </div>
      </Glass>
    </div>
  );

  const previewPanel = (
    <div className="space-y-3">
      <div
        className="relative mx-auto w-full overflow-hidden rounded-[22px] ring-1 ring-[var(--line)] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.55)]"
        style={{ aspectRatio: `${f.width} / ${f.height}`, maxHeight: "72vh", maxWidth: `calc(72vh * ${f.width / f.height})`, background: theme?.cardBg }}
      >
        <AnimatePresence initial={false}>
          {previewUrl && (
            <motion.img
              key={previewUrl}
              src={previewUrl}
              alt="Prévia do encarte"
              className="absolute inset-0 h-full w-full object-cover"
              initial={reduce ? false : { opacity: 0, scale: 1.01, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, transition: { duration: 0.2, delay: 0.1 } }}
              transition={{ type: "spring", duration: 0.45, bounce: 0 }}
            />
          )}
        </AnimatePresence>
        {!previewUrl && !previewError && <div className="esqueleto absolute inset-0 rounded-none" />}
        {previewError && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <p className="text-sm text-[var(--ink-2)]">
              <ImageOff className="mx-auto mb-2 size-6" />
              {previewError}
            </p>
          </div>
        )}
        <AnimatePresence>
          {previewLoading && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="status"
              className="vidro-forte absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
            >
              <Loader2 className="size-3.5 animate-spin" /> Atualizando
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
          disabled={previewPage <= 1}
          className="vidro grid size-11 place-items-center rounded-full disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-sm tabular text-[var(--ink-2)]">
          Página {Math.min(previewPage, previewPages)} de {previewPages}
        </span>
        <button
          onClick={() => setPreviewPage((p) => Math.min(previewPages, p + 1))}
          disabled={previewPage >= previewPages}
          className="vidro grid size-11 place-items-center rounded-full disabled:opacity-40"
          aria-label="Próxima página"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-24 xl:pb-0">
      {/* abas no celular */}
      <div className="xl:hidden sticky top-[76px] lg:top-4 z-20">
        <Segmented
          label="Etapa"
          value={tab}
          onChange={setTab}
          className="w-full [&>button]:flex-1"
          options={[
            { value: "produtos", label: `Produtos${items.length ? ` (${items.length})` : ""}` },
            { value: "estilo", label: "Estilo" },
            { value: "previa", label: "Prévia" },
          ]}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="space-y-5">
          {/* no celular a aba escolhida entra com a mesma subida curta das telas */}
          <div key={`p-${tab === "produtos"}`} className={cn(tab !== "produtos" ? "hidden xl:block" : "surgir xl:animate-none")}>{productsPanel}</div>
          <div key={`e-${tab === "estilo"}`} className={cn(tab !== "estilo" ? "hidden xl:block" : "surgir xl:animate-none")}>{stylePanel}</div>
          <div className={cn("xl:hidden", tab !== "previa" ? "hidden" : "surgir")}>{previewPanel}</div>
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-8 space-y-4">
            {previewPanel}
            <Button size="lg" className="w-full" onClick={save} loading={saving}>
              {initial.id ? "Salvar alterações" : "Salvar encarte"}
            </Button>
          </div>
        </aside>
      </div>

      {/* barra de salvar no celular */}
      <div className="xl:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 px-4 lg:bottom-6 lg:left-[272px]">
        <div className="vidro-forte mx-auto flex max-w-md items-center gap-3 rounded-2xl p-2 pl-4">
          <span className="min-w-0 flex-1 truncate text-sm text-[var(--ink-2)]">
            {items.length} produto(s) · {previewPages} página(s)
          </span>
          <Button onClick={save} loading={saving}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "h-10 shrink-0 rounded-full px-3.5 text-[13px] font-medium ring-1 transition",
        on ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--glass-strong)] text-[var(--ink-2)] ring-[var(--line)] hover:text-[var(--ink)]"
      )}
    >
      {children}
    </button>
  );
}

function Thumb({ url, name }: { url: string | null; name: string }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--line)]">
      {url ? (
        <img src={url} alt="" loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="font-display text-lg font-extrabold text-[#9aa8a0]">{name.charAt(0).toUpperCase()}</span>
      )}
    </span>
  );
}

function MoneyInput({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  const [text, setText] = useState(money(value));
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--ink-3)]">R$</span>
      <input
        inputMode="decimal"
        className={cn(inputClass, "pl-9 tabular")}
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
        onBlur={() => setText(money(parseMoney(text)))}
      />
    </div>
  );
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function nextWeekday(iso: string, weekday: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  const diff = (weekday - d.getUTCDay() + 7) % 7;
  return addDays(iso, diff);
}
