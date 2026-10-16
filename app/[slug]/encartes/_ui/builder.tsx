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
  LayoutGrid,
  Rows3,
  Sparkle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Eye,
  TriangleAlert,
  Sparkles,
  Pencil,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PhotoEditor } from "@/app/[slug]/produtos/_ui/photo-editor";
import { FindPhotos } from "@/app/[slug]/produtos/_ui/find-photos";
import { Glass, Button, Segmented, Input, Field, PriceTag, cn, inputClass } from "@/components/ui";
import { capacidadeGrade, FORMATS } from "@/lib/encarte/formats";
import { resolverValidade, VALIDADE_PADRAO, type ValidadeOpcoes } from "@/lib/encarte/validade";
import { ValidadePicker } from "./validade-picker";
import { RodapePicker } from "./rodape-picker";
import { resolverRodape, type RodapeOpcoes } from "@/lib/encarte/rodape";
import { clampEscala, EMBLEMA_ESCALA_MAX, EMBLEMA_ESCALA_MIN, EMBLEMA_ESCALA_PASSO } from "@/lib/encarte/emblema-escala";
import { normalizarBusca, TEMAS_PRONTOS, VISUAIS_PRONTOS } from "@/lib/encarte/prontos";
import { CENARIOS, type CenarioGrupo } from "@/lib/encarte/modelos/cenarios";
import { FORMAT_HINT, ITEM_LABELS, LAYOUT_HINT, LAYOUT_SHORT, MODELO_LABELS, FUNDO_LABELS } from "@/lib/encarte/labels";
import { FUNDOS_ARTE } from "@/lib/encarte/modelos/fundos-arte";
import type { EncarteFormat, EncarteFundo, EncarteLayout, EncarteModelo } from "@/lib/encarte/types";
import { plural } from "@/lib/plural";
import { EMBLEMAS } from "@/lib/emblemas/catalog";
import { corDoGrupo, corDoTema } from "./cores-tema";
import { quandoFitsRange } from "@/lib/emblemas/quando";

const FUNDOS_BASE = ["raios", "bokeh", "diagonal", "aros", "kraft", "madeira", "estudio", "vinheta", "xadrez", "feira"] as EncarteFundo[];
const GRUPOS_CENARIO: CenarioGrupo[] = ["Palco", "Papel", "Cortinas", "Festas", "Departamentos"];

export type CatalogProduct = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  unit: string | null;
  image_url: string | null;
  image_status: string | null;
  image_candidates: string[] | null;
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
  modelo: EncarteModelo | null;
  emblema: string | null;
  emblemaEscala?: number;
  validade?: Partial<ValidadeOpcoes>;
  rodape?: Partial<RodapeOpcoes>;
  fundo: EncarteFundo | null;
  themeKey: string;
  validFrom: string;
  validUntil: string;
  items: BuilderItem[];
};

const PASSOS = [
  { key: "objetivo", nome: "Objetivo", curto: "Objetivo", pergunta: "Escolha o ponto de partida", agora: "Escolha uma combinação pronta ou só o logo da campanha, e diga onde vai usar. Tudo pode ser trocado depois." },
  { key: "fundo", nome: "Fundo", curto: "Fundo", pergunta: "Escolha o fundo", agora: "Toque no fundo que combina com a campanha. A prévia muda na hora." },
  { key: "caixas", nome: "Caixas", curto: "Caixas", pergunta: "Escolha as caixas dos produtos", agora: "Escolha o desenho das caixas onde cada produto vai aparecer. Cada página leva 12." },
  { key: "produtos", nome: "Produtos", curto: "Produtos", pergunta: "Escolha os produtos", agora: "Adicione os produtos da oferta e confira os preços. Precisa de pelo menos 1 para continuar." },
  { key: "textos", nome: "Título e datas", curto: "Textos", pergunta: "Título e validade", agora: "Escreva o título (se quiser, o logo já serve) e a validade da oferta." },
  { key: "revisar", nome: "Revisar", curto: "Revisar", pergunta: "Confira e salve", agora: "Veja a arte final. Se estiver certa, salve: depois você baixa em PNG ou PDF." },
] as const;
const P_PRODUTOS = 3;
const P_TEXTOS = 4;

const FORMATO_NOME: Record<EncarteFormat, string> = { feed: "Feed", story: "Story", quadrado: "Quadrado", a4: "A4" };
const FORMATO_PROP: Record<EncarteFormat, [number, number]> = { feed: [32, 40], story: [24, 42], quadrado: [36, 36], a4: [30, 42] };

