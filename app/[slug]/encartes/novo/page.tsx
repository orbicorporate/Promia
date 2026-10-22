import { listarArquivos } from "@/lib/server/arquivos";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/auth";
import { isISODate, addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { isThemeKey, getTheme } from "@/lib/encarte/themes";
import { prontoDaOcasiao } from "@/lib/encarte/prontos";
import { loadSalesAnalysis } from "@/lib/sales/load";
import { upcomingOccasions } from "@/lib/occasions";
import { isEncarteFormat, isEncarteLayout, isEncarteFundo, isEncarteModelo } from "@/lib/encarte/types";
import { EncarteBuilder, type BuilderInitial, type BuilderItem } from "../_ui/builder";
import { loadBuilderData } from "../_ui/builder-data";
import { lerEmblema } from "@/lib/encarte/emblema-escala";
import { lerRodapePadrao } from "@/lib/server/rodape-padrao";
import { mercadoRodapeInfo } from "@/lib/encarte/rodape";

export const metadata = { title: "Novo encarte" };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function NovoEncartePage({ params, searchParams }: PageProps<"/[slug]/encartes/novo">) {
  const { slug } = await params;
  const sp = await searchParams;
  const { market } = await requireMarketPage(slug);
  const titulo = one(sp.titulo)?.slice(0, 80);
  const [data, rodapePadrao, arquivos] = await Promise.all([loadBuilderData(market.id, titulo ? [titulo] : []), lerRodapePadrao(createAdminClient(), market.id), listarArquivos(market.id)]);

  const tema = one(sp.tema);
  const de = one(sp.de);
  const ate = one(sp.ate);
  const copiar = one(sp.copiar);
  const produtos = (one(sp.produtos) ?? "").split(",").filter(isUuid).slice(0, 200);
  // chegou por uma data (Halloween, Dia das Mães...): abre com o logo, o fundo e as caixas dela
  const pronto = prontoDaOcasiao(one(sp.ocasiao)?.slice(0, 80));
  const themeKey = pronto && isThemeKey(pronto.themeKey) ? pronto.themeKey : isThemeKey(tema) ? tema : isThemeKey("ofertas") ? "ofertas" : data.suggested[0];
  const validFrom = isISODate(de) ? de : data.today;
  const validUntil = isISODate(ate) && ate >= validFrom ? ate : addDaysISO(validFrom, 6);

  // Produtos sugeridos: os mais vendidos do último relatório; se faltar, completa com os que já têm foto e preço.
  const comPreco = new Map(data.catalog.filter((p) => p.price != null && p.price > 0).map((p) => [p.id, p]));
  const sugeridos: string[] = [];
  try {
    const vendas = await loadSalesAnalysis(createAdminClient(), market.id);
    for (const t of vendas.analysis?.top ?? []) if (t.productId && comPreco.has(t.productId) && !sugeridos.includes(t.productId)) sugeridos.push(t.productId);
  } catch {}
  for (const p of data.catalog) {
    if (sugeridos.length >= 12) break;
    if (comPreco.has(p.id) && (p.image_url || p.image_candidates?.length) && !sugeridos.includes(p.id)) sugeridos.push(p.id);
  }
  const proximaData = upcomingOccasions(todayInSaoPaulo(), [], 21).find((o) => o.kind === "data" && prontoDaOcasiao(o.title));

  let initial: BuilderInitial = {
    name: titulo ? `${titulo}` : `Ofertas ${validFrom.slice(8, 10)}/${validFrom.slice(5, 7)}`,
    headline: titulo ? getTheme(themeKey).headline : getTheme(themeKey).headline,
    subheadline: "",
    format: "feed",
    layout: "grade",
    modelo: pronto ? pronto.modelo : "cx01",
    emblema: pronto ? pronto.emblema : "ofertas-da-semana",
    emblemaEscala: 1,
    rodape: rodapePadrao ?? undefined,
    fundo: pronto ? pronto.fundo : null,
    temaPronto: pronto?.tema,
    autoProdutos: sugeridos.slice(0, 12),
    ocasiaoTitulo: pronto ? (one(sp.ocasiao)?.slice(0, 80) ?? undefined) : proximaData?.title,
    themeKey,
    validFrom,
    validUntil,
    items: [],
  };

  const byId = new Map(data.catalog.map((p) => [p.id, p]));
  if (produtos.length) {
    initial.items = produtos
      .filter((id) => byId.has(id))
      .map<BuilderItem>((id) => ({ productId: id, promoPrice: null, oldPrice: null, highlight: false, limitQty: null, label: null }));
  }

  if (isUuid(copiar)) {
    const admin = createAdminClient();
    const { data: src } = await admin
      .from("tabloids")
      .select("name, headline, subheadline, format, layout, modelo, emblema, fundo, theme_key, tabloid_products(product_id, position, promo_price, old_price, highlight, limit_qty, label)")
      .eq("id", copiar)
      .eq("market_id", market.id)
      .maybeSingle();
    if (src) {
      initial = {
        ...initial,
        name: `${src.name} (cópia)`.slice(0, 120),
        headline: src.headline ?? "",
        subheadline: src.subheadline ?? "",
        format: isEncarteFormat(src.format) ? src.format : "feed",
        layout: isEncarteLayout(src.layout) ? src.layout : "grade",
        modelo: isEncarteModelo(src.modelo) ? src.modelo : null,
        emblema: lerEmblema(src.emblema).slug,
        emblemaEscala: lerEmblema(src.emblema).escala,
        caixasEscala: lerEmblema(src.emblema).caixas,
        validade: lerEmblema(src.emblema).validade,
        rodape: lerEmblema(src.emblema).rodape,
        fotoExtra: lerEmblema(src.emblema).fotoExtra ? `${market.id}/arquivos/${lerEmblema(src.emblema).fotoExtra}` : null,
        fundo: isEncarteFundo(src.fundo) ? src.fundo : null,
        themeKey: isThemeKey(src.theme_key) ? src.theme_key : initial.themeKey,
        items: [...(src.tabloid_products ?? [])]
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .filter((r) => byId.has(r.product_id))
          .map((r) => ({
            productId: r.product_id,
            promoPrice: r.promo_price == null ? null : Number(r.promo_price),
            oldPrice: r.old_price == null ? null : Number(r.old_price),
            highlight: !!r.highlight,
            limitQty: r.limit_qty,
            label: r.label,
          })),
      };
    }
  }

  return (
    <div className="space-y-5 pt-2">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Link href={`/${slug}/encartes`} className="inline-flex items-center gap-1 text-sm text-[var(--ink-3)] hover:text-[var(--ink)]">
            <ArrowLeft className="size-4" /> Encartes
          </Link>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Novo encarte</h1>
        </div>
      </header>
      {data.catalog.length === 0 ? (
        <SemProdutos slug={slug} />
      ) : (
        <EncarteBuilder
          marketId={market.id}
          slug={slug}
          catalog={data.catalog}
          themes={data.themes}
          suggestedThemeKeys={data.suggested}
          initial={initial}
          mercado={mercadoRodapeInfo(market)}
          rodapePadrao={rodapePadrao}
          arquivos={arquivos.map((a) => ({ path: a.path, url: a.url }))}
          today={data.today}
        />
      )}
    </div>
  );
}

function SemProdutos({ slug }: { slug: string }) {
  return (
    <div className="vidro rounded-[24px] p-8 text-center">
      <h2 className="font-display text-2xl font-bold">Primeiro, os produtos</h2>
      <p className="mx-auto mt-2 max-w-md text-[var(--ink-2)]">Envie a planilha do seu sistema. Em seguida o Promia busca as fotos e você monta o encarte aqui.</p>
      <Link href={`/${slug}/produtos?importar=1`} className="mt-5 inline-flex h-11 items-center rounded-2xl bg-[var(--ink)] px-5 font-semibold text-[var(--bg)]">
        Enviar planilha
      </Link>
    </div>
  );
}
