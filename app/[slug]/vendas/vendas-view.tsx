import Link from "next/link";
import { TrendingUp, TrendingDown, Package, Megaphone, ArrowRight, Sparkles, Gem, Repeat, Info, Wallet, ShoppingBasket, Percent, ChartColumn, Layers, Check, FileCheck2, type LucideIcon } from "lucide-react";
import { Glass, SecaoTitulo, Bola, cn, type CorBola } from "@/components/ui";
import type { SalesAnalysis } from "@/lib/sales/analyze";
import { sugerir, type Sugestao } from "@/lib/sales/suggest";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n >= 1000 ? 0 : 2 });
const pct = (n: number, sign = false) => `${sign && n > 0 ? "+" : ""}${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: Math.abs(n) < 0.1 ? 1 : 0 })}%`;
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

const TOM: Record<Sugestao["tom"], { Icon: LucideIcon; cor: CorBola }> = {
  alta: { Icon: TrendingUp, cor: "verde" },
  queda: { Icon: TrendingDown, cor: "tomate" },
  parado: { Icon: Package, cor: "banana" },
  margem: { Icon: Gem, cor: "uva" },
  campanha: { Icon: Repeat, cor: "azul" },
  aviso: { Icon: Info, cor: "cinza" },
};

const BOTAO = "[background-image:linear-gradient(135deg,#e8284f,#b3122f_60%,#8c0c26)]";

function Kpi({ Icone, cor, label, value, note, tone }: { Icone: LucideIcon; cor: CorBola; label: string; value: string; note?: string | null; tone?: "up" | "down" | null }) {
  return (
    <Glass className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Bola Icone={Icone} cor={cor} />
        <p className="text-base font-semibold text-[var(--ink-2)]">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold tabular leading-none">{value}</p>
      {note && (
        <p className={cn("mt-2 flex items-center gap-1 text-sm", tone === "up" ? "text-[var(--folha)]" : tone === "down" ? "text-[var(--perigo)]" : "text-[var(--ink-3)]")}>
          {tone === "up" && <TrendingUp className="size-4 shrink-0" />}
          {tone === "down" && <TrendingDown className="size-4 shrink-0" />}
          {note}
        </p>
      )}
    </Glass>
  );
}

// barra de uma cor só, com o valor escrito ao lado: a cor nunca é a única informação
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-2.5 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
      <span className="block h-full origin-left rounded-full bg-[var(--folha)]" style={{ transform: `scaleX(${max ? Math.max(0.02, value / max) : 0})` }} />
    </span>
  );
}

function VerMais({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-11 items-center gap-2 rounded-full bg-[var(--glass-strong)] px-5 text-base font-semibold ring-1 ring-[var(--line-strong)] transition hover:-translate-y-px">
      {children} <ArrowRight className="size-4" />
    </Link>
  );
}

