import Link from "next/link";
import { TrendingUp, TrendingDown, Package, Megaphone, ArrowRight } from "lucide-react";
import { Glass, cn } from "@/components/ui";
import type { SalesAnalysis } from "@/lib/sales/analyze";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n >= 1000 ? 0 : 2 });
const pct = (n: number, sign = false) => `${sign && n > 0 ? "+" : ""}${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: Math.abs(n) < 0.1 ? 1 : 0 })}%`;
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function Kpi({ label, value, note, tone }: { label: string; value: string; note?: string | null; tone?: "up" | "down" | null }) {
  return (
    <div className="vidro rounded-[22px] p-4 sm:p-5">
      <p className="text-sm text-[var(--ink-2)]">{label}</p>
      <p className="mt-1 font-display text-3xl font-extrabold tabular leading-none">{value}</p>
      {note && (
        <p className={cn("mt-2 flex items-center gap-1 text-sm", tone === "up" ? "text-[var(--folha)]" : tone === "down" ? "text-[var(--perigo)]" : "text-[var(--ink-3)]")}>
          {tone === "up" && <TrendingUp className="size-4" />}
          {tone === "down" && <TrendingDown className="size-4" />}
          {note}
        </p>
      )}
    </div>
  );
}

// barra de uma cor só, com o valor escrito ao lado: a cor nunca é a única informação
function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="block h-2 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
      <span className="block h-full origin-left rounded-full bg-[var(--folha)]" style={{ transform: `scaleX(${max ? Math.max(0.02, value / max) : 0})` }} />
    </span>
  );
}

