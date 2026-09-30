import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RunGerenteButton } from "./run-gerente-button";

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, market_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/login");

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("id, name, niche, slug").eq("slug", slug).single();
  if (!market) notFound();

  // dono de mercado só entra no próprio; o time master pode olhar qualquer um
  if (profile.role === "mercado" && profile.market_id !== market.id) redirect("/login");

  const { count: productCount } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("market_id", market.id);

  const { data: recentRecs } = await admin
    .from("ai_recommendations")
    .select("type, target, reason, priority, generated_at")
    .eq("market_id", market.id)
    .order("generated_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{market.name}</h1>
          <p className="text-sm text-neutral-500">{productCount ?? 0} produtos cadastrados</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Gerente inteligente</h2>
          <p className="text-sm text-neutral-600">
            Analisa seu catálogo (preço, categoria, estoque quando houver) e a época atual, e recomenda o que
            destacar, promover, repor ou revisar.
          </p>
          {productCount && productCount > 0 ? (
            <RunGerenteButton marketId={market.id} />
          ) : (
            <p className="text-sm text-neutral-400">
              Cadastre produtos primeiro pra liberar o gerente inteligente.
            </p>
          )}

          {recentRecs && recentRecs.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-neutral-400 mb-2">Última rodada:</p>
              <ul className="space-y-2">
                {recentRecs.map((r, i) => (
                  <li key={i} className="bg-white border border-neutral-200 rounded-lg px-4 py-3">
                    <span className="text-xs uppercase tracking-wide text-neutral-400">{r.type.replace("_", " ")}</span>
                    <p className="text-sm font-medium text-neutral-900 mt-1">{r.target}</p>
                    <p className="text-sm text-neutral-600 mt-1">{r.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