export function VendasView({ slug, analysis: a, imports }: { slug: string; analysis: SalesAnalysis; imports: { id: string; period_start: string; period_end: string; rows: number; matched: number; file_name: string | null }[] }) {
  if (!a.period) return null;
  const change = a.kpis.revenueChange;
  const maxCat = Math.max(...a.categories.map((c) => c.revenue), 0);
  const sugestoes = sugerir(a);
  const encarteHref = (ids: (string | null)[]) => `/${slug}/encartes/novo?produtos=${ids.filter(Boolean).slice(0, 30).join(",")}`;

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="periodo">
        <h2 id="periodo" className="text-base font-semibold text-[var(--ink-2)]">
          Período de {dm(a.period.start)} a {dm(a.period.end)} ({a.period.days} dias){a.previousPeriods ? (a.previousPeriods === 1 ? ", comparado com o período anterior" : `, comparado com os ${a.previousPeriods} períodos anteriores`) : ""}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi Icone={Wallet} cor="verde" label="Faturamento" value={brl(a.kpis.revenue)} note={change == null ? "Envie mais um período para comparar" : `${pct(change, true)} no ritmo diário`} tone={change == null ? null : change >= 0 ? "up" : "down"} />
          <Kpi Icone={ShoppingBasket} cor="tomate" label="Itens vendidos" value={Math.round(a.kpis.qty).toLocaleString("pt-BR")} />
          <Kpi Icone={Layers} cor="uva" label="Produtos com venda" value={a.kpis.products.toLocaleString("pt-BR")} note={a.stale.length ? (a.stale.length === 1 ? "1 produto parado no catálogo" : `${a.stale.length} produtos parados no catálogo`) : null} />
          <Kpi Icone={Percent} cor="banana" label="Margem bruta" value={a.kpis.grossMargin == null ? "sem custo" : pct(a.kpis.grossMargin)} note={a.kpis.grossMargin == null ? "Precisa do custo no relatório ou no catálogo" : null} />
        </div>
      </section>

      {sugestoes.length > 0 && (
        <Glass as="section" className="space-y-5 p-5 sm:p-6" aria-labelledby="sugestoes">
          <SecaoTitulo id="sugestoes" Icone={Sparkles} cor="tomate" sub="O que fazer esta semana, com base nos seus relatórios.">Sugestões do Promia</SecaoTitulo>
          <ul className="grid gap-3 lg:grid-cols-2">
            {sugestoes.map((g) => {
              const { Icon, cor } = TOM[g.tom];
              const href = g.encarteId ? `/${slug}/encartes/${g.encarteId}` : g.produtos?.some(Boolean) ? encarteHref(g.produtos) : null;
              return (
                <li key={g.id} className="flex flex-col gap-3 rounded-3xl bg-[var(--glass-strong)] p-4 ring-1 ring-[var(--line)]">
                  <div className="flex items-start gap-3">
                    <Bola Icone={Icon} cor={cor} />
                    <p className="text-lg font-bold leading-snug">{g.titulo}</p>
                  </div>
                  <p className="text-base text-[var(--ink-2)]"><span className="font-semibold text-[var(--ink)]">Por quê:</span> {g.porque}</p>
                  <p className="flex gap-2 text-base text-[var(--ink-2)]"><Check className="mt-1 size-4 shrink-0 text-[var(--folha)]" strokeWidth={3} /> <span><span className="font-semibold text-[var(--ink)]">Faça:</span> {g.fazer}</span></p>
                  {href && (
                    <Link href={href} className={cn("mt-1 inline-flex h-11 items-center gap-2 self-start rounded-full px-5 text-base font-semibold text-white transition hover:-translate-y-px", BOTAO)}>
                      {g.encarteId ? "Abrir o encarte" : "Criar encarte com esses produtos"} <ArrowRight className="size-4" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </Glass>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-5 p-5 sm:p-6" aria-labelledby="abc">
          <SecaoTitulo id="abc" Icone={ChartColumn} cor="verde" sub={<>{a.abc.countA === 1 ? "1 produto faz" : `${a.abc.countA} produtos fazem`} {pct(a.abc.shareA)} do faturamento. Esses não podem faltar na gôndola nem sair caros.</>}>Curva ABC</SecaoTitulo>
          <ol className="space-y-3">
            {a.abc.a.slice(0, 10).map((l, i) => (
              <li key={l.key} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                <span className="grid size-7 place-items-center rounded-full bg-[var(--folha-soft)] text-sm font-bold tabular text-[var(--folha)]">{i + 1}</span>
                <span className="truncate text-base font-semibold">{l.name}</span>
                <span className="text-base font-semibold tabular text-[var(--ink-2)]">{pct(l.share)}</span>
                <span />
                <span className="col-span-2">
                  <Bar value={l.share} max={a.abc.a[0]?.share ?? 1} />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[var(--ink-3)]">
            Classe A: {a.abc.countA} produtos. Classe B: {a.abc.countB}. Classe C: {a.abc.countC}.
          </p>
        </Glass>

        <Glass as="section" className="space-y-5 p-5 sm:p-6" aria-labelledby="setores">
          <SecaoTitulo id="setores" Icone={Layers} cor="uva" sub="Participação de cada setor no faturamento do período.">Setores</SecaoTitulo>
          <ul className="space-y-3.5">
            {a.categories.map((c) => (
              <li key={c.name} className="space-y-1.5" title={`${c.name}: ${brl(c.revenue)}`}>
                <div className="flex items-baseline justify-between gap-3 text-base">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className="shrink-0 tabular text-[var(--ink-2)]">
                    {pct(c.share)}
                    {c.change != null && (
                      <span className={cn("ml-2 text-sm font-semibold", c.change >= 0 ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
                        {c.change >= 0 ? "▲" : "▼"} {pct(Math.abs(c.change))}
                      </span>
                    )}
                  </span>
                </div>
                <Bar value={c.revenue} max={maxCat} />
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      {(a.rising.length > 0 || a.falling.length > 0) && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {[
            { id: "alta", title: "Em alta", hint: "Vendendo mais que antes. Garanta estoque e destaque no próximo encarte.", list: a.rising, up: true },
            { id: "queda", title: "Em queda", hint: "Vendendo menos que antes. Vale conferir preço, exposição e concorrente.", list: a.falling, up: false },
          ].map((s) => (
            <Glass as="section" key={s.id} className="space-y-4 p-5 sm:p-6" aria-labelledby={s.id}>
              <SecaoTitulo id={s.id} Icone={s.up ? TrendingUp : TrendingDown} cor={s.up ? "verde" : "tomate"} sub={s.hint}>{s.title}</SecaoTitulo>
              {s.list.length === 0 ? (
                <p className="text-base text-[var(--ink-3)]">Nada relevante neste período.</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {s.list.map((t) => (
                    <li key={t.key} className="flex items-center justify-between gap-3 py-2.5 text-base">
                      <span className="min-w-0 truncate font-semibold">{t.name}</span>
                      <span className={cn("shrink-0 tabular font-bold", s.up ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
                        {s.up ? "▲" : "▼"} {pct(Math.abs(t.change))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.list.some((t) => t.productId) && <VerMais href={encarteHref(s.list.map((t) => t.productId))}>{s.up ? "Destacar no encarte" : "Montar encarte para recuperar"}</VerMais>}
            </Glass>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="encartes-res">
          <SecaoTitulo id="encartes-res" Icone={Megaphone} cor="azul" sub="Compara as vendas por dia dos produtos de cada encarte, durante a validade e fora dela.">Como cada encarte mexeu nas vendas</SecaoTitulo>
          {a.campaigns.length === 0 ? (
            <div className="space-y-2 text-base text-[var(--ink-2)]">
              <p>Para aparecer aqui, o Promia precisa de três coisas:</p>
              <ul className="space-y-1.5">
                {["Um encarte salvo com as datas de validade.", "Um relatório de vendas que cubra esse período.", "Vendas dos mesmos produtos em outro período, para comparar."].map((t) => (
                  <li key={t} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-[var(--folha)]" strokeWidth={3} /> {t}</li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-[var(--line)]">
                {a.campaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-base">
                    <Link href={`/${slug}/encartes/${c.id}`} className="min-w-0 truncate font-semibold hover:underline">
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-right">
                      {c.lift == null ? (
                        <span className="text-[var(--ink-3)]">{brl(c.revenueDuring)} vendidos, sem base para comparar</span>
                      ) : (
                        <span className={cn("font-bold tabular", c.lift >= 0 ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
                          {c.lift >= 0 ? "▲" : "▼"} {pct(Math.abs(c.lift))} por dia
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-[var(--ink-3)]">É uma comparação, não uma prova: feriado, preço e outras ações também mexem nas vendas.</p>
            </>
          )}
        </Glass>

        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="parados">
          <SecaoTitulo id="parados" Icone={Package} cor="banana" sub="Produtos do catálogo que não venderam neste período.">Parados</SecaoTitulo>
          {a.stale.length === 0 ? (
            <p className="flex items-center gap-2 text-base text-[var(--ink-2)]"><Check className="size-5 text-[var(--folha)]" strokeWidth={3} /> Todo o catálogo teve venda. Ótimo sinal.</p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--line)]">
                {a.stale.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-base">
                    <span className="min-w-0 truncate font-semibold">{s.name}</span>
                    {s.stock != null && <span className="shrink-0 text-sm text-[var(--ink-3)]">{Math.round(s.stock)} em estoque</span>}
                  </li>
                ))}
              </ul>
              <VerMais href={encarteHref(a.stale.map((s) => s.id))}>Montar encarte de giro</VerMais>
            </>
          )}
        </Glass>
      </div>

      <section className="space-y-3" aria-labelledby="envios">
        <h2 id="envios" className="text-base font-semibold text-[var(--ink-2)]">Relatórios enviados</h2>
        <ul className="flex flex-wrap gap-2">
          {imports.map((i) => (
            <li key={i.id} className="inline-flex items-center gap-2 rounded-full bg-[var(--glass-strong)] py-1.5 pl-2 pr-3.5 text-sm font-medium text-[var(--ink-2)] ring-1 ring-[var(--line)]" title={i.file_name ?? undefined}>
              <span className="grid size-6 place-items-center rounded-full bg-[#138a4c] text-white"><FileCheck2 className="size-3.5" /></span>
              {dm(i.period_start)} a {dm(i.period_end)}: {i.matched} de {i.rows} ligados ao catálogo
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