const money = (n: number | null | undefined) => (n == null ? "" : n.toFixed(2).replace(".", ","));
const parseMoney = (s: string) => {
  const t = s.replace(/[^\d,.]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Escalas da prévia: a rápida chega primeiro, a nítida a substitui (o arquivo final sai no tamanho real).
const PREVIA_RAPIDA = 0.4;
const PREVIA_NITIDA = 0.8;
const PREVIA_FINAL = 1; // no último passo (revisar) a prévia já sai no tamanho real

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
  const [step, setStep] = useState(0);
  const [verPrevia, setVerPrevia] = useState(false);
  const [grupoEmblema, setGrupoEmblema] = useState("Para agora");
  const [temaPronto, setTemaPronto] = useState<string | null>(null);
  const [avisoPronto, setAvisoPronto] = useState<string | null>(null); // nome da combinação recém-escolhida
  const [destacarLogo, setDestacarLogo] = useState(false);
  const secaoLogoRef = useRef<HTMLDivElement | null>(null);
  const [buscaPronto, setBuscaPronto] = useState("");
  const [limitePronto, setLimitePronto] = useState(8);
  const [verTodosTemas, setVerTodosTemas] = useState(false);
  const [name, setName] = useState(initial.name);
  const [headline, setHeadline] = useState(initial.headline);
  const [subheadline, setSubheadline] = useState(initial.subheadline);
  const [format, setFormat] = useState<EncarteFormat>(initial.format);
  const [layout, setLayout] = useState<EncarteLayout>(initial.layout);
  const [modelo, setModelo] = useState<EncarteModelo | null>(initial.modelo);
  const [emblema, setEmblema] = useState<string | null>(initial.emblema);
  const [emblemaEscala, setEmblemaEscala] = useState<number>(clampEscala(initial.emblemaEscala));
  const [validade, setValidade] = useState<ValidadeOpcoes>(resolverValidade(initial.validade));
  const [rodape, setRodape] = useState<RodapeOpcoes>(resolverRodape(initial.rodape));
  const [fundo, setFundo] = useState<EncarteFundo | null>(initial.fundo);
  const [themeKey, setThemeKey] = useState(initial.themeKey);
  const [validFrom, setValidFrom] = useState(initial.validFrom);
  const [validUntil, setValidUntil] = useState(initial.validUntil);
  const [items, setItems] = useState<BuilderItem[]>(initial.items);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  // cópia local do catálogo: trocar a foto de um produto atualiza a lista e a prévia na hora
  const [cat, setCat] = useState<CatalogProduct[]>(catalog);
  const [catBase, setCatBase] = useState(catalog);
  if (catBase !== catalog) {
    setCatBase(catalog);
    setCat(catalog);
  }
  const byId = useMemo(() => new Map(cat.map((p) => [p.id, p])), [cat]);
  const selected = useMemo(() => new Set(items.map((i) => i.productId)), [items]);
  const theme = themes.find((t) => t.key === themeKey) ?? themes[0];

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of cat) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  }, [cat]);

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return cat
      .filter((p) => (!category || p.category === category) && (!q || norm(`${p.name} ${p.brand ?? ""} ${p.category ?? ""}`).includes(q)))
      .slice(0, 200);
  }, [cat, query, category]);

  // emblemas do período do encarte primeiro (pela data de início ou hoje)
  const emblemasOrdenados = useMemo(() => {
    const from = validFrom || new Date().toISOString().slice(0, 10);
    const hit = EMBLEMAS.filter((e) => !e.alternativa && quandoFitsRange(e.quando, from, 7));
    const rest = EMBLEMAS.filter((e) => !e.alternativa && !hit.includes(e)).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { hit, rest };
  }, [validFrom]);

  const orderedThemes = useMemo(() => {
    const rank = (k: string) => {
      const i = suggestedThemeKeys.indexOf(k);
      return i === -1 ? 999 : i;
    };
    return [...themes].sort((a, b) => rank(a.key) - rank(b.key));
  }, [themes, suggestedThemeKeys]);

  function patchProduct(id: string, change: Partial<CatalogProduct>) {
    setCat((prev) => prev.map((p) => (p.id === id ? { ...p, ...change } : p)));
  }
  const semFoto = (p: CatalogProduct | undefined) => !!p && !p.image_url && p.image_status !== "pendente";
  const naFila = (p: CatalogProduct | undefined) => !!p && !p.image_url && p.image_status === "pendente";
  const paraConfirmar = (p: CatalogProduct | undefined) => !!p && !!p.image_url && p.image_status === "revisar";
  const selecionadosSemFoto = items.filter((i) => semFoto(byId.get(i.productId))).length;
  const selecionadosConfirmar = items.filter((i) => paraConfirmar(byId.get(i.productId))).length;
  const selecionadosPendentes = items.filter((i) => byId.get(i.productId)?.image_status === "pendente").length;

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
      modelo,
      emblema,
      emblemaEscala,
      validade,
      rodape,
      fundo,
      themeKey,
      validFrom: validFrom || null,
      validUntil: validUntil || null,
      // nos dois primeiros passos a prévia é só o esqueleto das 12 caixas
      esqueleto: step <= 1,
      items: (step <= 1 ? [] : items)
        .map((i) => {
          const p = byId.get(i.productId);
          const price = i.promoPrice ?? p?.price ?? null;
          if (!p || price == null) return null;
          const old = i.oldPrice ?? (p.price != null && p.price > price ? p.price : null);
          return {
            name: p.name,
            brand: p.brand,
            unit: p.unit,
            // achou foto mas ainda não confirmou: usa a primeira sugestão de cara, nunca em branco
            imageUrl: p.image_url ?? p.image_candidates?.[0] ?? null,
            price,
            oldPrice: old,
            highlight: i.highlight,
            limitQty: i.limitQty,
            label: i.label,
          };
        })
        .filter(Boolean),
    }),
    [name, headline, subheadline, format, layout, modelo, emblema, emblemaEscala, validade, rodape, fundo, themeKey, validFrom, validUntil, items, byId, step]
  );
  const previewKey = JSON.stringify(previewData);

  // Prévias já vistas ficam guardadas: voltar para uma opção anterior é instantâneo.
  const cacheRef = useRef(new Map<string, { url: string; pages: number }>());

  const loadPreview = useCallback(
    async (page: number) => {
      const revisando = step === PASSOS.length - 1;
      const ckey = `${page}|${previewKey}|${revisando ? "f" : "n"}`;
      const hit = cacheRef.current.get(ckey);
      if (hit) {
        abortRef.current?.abort();
        setPreviewLoading(false);
        setPreviewError(null);
        setPreviewUrl(hit.url);
        setPreviewPages(hit.pages);
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPreviewLoading(true);
      setPreviewError(null);
      // Primeiro uma versão pequena (quase instantânea), depois a nítida no lugar dela.
      const pedir = async (escala: number) =>
        fetch("/api/encartes/previa", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ marketId, data: JSON.parse(previewKey), pagina: page, escala }),
          signal: ctrl.signal,
        });
      const guardar = async (res: Response) => {
        const pages = Number(res.headers.get("x-encarte-paginas") || "1");
        const url = URL.createObjectURL(await res.blob());
        const cache = cacheRef.current;
        const antigo = cache.get(ckey);
        cache.set(ckey, { url, pages });
        // guarda as 14 mais recentes; as antigas liberam memória
        while (cache.size > 14) {
          const first = cache.keys().next().value as string;
          const old = cache.get(first);
          cache.delete(first);
          if (old && old.url !== url) setTimeout(() => URL.revokeObjectURL(old.url), 2000);
        }
        if (antigo && antigo.url !== url) setTimeout(() => URL.revokeObjectURL(antigo.url), 2000);
        lastUrl.current = url;
        setPreviewUrl(url);
        setPreviewPages(pages);
      };
      try {
        const res = await pedir(PREVIA_RAPIDA);
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 404 && page > 1) {
            setPreviewPage(1);
            return;
          }
          setPreviewError(data.error || "Não consegui desenhar a prévia.");
          return;
        }
        await guardar(res);
        if (abortRef.current === ctrl) setPreviewLoading(false);
        // versão nítida: só depois que a pessoa parou de mexer
        const fina = await pedir(revisando ? PREVIA_FINAL : PREVIA_NITIDA);
        if (fina.ok) await guardar(fina);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setPreviewError("Sem conexão para gerar a prévia.");
      } finally {
        if (abortRef.current === ctrl) setPreviewLoading(false);
      }
    },
    [marketId, previewKey, step]
  );

  useEffect(() => {
    const t = setTimeout(() => loadPreview(previewPage), 120);
    return () => clearTimeout(t);
  }, [loadPreview, previewPage]);

  // ------------------------------ salvar ------------------------------
  async function save() {
    if (!name.trim()) {
      toast.error("Dê um nome para o encarte.");
      setStep(P_TEXTOS);
      return;
    }
    if (items.length === 0) {
      toast.error("Escolha pelo menos um produto.");
      setStep(P_PRODUTOS);
      return;
    }
    const semPreco = items.filter((i) => (i.promoPrice ?? byId.get(i.productId)?.price) == null);
    if (semPreco.length) {
      toast.error(`${plural(semPreco.length, "produto", "produtos")} sem preço. Informe o preço de oferta.`);
      setStep(P_PRODUTOS);
      setEditing(semPreco[0].productId);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(initial.id ? `/api/encartes/${initial.id}` : "/api/encartes", {
        method: initial.id ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, name, headline, subheadline, format, layout, modelo, emblema, emblemaEscala, validade, rodape, fundo, themeKey, validFrom, validUntil, items }),
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
  const capacity = modelo && layout === "grade" ? capacidadeGrade(format, true) : f.capacity[layout];
  const capacityLabel = layout === "destaque" ? `1 grande + ${capacity.perPage - 1} por página` : `${capacity.perPage} por página`;

  // ------------------------------- partes -----------------------------
  const productsPanel = (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ink-2)]">
        Cada página leva {capacity.perPage} produtos. {items.length === 0 ? "Escolha os que entram." : `Você escolheu ${plural(items.length, "produto", "produtos")}, ${plural(Math.max(1, Math.ceil(items.length / capacity.perPage)), "página", "páginas")}.`}
      </p>
      <Glass className="p-4 sm:p-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--ink-3)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${cat.length} produtos`}
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
                    <span className="block truncate text-xs text-[var(--ink-3)]">
                      {semFoto(p) ? <span className="font-semibold text-[#b45309]">Sem foto · </span> : naFila(p) ? <span className="font-semibold text-[var(--ink-2)]">Buscando foto · </span> : null}
                      {[p.brand, p.category].filter(Boolean).join(" · ") || "sem categoria"}
                    </span>
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
          <>
            <p className="mt-1 text-sm text-[var(--ink-2)]">Toque em Editar para trocar a foto, o preço e o selo de cada produto. Arraste pelo ícone da esquerda para mudar a ordem.</p>
            {(selecionadosSemFoto > 0 || selecionadosConfirmar > 0) && (
              <div className="mt-3 rounded-2xl bg-[#fff4dc] p-3 text-sm text-[#7a4a05] ring-1 ring-[#f0d9a8]">
                <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4" aria-hidden /> Fotos para resolver</p>
                <p className="mt-1">
                  {selecionadosSemFoto > 0 ? `${plural(selecionadosSemFoto, "produto está sem foto", "produtos estão sem foto")} (a arte usa um desenho do tipo do produto). ` : ""}
                  {selecionadosConfirmar > 0 ? `${plural(selecionadosConfirmar, "foto é um palpite", "fotos são palpites")} da busca: confira se é o produto certo. ` : ""}
                  Toque em Editar no produto para enviar uma foto, colar um link ou escolher entre as opções.
                </p>
              </div>
            )}
            {selecionadosPendentes > 0 && <div className="mt-3"><FindPhotos marketId={marketId} pending={selecionadosPendentes} /></div>}
          </>
        )}
        {items.length > 0 && (
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
                    <button type="button" onClick={() => setEditing(open ? null : it.productId)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
                      <span className="block truncate text-[15px] font-medium">{p.name}</span>
                      <span className="block truncate text-xs text-[var(--ink-3)]">
                        {semFoto(p) ? <span className="font-semibold text-[#b45309]">Sem foto · </span> : naFila(p) ? <span className="font-semibold text-[var(--ink-2)]">Buscando foto · </span> : paraConfirmar(p) ? <span className="font-semibold text-[#b45309]">Confira a foto · </span> : null}
                        {it.oldPrice ? `de R$ ${money(it.oldPrice)} · ` : ""}
                        {it.label ?? ""}
                        {it.limitQty ? ` · limite ${it.limitQty}` : ""}
                      </span>
                    </button>
                    {price == null ? <span className="text-xs font-medium text-[var(--perigo)]">sem preço</span> : <PriceTag value={price} unit={p.unit} size="sm" />}
                    <button
                      type="button"
                      onClick={() => setEditing(open ? null : it.productId)}
                      aria-pressed={open}
                      className={cn("flex h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold ring-1 transition", open ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--glass-strong)] ring-[var(--line)] hover:bg-[var(--line)]")}
                    >
                      <Pencil className="size-4" aria-hidden /> <span className="hidden sm:inline">{open ? "Fechar" : "Editar"}</span>
                    </button>
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
                        <div className="space-y-2 border-t border-[var(--line)] p-3">
                          <h4 className="text-sm font-semibold">Foto do produto</h4>
                          <PhotoEditor
                            compact
                            product={{ id: p.id, name: p.name, image_url: p.image_url, image_status: p.image_status, image_candidates: p.image_candidates }}
                            onChange={(patchP) => patchProduct(p.id, patchP)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3 border-t border-[var(--line)] p-3 sm:grid-cols-4">
                          <h4 className="col-span-full text-sm font-semibold">Preço e selo nesta oferta</h4>
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

  // ------------------------------- avisos ------------------------------
  const avisos = useMemo(() => {
    const out: string[] = [];
    const ativos = items.map((i) => ({ i, p: byId.get(i.productId) })).filter((x) => x.p);
    const semFoto = ativos.filter((x) => !x.p!.image_url).length;
    const semPreco = ativos.filter((x) => (x.i.promoPrice ?? x.p!.price) == null).length;
    const longos = ativos.filter((x) => x.p!.name.length > 38).length;
    if (semPreco) out.push(`${plural(semPreco, "produto está", "produtos estão")} sem preço. Abra em "Produtos" e informe o preço de oferta.`);
    if (semFoto) out.push(`${plural(semFoto, "produto está", "produtos estão")} sem foto. A arte mostra a inicial do nome no lugar.`);
    if (longos) out.push(`${plural(longos, "nome é longo", "nomes são longos")} e vão ficar pequenos na arte. Encurte o nome no cadastro para ler melhor.`);
    if (!headline.trim() && !emblema) out.push("A arte está sem título. Escolha um emblema ou escreva um título.");
    return out;
  }, [items, byId, headline, emblema]);


  // Logos agrupados: "Para agora" traz os do período do encarte; depois as pastas do catálogo.
  const gruposEmblema = useMemo(() => {
    const nomes: string[] = [];
    for (const e of EMBLEMAS) if (!e.alternativa && !nomes.includes(e.grupo)) nomes.push(e.grupo);
    return ["Para agora", ...nomes];
  }, []);
  const emblemasDoGrupo = useMemo(() => {
    if (grupoEmblema === "Para agora") return [...emblemasOrdenados.hit, ...emblemasOrdenados.rest.filter((e) => e.grupo === "Campanhas recorrentes")];
    return EMBLEMAS.filter((e) => !e.alternativa && e.grupo === grupoEmblema);
  }, [grupoEmblema, emblemasOrdenados]);

  function escolherEmblema(slug: string) {
    setAvisoPronto(null);
    setEmblema(slug);
    setEmblemaEscala(1);
    const e = EMBLEMAS.find((x) => x.slug === slug);
    const tema = e?.temas.find((k) => themes.some((t) => t.key === k));
    if (tema) setThemeKey(tema);
    setPreviewPage(1);
  }

  function irParaProdutos() {
    setAvisoPronto(null);
    setStep(P_PRODUTOS);
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  function irParaLogo() {
    secaoLogoRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setDestacarLogo(true);
    setTimeout(() => setDestacarLogo(false), 2200);
  }

  function aplicarPronto(v: (typeof VISUAIS_PRONTOS)[number]) {
    setModelo(v.modelo);
    setLayout("grade");
    setFundo(v.fundo);
    setEmblema(v.emblema);
    setEmblemaEscala(1);
    if (themes.some((t) => t.key === v.themeKey)) setThemeKey(v.themeKey);
    setPreviewPage(1);
    setAvisoPronto(v.nome);
    // a miniatura da combinação (já carregada) aparece na hora no feed, enquanto a prévia real é desenhada
    if (format === "feed") {
      setPreviewUrl(`/miniaturas/pronto-${v.slug}.webp`);
      setPreviewLoading(true);
    }
  }

  const podeAvancar = step !== P_PRODUTOS || items.length > 0;
  function avancar() {
    if (step === P_PRODUTOS && items.length === 0) {
      toast.error("Escolha pelo menos um produto para continuar.");
      return;
    }
    setStep((s) => Math.min(PASSOS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function voltar() {
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const miniaturaClass = (on: boolean) =>
    cn("group relative overflow-hidden rounded-2xl text-left ring-2 transition active:scale-[0.98]", on ? "ring-[var(--ink)]" : "ring-[var(--line)] hover:ring-[var(--line-strong)]");

  // ------------------------------ passo 2: onde vai ------------------------------
  const destinoGrid = (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["feed", "story", "quadrado", "a4"] as const).map((key) => {
          const [pw, ph] = FORMATO_PROP[key];
          const on = format === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFormat(key);
                setPreviewPage(1);
              }}
              aria-pressed={on}
              className={cn("flex flex-col items-center gap-3 rounded-2xl p-4 text-center ring-2 transition active:scale-[0.98]", on ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--glass-strong)] ring-[var(--line)] hover:-translate-y-0.5")}
            >
              <span className="grid h-[52px] place-items-center">
                <span className={cn("block rounded-[5px] border-2", on ? "border-[var(--bg)] bg-white/15" : "border-[var(--ink-3)] bg-[var(--line)]")} style={{ width: pw, height: ph }} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{FORMATO_NOME[key]}</span>
                <span className={cn("block text-xs", on ? "opacity-75" : "text-[var(--ink-3)]")}>{FORMAT_HINT[key]}</span>
              </span>
            </button>
          );
        })}
      </div>
  );

  // ------------------------------ passo 3: visual ------------------------------
  const caixaIds = (Object.keys(MODELO_LABELS) as EncarteModelo[]).filter((k) => k.startsWith("cx"));
  const miniEstilo = (key: EncarteModelo | null, rotulo: string) => {
    const on = modelo === key;
    return (
      <button
        key={key ?? "classico"}
        type="button"
        aria-pressed={on}
        onClick={() => {
          setModelo(key);
          if (key) setLayout("grade");
          setPreviewPage(1);
        }}
        className={miniaturaClass(on)}
      >
        <img src={`/miniaturas/estilo-${key ?? "classico"}.webp`} alt="" width={440} height={330} loading="lazy" decoding="async" className="aspect-[4/3] w-full bg-[var(--line)] object-cover" />
        <span className={cn("block truncate px-2 py-1.5 text-xs font-semibold", on ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--glass-strong)]")}>{rotulo}</span>
        {on && <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[var(--ink)] text-[var(--bg)]"><Check className="size-3.5" strokeWidth={3} /></span>}
      </button>
    );
  };
  const miniFundo = (f: EncarteFundo | null, rotulo: string) => {
    const on = fundo === f;
    return (
      <button key={f ?? "padrao"} type="button" aria-pressed={on} onClick={() => setFundo(f)} className={cn(miniaturaClass(on), "w-[124px] shrink-0")}>
        {f ? (
          <img src={`/miniaturas/fundo-${f}.webp`} alt="" width={440} height={330} loading="lazy" decoding="async" className="aspect-[4/3] w-full bg-[var(--line)] object-cover" />
        ) : (
          <span className="grid aspect-[4/3] w-full place-items-center bg-[var(--line)] text-xs font-semibold text-[var(--ink-3)]">Do estilo</span>
        )}
        <span className={cn("block truncate px-1.5 py-1 text-[11px] font-semibold", on ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--glass-strong)]")}>{rotulo}</span>
      </button>
    );
  };

  const prontosFiltrados = useMemo(() => {
    const q = normalizarBusca(buscaPronto.trim());
    let lista = VISUAIS_PRONTOS;
    if (temaPronto) lista = lista.filter((v) => v.tema === temaPronto);
    if (q) {
      const palavras = q.split(/\s+/);
      return lista.filter((v) => palavras.every((w) => v.busca.includes(w)));
    }
    // sem filtro: uma de cada tema primeiro, para mostrar a variedade
    return temaPronto ? lista : [...lista.filter((v) => v.slug.endsWith("-1")), ...lista.filter((v) => !v.slug.endsWith("-1"))];
  }, [temaPronto, buscaPronto]);

  const temaCor = useMemo(() => new Map(TEMAS_PRONTOS.map((t, i) => [t.id, { nome: t.nome, cor: corDoTema(t.id, i) }])), []);
  const temasVisiveis = verTodosTemas ? TEMAS_PRONTOS : TEMAS_PRONTOS.slice(0, 8);

  const prontosPanel = (
    <Glass className="space-y-6 p-5 sm:p-7">
      <div className="flex items-start gap-3.5">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--folha-soft)] text-[var(--folha)]">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h3 className="text-lg font-bold leading-tight">Combinações prontas</h3>
          <p className="text-sm leading-relaxed text-[var(--ink-2)]">Tema, logo, fundo e caixas já combinados, com 12 produtos de exemplo. Escolha uma e troque o que quiser depois.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--ink-3)]" aria-hidden />
          <Input
            value={buscaPronto}
            onChange={(e) => {
              setBuscaPronto(e.target.value);
              setLimitePronto(8);
            }}
            placeholder="Buscar: carne, natal, sábado, bebidas..."
            className="pl-10"
            aria-label="Buscar combinação pronta"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip
            on={!temaPronto}
            onClick={() => {
              setTemaPronto(null);
              setLimitePronto(8);
            }}
          >
            Todos
          </Chip>
          {temasVisiveis.map((t) => {
            const cor = temaCor.get(t.id)!.cor;
            const on = temaPronto === t.id;
            return (
              <Chip
                key={t.id}
                on={on}
                cor={cor}
                onClick={() => {
                  setTemaPronto(on ? null : t.id);
                  setLimitePronto(8);
                }}
              >
                {t.nome}
              </Chip>
            );
          })}
          <button type="button" onClick={() => setVerTodosTemas((v) => !v)} className="h-10 rounded-full px-3 text-[13px] font-medium text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline">
            {verTodosTemas ? "Menos temas" : `Mais ${TEMAS_PRONTOS.length - 8} temas`}
          </button>
        </div>
      </div>

      {prontosFiltrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--ink-3)]">Nenhuma combinação com esse tema. Tente carne, natal, sábado, hortifruti ou bebidas.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-3)]">
            <span className="font-semibold text-[var(--ink-2)]">{plural(prontosFiltrados.length, "combinação", "combinações")}</span> · os produtos das miniaturas são só exemplo
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {prontosFiltrados.slice(0, limitePronto).map((v) => {
              const on = modelo === v.modelo && fundo === v.fundo && emblema === v.emblema;
              const tema = temaCor.get(v.tema);
              return (
                <button key={v.slug} type="button" aria-pressed={on} onClick={() => aplicarPronto(v)} className={miniaturaClass(on)}>
                  <img src={`/miniaturas/pronto-${v.slug}.webp`} alt="" width={480} height={600} loading="lazy" decoding="async" className="aspect-[4/5] w-full bg-[var(--line)] object-cover" />
                  <span className="absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm" style={{ background: tema?.cor ?? "var(--ink)" }}>
                    Combinação
                  </span>
                  <span className={cn("block space-y-0.5 px-3 py-2.5 text-left", on ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--glass-strong)]")}>
                    <span className="block truncate text-[13px] font-semibold">{v.nome}</span>
                    <span className={cn("flex items-center gap-1.5 truncate text-[11px]", on ? "opacity-75" : "text-[var(--ink-3)]")}>
                      <span className="size-2 shrink-0 rounded-full" style={{ background: tema?.cor }} aria-hidden />
                      <span className="truncate">{tema?.nome} · {v.fundoNome}</span>
                    </span>
                  </span>
                  {on && <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-[var(--ink)] text-[var(--bg)]"><Check className="size-4" strokeWidth={3} /></span>}
                </button>
              );
            })}
          </div>
          {prontosFiltrados.length > limitePronto && (
            <Button variant="vidro" onClick={() => setLimitePronto((n) => n + 12)} className="w-full">
              Ver mais {prontosFiltrados.length - limitePronto} combinações
            </Button>
          )}
        </div>
      )}
      <AnimatePresence>
        {avisoPronto && (
          <motion.div
            key="aviso-pronto"
            role="status"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="vidro-forte sticky bottom-44 z-10 space-y-2.5 rounded-2xl p-3 shadow-lg xl:bottom-4"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[var(--folha)] text-white"><Check className="size-3.5" strokeWidth={3.5} /></span>
              <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">{avisoPronto}</span> escolhida. Fundo, caixas e logo já vieram prontos. O que você quer fazer agora?</p>
              <button type="button" onClick={() => setAvisoPronto(null)} aria-label="Fechar aviso" className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--ink-3)] hover:bg-[var(--line)]"><X className="size-4" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={irParaProdutos}>
                Já está bom, escolher os produtos <ChevronRight className="size-4" />
              </Button>
              <Button variant="vidro" onClick={irParaLogo}>
                Trocar o logo <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
              </Button>
              <Button variant="fantasma" onClick={avancar}>
                Ajustar fundo e caixas
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Glass>
  );

  const objetivoPanel = (
    <div className="space-y-5">
      {prontosPanel}
      <div ref={secaoLogoRef} className="scroll-mt-28">
      <Glass className={cn("space-y-5 p-5 sm:p-6 transition-shadow duration-500", destacarLogo && "ring-2 ring-[var(--folha)] shadow-[0_0_0_6px_var(--folha-soft)]")}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ background: corDoGrupo(grupoEmblema, gruposEmblema.indexOf(grupoEmblema)) }} aria-hidden>
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="font-bold leading-tight">Ou troque só o logo da campanha</h3>
            <p className="text-sm leading-relaxed text-[var(--ink-2)]">Escolha a campanha. O logo dela vira o título da arte e pinta o fundo e as etiquetas com as cores dele.</p>
          </div>
        </div>
        <div className="rolagem -mx-1 flex gap-2.5 overflow-x-auto px-1 py-1.5">
          {gruposEmblema.map((g, i) => (
            <Chip key={g} on={grupoEmblema === g} cor={corDoGrupo(g, i)} onClick={() => setGrupoEmblema(g)}>
              {g}
            </Chip>
          ))}
        </div>
        <div className="grid max-h-[28rem] grid-cols-2 gap-3.5 overflow-y-auto p-1 pr-2 sm:grid-cols-3">
          {emblemasDoGrupo.map((e, idx) => {
            const on = emblema === e.slug;
            const corG = corDoGrupo(grupoEmblema, gruposEmblema.indexOf(grupoEmblema));
            return (
              <button
                key={e.slug}
                type="button"
                aria-pressed={on}
                onClick={() => escolherEmblema(e.slug)}
                style={on ? { boxShadow: `0 0 0 2px ${corG}` } : undefined}
                className={cn("relative overflow-hidden rounded-2xl text-left ring-1 transition active:scale-[0.98]", on ? "ring-transparent" : "ring-[var(--line)] hover:-translate-y-0.5 hover:ring-[var(--line-strong)]")}
              >
                <span className="grid aspect-[4/3] w-full place-items-center p-3" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${corG} 6%, #fff), color-mix(in srgb, ${corG} 22%, #fff))` }}>
                  <img src={`/emblemas/t/${e.slug}.webp`} alt="" loading={idx < 9 ? "eager" : "lazy"} decoding="async" className="max-h-full max-w-full object-contain" />
                </span>
                <span className={cn("flex items-center justify-between gap-1.5 px-3 py-2 text-xs font-semibold", on ? "text-white" : "bg-[var(--glass-strong)]")} style={on ? { background: corG } : undefined}>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {on ? null : <span className="size-2 shrink-0 rounded-full" style={{ background: corG }} aria-hidden />}
                    <span className="truncate">{e.nome}</span>
                  </span>
                  {on && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
                </span>
                {emblemasOrdenados.hit.includes(e) ? <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-semibold text-[var(--bg)]">Agora</span> : null}
              </button>
            );
          })}
        </div>
        {emblema ? (
          <button type="button" onClick={() => setEmblema(null)} className="text-sm font-medium text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline">
            Tirar o logo e usar só o título
          </button>
        ) : null}
      </Glass>
      </div>

      <Glass className="p-4 sm:p-5 space-y-3">
        <div>
          <h3 className="font-bold">Onde vai usar</h3>
          <p className="text-sm text-[var(--ink-2)]">O tamanho muda conforme o uso. Cada página leva 12 produtos.</p>
        </div>
        {destinoGrid}
      </Glass>
    </div>
  );

  const fundoPanel = (
    <div className="space-y-5">
      <p className="text-sm text-[var(--ink-2)]">A prévia mostra onde cada uma das 12 caixas vai ficar. Os produtos entram nos próximos passos.</p>
        <Glass className="p-4 sm:p-5">
          <details open>
          <summary className="cursor-pointer font-bold">Fundo <span className="text-sm font-normal text-[var(--ink-3)]">({fundo ? FUNDO_LABELS[fundo].replace(/^\w{2}\d{2} /, "") : "segue as cores do logo"})</span></summary>
          <div className="mt-3 space-y-3">
            {[{ grupo: "Cabeçalhos temáticos", ids: FUNDOS_ARTE.filter((a) => !a.grupo).map((a) => a.id as EncarteFundo) }, { grupo: "Semanas e festivais", ids: FUNDOS_ARTE.filter((a) => a.grupo === "Semanas e festivais").map((a) => a.id as EncarteFundo) }, { grupo: "Efeitos", ids: [null, ...FUNDOS_BASE] as (EncarteFundo | null)[] }, ...GRUPOS_CENARIO.map((g) => ({ grupo: g, ids: CENARIOS.filter((c) => c.grupo === g).map((c) => c.id as EncarteFundo) }))].map(({ grupo, ids }) => (
              <div key={grupo} className="space-y-1.5">
                <p className="text-xs font-semibold text-[var(--ink-3)]">{grupo}</p>
                <div className="rolagem -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">{ids.map((f) => miniFundo(f, f ? FUNDO_LABELS[f].replace(/^\w{2}\d{2} /, "") : "Do estilo"))}</div>
              </div>
            ))}
          </div>
          </details>
        </Glass>
      {!emblema && (
      <Glass className="p-4 sm:p-5">
        <details>
          <summary className="cursor-pointer font-bold">Cores do tema <span className="text-sm font-normal text-[var(--ink-3)]">(opcional)</span></summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {orderedThemes.map((t, idx) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setThemeKey(t.key);
                  if (!headline || themes.some((x) => x.headline === headline)) setHeadline(t.headline);
                }}
                aria-pressed={themeKey === t.key}
                className={cn("group relative overflow-hidden rounded-2xl text-left ring-2 transition hover:-translate-y-0.5", themeKey === t.key ? "ring-[var(--ink)]" : "ring-transparent")}
              >
                <span className="flex h-14 items-end px-3 pb-2" style={{ background: t.bg, color: t.text }}>
                  <span className="font-display text-sm font-extrabold leading-tight">{t.headline}</span>
                </span>
                <span className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: t.cardBg }}>
                  <span className="truncate text-xs font-medium text-[#1d2420]">{t.name}</span>
                  <span className="rounded-md px-1.5 py-0.5 text-[11px] font-extrabold" style={{ background: t.tag, color: t.tagText }}>R$ 9,99</span>
                </span>
                {idx < 2 && suggestedThemeKeys.includes(t.key) && t.key !== "ofertas" && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-[#1d2420]">sugerido</span>
                )}
              </button>
            ))}
          </div>
        </details>
      </Glass>
      )}
    </div>
  );

  const caixasPanel = (
    <div className="space-y-5">
      <Glass className="p-4 sm:p-5 space-y-3">
        <h3 className="font-bold">Estilo dos produtos</h3>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {miniEstilo(null, "Clássico")}
          {caixaIds.map((k) => miniEstilo(k, MODELO_LABELS[k].label.slice(3)))}
        </div>
        {modelo ? <p className="text-sm text-[var(--ink-3)]">{capacityLabel}</p> : null}
        <div className={cn("flex flex-wrap items-center gap-3", modelo && "hidden")}>
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

    </div>
  );

  // ------------------------------ passo 4: textos ------------------------------
  // validade: posição, estilo, cor, texto e datas (ao lado da prévia nos passos 3 a 5; no celular também no passo de textos)
  const validadeControles = (
    <ValidadePicker valor={validade} onChange={setValidade} de={validFrom} ate={validUntil} onDe={setValidFrom} onAte={setValidUntil} />
  );

  const textosPanel = (
    <Glass className="p-4 sm:p-5 space-y-4">
      <div className="xl:hidden">{validadeControles}</div>
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
      <RodapePicker valor={rodape} onChange={setRodape} endereco="" />
    </Glass>
  );

  // ------------------------------ passo 5: revisar ------------------------------
  const estiloNome = modelo ? MODELO_LABELS[modelo].label.replace(/^\d+ /, "") : "Clássico";
  const resumo: [string, string, number][] = [
    ["Produtos", plural(items.length, "produto", "produtos"), P_PRODUTOS],
    ["Formato", `${FORMATO_NOME[format]}, ${plural(previewPages, "página", "páginas")}`, 0],
    ["Estilo das caixas", estiloNome, 2],
    ["Título", headline.trim() || (emblema ? "Do emblema" : "Sem título"), P_TEXTOS],
    ["Validade", validFrom && validUntil ? `${validFrom.split("-").reverse().join("/")} a ${validUntil.split("-").reverse().join("/")}` : "Sem data", P_TEXTOS],
  ];
  const revisarPanel = (
    <div className="space-y-4">
      {avisos.length > 0 ? (
        <Glass className="p-4 sm:p-5 space-y-2">
          <h3 className="flex items-center gap-2 font-bold"><TriangleAlert className="size-4 text-[#b45309]" aria-hidden /> Para ajustar antes de salvar</h3>
          <ul className="space-y-1.5 text-sm text-[var(--ink-2)]">
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Glass>
      ) : (
        <Glass className="p-4 sm:p-5">
          <p className="flex items-center gap-2 text-sm font-medium"><Check className="size-4 text-[var(--folha)]" strokeWidth={3} aria-hidden /> Nada pendente. Confira a prévia e salve.</p>
        </Glass>
      )}
      <Glass className="p-4 sm:p-5">
        <h3 className="mb-2 font-bold">Resumo</h3>
        <dl className="divide-y divide-[var(--line)]">
          {resumo.map(([k, v, to]) => (
            <div key={k} className="flex items-center justify-between gap-3 py-2 text-sm">
              <dt className="text-[var(--ink-3)]">{k}</dt>
              <dd className="flex items-center gap-3 font-medium">
                {v}
                <button type="button" onClick={() => setStep(to)} className="text-xs font-semibold text-[var(--folha)] underline-offset-2 hover:underline">Alterar</button>
              </dd>
            </div>
          ))}
        </dl>
      </Glass>
    </div>
  );

  const passoPanels = [objetivoPanel, fundoPanel, caixasPanel, productsPanel, textosPanel, revisarPanel];

  // tamanho do logo: fica ao lado da prévia, ajustável do passo 1 ao 3 (objetivo, fundo e caixas)
  const tamanhoLogo =
    emblema && step <= 2 ? (
      <div className="flex items-center gap-1.5 rounded-xl bg-[var(--glass-strong)] px-2.5 py-1.5 ring-1 ring-[var(--line)]">
        <span className="shrink-0 text-xs font-semibold">Logo</span>
        <button type="button" aria-label="Diminuir o logo" onClick={() => setEmblemaEscala((v) => clampEscala(v - EMBLEMA_ESCALA_PASSO))} disabled={emblemaEscala <= EMBLEMA_ESCALA_MIN} className="grid size-9 shrink-0 place-items-center rounded-lg transition hover:bg-[var(--line)] active:scale-95 disabled:opacity-40">
          <Minus className="size-3.5" aria-hidden />
        </button>
        <input
          type="range"
          aria-label="Tamanho do logo"
          min={EMBLEMA_ESCALA_MIN}
          max={EMBLEMA_ESCALA_MAX}
          step={EMBLEMA_ESCALA_PASSO}
          value={emblemaEscala}
          onChange={(e) => setEmblemaEscala(clampEscala(Number(e.target.value)))}
          className="h-9 min-w-0 flex-1 accent-[var(--ink)]"
          aria-valuetext={`${Math.round(emblemaEscala * 100)}%`}
        />
        <button type="button" aria-label="Aumentar o logo" onClick={() => setEmblemaEscala((v) => clampEscala(v + EMBLEMA_ESCALA_PASSO))} disabled={emblemaEscala >= EMBLEMA_ESCALA_MAX} className="grid size-9 shrink-0 place-items-center rounded-lg transition hover:bg-[var(--line)] active:scale-95 disabled:opacity-40">
          <Plus className="size-3.5" aria-hidden />
        </button>
        <button type="button" onClick={() => setEmblemaEscala(1)} disabled={emblemaEscala === 1} title="Voltar ao tamanho automático" className="w-10 shrink-0 text-right text-xs tabular-nums text-[var(--ink-2)] enabled:underline enabled:underline-offset-2 enabled:hover:text-[var(--ink)]">
          {Math.round(emblemaEscala * 100)}%
        </button>
      </div>
    ) : null;

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
      {previewUrl && !previewError && (step <= 1 || (step === 2 && items.length === 0)) && (
        <p className="text-center text-xs text-[var(--ink-3)]">
          {step <= 1 ? "As 12 caixas tracejadas são onde os produtos vão ficar." : "Exemplo com produtos de mentira. Você escolhe os seus no próximo passo."}
        </p>
      )}
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
      {tamanhoLogo}
      {step <= P_TEXTOS ? validadeControles : null}
    </div>
  );


  const ultimo = step === PASSOS.length - 1;
  const navegacao = (
    <div className="flex items-center justify-between gap-3">
      <Button variant="fantasma" onClick={voltar} disabled={step === 0} className={cn(step === 0 && "invisible")}>
        <ArrowLeft className="size-4" /> Voltar
      </Button>
      {ultimo ? (
        <Button size="lg" onClick={save} loading={saving}>
          {initial.id ? "Salvar alterações" : "Salvar encarte"}
        </Button>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            {step < P_PRODUTOS && (
              <Button variant="vidro" size="lg" onClick={irParaProdutos}>
                Pular para os produtos
              </Button>
            )}
            <Button size="lg" onClick={avancar} disabled={!podeAvancar}>
              Próximo: {PASSOS[step + 1].nome} <ChevronRight className="size-4" />
            </Button>
          </div>
          {!podeAvancar && <span className="text-xs text-[var(--ink-3)]">Escolha pelo menos 1 produto.</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 pb-36 xl:pb-0">
      {/* trilha de passos: é uma sequência de verdade, então vai numerada, com o nome sempre à vista */}
      <nav aria-label="Passos do encarte" className="sticky top-[76px] lg:top-4 z-20">
        <ol className="vidro-forte flex items-start rounded-2xl px-2 py-2.5">
          {PASSOS.map((p, i) => {
            const atual = i === step;
            const feito = i < step;
            return (
              <li key={p.key} className="relative min-w-0 flex-1">
                {i > 0 && <span aria-hidden className={cn("absolute right-1/2 top-[20px] h-0.5 w-full -translate-y-1/2 rounded-full transition-colors", i <= step ? "bg-[var(--folha)]" : "bg-[var(--line-strong)]")} />}
                <button
                  type="button"
                  onClick={() => (i > P_PRODUTOS && items.length === 0 ? toast.error("Escolha pelo menos um produto primeiro.") : setStep(i))}
                  aria-current={atual ? "step" : undefined}
                  aria-label={`Passo ${i + 1}: ${p.nome}${feito ? " (feito)" : ""}`}
                  className="group relative flex w-full flex-col items-center gap-1 rounded-xl px-0.5 py-0.5"
                >
                  <span className={cn("relative grid size-9 place-items-center rounded-full text-sm font-bold tabular transition-all", atual ? "bg-[var(--ink)] text-[var(--bg)] ring-4 ring-[var(--ink)]/15" : feito ? "bg-[var(--folha)] text-white" : "bg-[var(--bg)] text-[var(--ink-2)] ring-2 ring-[var(--line-strong)] group-hover:ring-[var(--ink-3)]")}>
                    {feito ? <Check className="size-4" strokeWidth={3.5} /> : i + 1}
                  </span>
                  <span className={cn("max-w-full truncate text-[11px] leading-tight sm:text-xs", atual ? "font-bold text-[var(--ink)]" : "font-medium text-[var(--ink-3)]")}>{p.curto}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
        <div className="space-y-4">
          <header key={`h${step}`} className="surgir space-y-1.5">
            <p className="text-sm font-semibold text-[var(--folha)]">Passo {step + 1} de {PASSOS.length}</p>
            <h2 className="font-display text-2xl font-extrabold leading-tight">{PASSOS[step].pergunta}</h2>
            <p className="max-w-prose text-[15px] text-[var(--ink-2)]">
              <span className="font-semibold text-[var(--ink)]">Agora:</span> {PASSOS[step].agora}
            </p>
            {step < PASSOS.length - 1 && <p className="text-sm text-[var(--ink-3)]">Depois: {PASSOS[step + 1].nome.toLowerCase()}.</p>}
          </header>
          <div key={step} className="surgir space-y-5">
            {passoPanels[step]}
          </div>
          <div className="hidden xl:block">{navegacao}</div>
        </div>
        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">{previewPanel}</div>
        </aside>
      </div>

      {/* celular: miniatura da arte sempre à mão e navegação do passo */}
      <div className="xl:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 px-4 lg:bottom-6 lg:left-[272px]">
        <div className="vidro-forte mx-auto flex max-w-md items-center gap-2 rounded-2xl p-2">
          <button
            type="button"
            onClick={() => setVerPrevia(true)}
            aria-label="Ver a prévia da arte"
            className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg ring-1 ring-[var(--line-strong)]"
            style={{ background: theme?.cardBg }}
          >
            {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-cover" /> : <span className="esqueleto absolute inset-0 rounded-none" />}
            <span className="absolute bottom-0.5 right-0.5 grid size-4 place-items-center rounded-full bg-black/60 text-white"><Eye className="size-2.5" /></span>
          </button>
          <span className="min-w-0 flex-1 truncate text-xs text-[var(--ink-2)]">
            Passo {step + 1} de {PASSOS.length}: {PASSOS[step].curto}
          </span>
          {step > 0 && (
            <Button variant="fantasma" onClick={voltar} aria-label="Voltar um passo">
              <ArrowLeft className="size-4" />
            </Button>
          )}
          {ultimo ? (
            <Button onClick={save} loading={saving}>Salvar</Button>
          ) : (
            <>
              {step < P_PRODUTOS && (
                <Button variant="vidro" onClick={irParaProdutos} aria-label="Pular para a escolha dos produtos">Pular</Button>
              )}
              <Button onClick={avancar} disabled={!podeAvancar}>Próximo</Button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {verPrevia && (
          <motion.div
            className="xl:hidden fixed inset-0 z-50 flex items-end bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVerPrevia(false)}
            role="dialog"
            aria-label="Prévia da arte"
          >
            <motion.div
              className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-[var(--bg)] p-4 pb-8"
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">Sua arte</h3>
                <button type="button" onClick={() => setVerPrevia(false)} className="grid size-11 place-items-center rounded-xl hover:bg-[var(--line)]" aria-label="Fechar prévia">
                  <X className="size-5" />
                </button>
              </div>
              {previewPanel}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ on, onClick, children, cor }: { on: boolean; onClick: () => void; children: React.ReactNode; cor?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={on && cor ? { background: cor } : undefined}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13px] font-medium ring-1 transition active:scale-95",
        on ? (cor ? "text-white ring-transparent" : "bg-[var(--ink)] text-[var(--bg)] ring-transparent") : "bg-[var(--glass-strong)] text-[var(--ink-2)] ring-[var(--line)] hover:text-[var(--ink)]"
      )}
    >
      {cor && !on ? <span className="size-2.5 shrink-0 rounded-full" style={{ background: cor }} aria-hidden /> : null}
      {children}
    </button>
  );
}

function Thumb({ url, name }: { url: string | null; name: string }) {
  return (
    <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl fundo-foto ring-1 ring-[var(--line)]">
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