export function VendasView({ slug, analysis: a, imports }: { slug: string; analysis: SalesAnalysis; imports: { id: string; period_start: string; period_end: string; rows: number; matched: number; file_name: string | null }[] }) {
  if (!a.period) return null;
  const change = a.kpis.revenueChange;
  const maxCat = Math.max(...a.categories.map((c) => c.revenue), 0);
  const encarteHref = (ids: (string | null)[]) => `/${slug}/encartes/novo?produtos=${ids.filter(Boolean).slice(0, 30).join(",")}`;

  return (
    <div className="space-y-8">
      <section className="space-y-3" aria-labelledby="periodo">
        <h2 id="periodo" className="text-sm font-semibold text-[var(--ink-3)]">
          Período de {dm(a.period.start)} a {dm(a.period.end)} ({a.period.days} dias){a.previousPeriods ? `, comparado com ${a.previousPeriods} período(s) antes` : ""}
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Faturamento" value={brl(a.kpis.revenue)} note={change == null ? "Envie mais um período para comparar" : `${pct(change, true)} no ritmo diário`} tone={change == null ? null : change >= 0 ? "up" : "down"} />
          <Kpi label="Itens vendidos" value={Math.round(a.kpis.qty).toLocaleString("pt-BR")} />
          <Kpi label="Produtos com venda" value={a.kpis.products.toLocaleString("pt-BR")} note={a.stale.length ? `${a.stale.length}+ parados no catálogo` : null} />
          <Kpi label="Margem bruta" value={a.kpis.grossMargin == null ? "sem custo" : pct(a.kpis.grossMargin)} note={a.kpis.grossMargin == null ? "Precisa do custo no relatório ou no catálogo" : null} />
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="abc">
          <div>
            <h2 id="abc" className="text-lg font-bold">Curva ABC</h2>
            <p className="text-sm text-[var(--ink-2)]">
              {a.abc.countA} produto(s) fazem {pct(a.abc.shareA)} do faturamento. São eles que não podem faltar na gôndola nem sair caros.
            </p>
          </div>
          <ol className="space-y-2.5">
            {a.abc.a.slice(0, 10).map((l, i) => (
              <li key={l.key} className="grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
                <span className="text-sm tabular text-[var(--ink-3)]">{i + 1}</span>
                <span className="truncate text-sm font-medium">{l.name}</span>
                <span className="text-sm tabular text-[var(--ink-2)]">{pct(l.share)}</span>
                <span />
                <span className="col-span-2">
                  <Bar value={l.share} max={a.abc.a[0]?.share ?? 1} />
                </span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-[var(--ink-3)]">
            A: {a.abc.countA} · B: {a.abc.countB} · C: {a.abc.countC} produtos
          </p>
        </Glass>

        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="setores">
          <div>
            <h2 id="setores" className="text-lg font-bold">Setores</h2>
            <p className="text-sm text-[var(--ink-2)]">Participação no faturamento do período.</p>
          </div>
          <ul className="space-y-3">
            {a.categories.map((c) => (
              <li key={c.name} className="space-y-1" title={`${c.name}: ${brl(c.revenue)}`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="shrink-0 tabular text-[var(--ink-2)]">
                    {pct(c.share)}
                    {c.change != null && (
                      <span className={cn("ml-2 text-xs", c.change >= 0 ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
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
            <Glass as="section" key={s.id} className="space-y-3 p-5 sm:p-6" aria-labelledby={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id={s.id} className="flex items-center gap-2 text-lg font-bold">
                    {s.up ? <TrendingUp className="size-5 text-[var(--folha)]" /> : <TrendingDown className="size-5 text-[var(--perigo)]" />} {s.title}
                  </h2>
                  <p className="text-sm text-[var(--ink-2)]">{s.hint}</p>
                </div>
              </div>
              {s.list.length === 0 ? (
                <p className="text-sm text-[var(--ink-3)]">Nada relevante neste período.</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {s.list.map((t) => (
                    <li key={t.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">{t.name}</span>
                      <span className={cn("shrink-0 tabular font-semibold", s.up ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
                        {s.up ? "▲" : "▼"} {pct(Math.abs(t.change))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {s.list.some((t) => t.productId) && (
                <Link href={encarteHref(s.list.map((t) => t.productId))} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)] hover:text-[var(--ink)]">
                  {s.up ? "Destacar no encarte" : "Montar encarte para recuperar"} <ArrowRight className="size-4" />
                </Link>
              )}
            </Glass>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
        <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="encartes-res">
          <h2 id="encartes-res" className="flex items-center gap-2 text-lg font-bold">
            <Megaphone className="size-5 text-[var(--uva)]" /> Resultado dos encartes
          </h2>
          {a.campaigns.length === 0 ? (
            <p className="text-sm text-[var(--ink-2)]">Quando um encarte estiver valendo num período enviado, aparece aqui quanto os produtos dele venderam a mais.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {a.campaigns.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/${slug}/encartes/${c.id}`} className="min-w-0 truncate font-medium hover:underline">
                    {c.name}
                  </Link>
                  <span className="shrink-0 text-right">
                    {c.lift == null ? (
                      <span className="text-[var(--ink-3)]">{brl(c.revenueDuring)} vendidos</span>
                    ) : (
                      <span className={cn("font-semibold tabular", c.lift >= 0 ? "text-[var(--folha)]" : "text-[var(--perigo)]")}>
                        {c.lift >= 0 ? "▲" : "▼"} {pct(Math.abs(c.lift))} nas vendas
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="parados">
          <h2 id="parados" className="flex items-center gap-2 text-lg font-bold">
            <Package className="size-5 text-[var(--ink-3)]" /> Sem venda no período
          </h2>
          {a.stale.length === 0 ? (
            <p className="text-sm text-[var(--ink-2)]">Todo o catálogo teve venda. Ótimo sinal.</p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--line)]">
                {a.stale.slice(0, 8).map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{s.name}</span>
                    {s.stock != null && <span className="shrink-0 text-xs text-[var(--ink-3)]">{Math.round(s.stock)} em estoque</span>}
                  </li>
                ))}
              </ul>
              <Link href={encarteHref(a.stale.map((s) => s.id))} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)] hover:text-[var(--ink)]">
                Montar encarte de giro <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </Glass>
      </div>

      <section className="space-y-2" aria-labelledby="envios">
        <h2 id="envios" className="text-sm font-semibold text-[var(--ink-3)]">Relatórios enviados</h2>
        <ul className="flex flex-wrap gap-2">
          {imports.map((i) => (
            <li key={i.id} className="vidro rounded-full px-3 py-1.5 text-xs text-[var(--ink-2)]" title={i.file_name ?? undefined}>
              {dm(i.period_start)} a {dm(i.period_end)}: {i.matched} de {i.rows} ligados
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
