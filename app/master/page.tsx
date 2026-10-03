import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PromiaLogo } from "@/components/shell/logo";
import { MarketMark } from "@/components/shell/market-mark";
import { NewMarketForm } from "./new-market-form";

export const metadata = { title: "Painel Promia" };

export default async function MasterPage() {
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");
  if (who.status !== "ok" || who.viewer.role !== "master") redirect("/");

  const admin = createAdminClient();
  const { data: markets } = await admin
    .from("markets")
    .select("id, slug, name, niche, logo_url, color_primary, created_at")
    .order("created_at", { ascending: false });
  // contagens por mercado (head: true não traz linhas, só o total)
  const stats = new Map(
    await Promise.all(
      (markets ?? []).map(async (m) => {
        const [p, t, l] = await Promise.all([
          admin.from("products").select("id", { count: "exact", head: true }).eq("market_id", m.id).eq("active", true),
          admin.from("tabloids").select("id", { count: "exact", head: true }).eq("market_id", m.id),
          admin.from("tabloids").select("updated_at").eq("market_id", m.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        return [m.id, { products: p.count ?? 0, tabloids: t.count ?? 0, last: l.data?.updated_at ?? null }] as const;
      })
    )
  );
  const totals = [...stats.values()].reduce((a, s) => ({ products: a.products + s.products, tabloids: a.tabloids + s.tabloids }), { products: 0, tabloids: 0 });

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <PromiaLogo className="h-9" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[var(--ink-3)] sm:inline">{who.viewer.email}</span>
          <form action="/sair" method="post">
            <button className="vidro h-9 rounded-xl px-3.5 text-sm">Sair</button>
          </form>
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Mercados</h1>
          <p className="mt-1 text-[var(--ink-2)]">
            {markets?.length ?? 0} cliente(s), {totals.products.toLocaleString("pt-BR")} produtos, {totals.tabloids} encartes
          </p>
        </div>
        <NewMarketForm />
      </div>

      {(!markets || markets.length === 0) && <p className="vidro rounded-[22px] p-8 text-center text-[var(--ink-2)]">Nenhum mercado ainda. Use Novo mercado para cadastrar o primeiro.</p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {markets?.map((m) => {
          const st = stats.get(m.id) ?? { products: 0, tabloids: 0, last: null };
          const ultimo = st.last;
          return (
            <li key={m.id}>
              <Link href={`/${m.slug}`} className="vidro group block rounded-[22px] p-5 transition hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <MarketMark name={m.name} logoUrl={m.logo_url} color={m.color_primary} size={48} />
                  <ArrowUpRight className="size-5 text-[var(--ink-3)] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--ink)]" />
                </div>
                <p className="mt-4 truncate font-display text-lg font-bold">{m.name}</p>
                <p className="truncate text-sm text-[var(--ink-3)]">/{m.slug}{m.niche ? `, ${m.niche}` : ""}</p>
                <div className="mt-4 flex gap-4 text-sm">
                  <span>
                    <b className="font-display text-xl">{st.products.toLocaleString("pt-BR")}</b> <span className="text-[var(--ink-3)]">produtos</span>
                  </span>
                  <span>
                    <b className="font-display text-xl">{st.tabloids}</b> <span className="text-[var(--ink-3)]">encartes</span>
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--ink-3)]">{ultimo ? `Último encarte em ${new Date(ultimo).toLocaleDateString("pt-BR")}` : "Ainda sem encarte"}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
