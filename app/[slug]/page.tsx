import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getViewer, canAccessMarket } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/app-header";
import { RunGerenteButton, RecommendationList } from "./run-gerente-button";
import { ImportProductsSection } from "./import-products-section";
import { FindImagesButton } from "./find-images-button";
import type { GerenteRecommendation } from "@/lib/ai/gerente";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");
  if (who.status !== "ok") redirect("/");

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("id, name, niche, slug").eq("slug", slug).maybeSingle();
  if (!market) notFound();
  // dono de mercado só entra no próprio; ao tentar outro, volta pro dele
  if (!canAccessMarket(who.viewer, market.id)) redirect("/");

  const countWhere = (status?: string) => {
    let q = admin.from("products").select("id", { count: "exact", head: true }).eq("market_id", market.id);
    if (status) q = q.eq("image_status", status);
    return q;
  };

  const [total, pending, found, review, notFoundCount, { data: lastRec }, { data: lastImport }] = await Promise.all([
    countWhere(),
    countWhere("pendente"),
    countWhere("encontrada"),
    countWhere("revisar"),
    countWhere("nao_encontrada"),
    admin
      .from("ai_recommendations")
      .select("run_id, generated_at")
      .eq("market_id", market.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("product_imports")
      .select("created_at, rows_imported, file_name")
      .eq("market_id", market.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let lastRun: GerenteRecommendation[] = [];
  if (lastRec) {
    let q = admin.from("ai_recommendations").select("type, target, reason, priority").eq("market_id", market.id);
    q = lastRec.run_id ? q.eq("run_id", lastRec.run_id) : q.eq("generated_at", lastRec.generated_at);
    const { data } = await q.limit(8);
    lastRun = (data ?? []) as GerenteRecommendation[];
  }

  const productCount = total.count ?? 0;
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <AppHeader
          title={market.name}
          subtitle={`${productCount} produto(s) cadastrado(s)`}
          back={who.viewer.role === "master" ? { href: "/master", label: "Painel Promia" } : undefined}
        />

        <Link
          href={`/${market.slug}/tabloides/novo`}
          className={`inline-block rounded-lg px-4 py-2 text-sm ${
            productCount > 0 ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-500 pointer-events-none"
          }`}
          aria-disabled={productCount === 0}
        >
          + Novo tabloide
        </Link>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Produtos</h2>
          <p className="text-sm text-neutral-600">
            Suba a planilha uma vez e reenvie quando quiser atualizar preço ou estoque. As fotos já encontradas são
            mantidas.
            {lastImport && (
              <span className="text-neutral-500">
                {" "}
                Última importação: {fmtDate(lastImport.created_at)}, {lastImport.rows_imported} produto(s).
              </span>
            )}
          </p>
          <ImportProductsSection marketId={market.id} />

          {productCount > 0 && (
            <div className="bg-white border border-neutral-200 rounded-lg px-4 py-3 space-y-3">
              <p className="text-sm text-neutral-700">
                Fotos: {found.count ?? 0} encontrada(s) · {review.count ?? 0} para revisar ·{" "}
                {notFoundCount.count ?? 0} sem foto · {pending.count ?? 0} na fila
              </p>
              <FindImagesButton marketId={market.id} pendingCount={pending.count ?? 0} />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Gerente inteligente</h2>
          <p className="text-sm text-neutral-600">
            Analisa o catálogo (preço, custo, estoque quando houver), as datas próximas e as promoções fixas, e
            recomenda o que destacar, promover, repor ou revisar.
          </p>
          {productCount > 0 ? (
            <RunGerenteButton marketId={market.id} />
          ) : (
            <p className="text-sm text-neutral-500">Importe a planilha de produtos para liberar o gerente.</p>
          )}
          {lastRun.length > 0 && lastRec && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-neutral-500">Última análise: {fmtDate(lastRec.generated_at)}</p>
              <RecommendationList items={lastRun} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
