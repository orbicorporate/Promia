import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmptyState, cn } from "@/components/ui";
import { ProductList, type Row } from "./_ui/product-list";
import { SearchBox, ImportButton } from "./_ui/toolbar";
import { FindPhotos } from "./_ui/find-photos";

export const metadata = { title: "Produtos" };

const PAGE = 60;
const FILTERS = [
  { key: "", label: "Todos" },
  { key: "fotos", label: "Revisar fotos" },
  { key: "sem-foto", label: "Sem foto" },
  { key: "sem-preco", label: "Sem preço" },
  { key: "inativos", label: "Fora do catálogo" },
] as const;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function ProdutosPage({ params, searchParams }: PageProps<"/[slug]/produtos">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();

  const q = one(sp.q).slice(0, 80);
  const filtro = sp.fotos === "1" ? "fotos" : one(sp.filtro);
  const cat = one(sp.cat);
  const pagina = Math.max(1, Number(one(sp.pagina)) || 1);

  const base = () => admin.from("products").select("id", { count: "exact", head: true }).eq("market_id", market.id);
  const [all, revisar, semFoto, semPreco, inativos, pendentes, { data: cats }] = await Promise.all([
    base().eq("active", true),
    base().eq("active", true).in("image_status", ["revisar", "nao_encontrada"]),
    base().eq("active", true).is("image_url", null),
    base().eq("active", true).is("price", null),
    base().eq("active", false),
    base().eq("active", true).eq("image_status", "pendente"),
    admin.from("products").select("category").eq("market_id", market.id).eq("active", true).not("category", "is", null).limit(5000),
  ]);
  const counts: Record<string, number> = {
    "": all.count ?? 0,
    fotos: revisar.count ?? 0,
    "sem-foto": semFoto.count ?? 0,
    "sem-preco": semPreco.count ?? 0,
    inativos: inativos.count ?? 0,
  };
  const catCount = new Map<string, number>();
  for (const c of cats ?? []) if (c.category) catCount.set(c.category, (catCount.get(c.category) ?? 0) + 1);
  const categories = [...catCount.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  let query = admin
    .from("products")
    .select("id, sku, ean, name, brand, category, unit, price, cost, active, image_url, image_status, image_candidates", { count: "exact" })
    .eq("market_id", market.id);
  if (filtro === "inativos") query = query.eq("active", false);
  else query = query.eq("active", true);
  if (filtro === "fotos") query = query.in("image_status", ["revisar", "nao_encontrada"]);
  if (filtro === "sem-foto") query = query.is("image_url", null);
  if (filtro === "sem-preco") query = query.is("price", null);
  if (cat) query = query.eq("category", cat);
  if (q) {
    const safe = q.replace(/[%,()*]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,sku.ilike.%${safe}%,ean.ilike.%${safe}%`);
  }
  const { data, count } = await query.order("name").range((pagina - 1) * PAGE, pagina * PAGE - 1);
  const rows: Row[] = (data ?? []).map((p) => ({
    ...p,
    price: p.price == null ? null : Number(p.price),
    cost: p.cost == null ? null : Number(p.cost),
    image_candidates: Array.isArray(p.image_candidates) ? (p.image_candidates as string[]) : null,
  }));
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  const href = (patch: Record<string, string | number | null>) => {
    const u = new URLSearchParams();
    const cur: Record<string, string> = { q, filtro: filtro === "fotos" ? "fotos" : filtro, cat };
    for (const [k, v] of Object.entries({ ...cur, ...patch })) if (v !== null && v !== "" && v !== undefined) u.set(k, String(v));
    const s = u.toString();
    return `/${slug}/produtos${s ? `?${s}` : ""}`;
  };

  if ((all.count ?? 0) === 0 && (inativos.count ?? 0) === 0) {
    return (
      <div className="space-y-6 pt-2">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Produtos</h1>
        <div className="vidro rounded-[24px]">
          <EmptyState icon={<FileSpreadsheet className="size-6" />} title="Comece pela planilha do seu sistema" action={<ImportButton marketId={market.id} openInitially={sp.importar === "1"} primary />}>
            Exporte a lista de produtos do seu sistema de caixa (Excel ou CSV). O Promia entende colunas bagunçadas, guarda o histórico de preços e busca as fotos sozinho.
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Produtos</h1>
          <p className="mt-1 text-[var(--ink-2)]">{counts[""].toLocaleString("pt-BR")} no catálogo</p>
        </div>
        <ImportButton marketId={market.id} openInitially={sp.importar === "1"} />
      </header>

      <FindPhotos marketId={market.id} pending={pendentes.count ?? 0} />

      <div className="sticky top-[68px] z-20 -mx-1 space-y-3 px-1 py-1 lg:top-2">
        <SearchBox initial={q} />
        <nav className="rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Filtros">
          {FILTERS.map((f) => {
            const active = (filtro || "") === f.key;
            const n = counts[f.key];
            if (f.key && !n && !active) return null;
            return (
              <Link
                key={f.key}
                href={href({ filtro: f.key || null, pagina: null })}
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium ring-1 transition",
                  active ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "vidro text-[var(--ink-2)] ring-transparent hover:text-[var(--ink)]"
                )}
              >
                {f.label}
                <span className={cn("tabular text-xs", active ? "opacity-70" : "text-[var(--ink-3)]")}>{n.toLocaleString("pt-BR")}</span>
              </Link>
            );
          })}
        </nav>
        {categories.length > 1 && filtro !== "fotos" && (
          <nav className="rolagem -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" aria-label="Categorias">
            {categories.slice(0, 30).map((c) => (
              <Link
                key={c}
                href={href({ cat: cat === c ? null : c, pagina: null })}
                scroll={false}
                className={cn(
                  "h-10 shrink-0 rounded-full px-3.5 text-[13px] leading-10 transition",
                  cat === c ? "bg-[var(--folha)] text-white" : "text-[var(--ink-2)] hover:bg-[var(--line)]"
                )}
              >
                {c}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="vidro rounded-[22px]">
          <EmptyState title="Nada por aqui">{q ? `Nenhum produto com "${q}".` : "Nenhum produto neste filtro."}</EmptyState>
        </div>
      ) : (
        <ProductList rows={rows} review={filtro === "fotos"} categories={categories} />
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {pagina > 1 && (
            <Link href={href({ pagina: pagina - 1 })} className="vidro rounded-full px-4 py-2">
              Anterior
            </Link>
          )}
          <span className="tabular text-[var(--ink-3)]">
            {pagina} de {pages}
          </span>
          {pagina < pages && (
            <Link href={href({ pagina: pagina + 1 })} className="vidro rounded-full px-4 py-2">
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
