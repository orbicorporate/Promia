import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppHeader } from "@/components/app-header";
import { NewMarketForm } from "./new-market-form";

export default async function MasterPage() {
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");
  if (who.status !== "ok" || who.viewer.role !== "master") redirect("/");

  const admin = createAdminClient();
  const { data: markets } = await admin
    .from("markets")
    .select("id, slug, name, niche, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <AppHeader title="Painel Promia" subtitle={who.viewer.email ?? undefined} />

        <NewMarketForm />

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Mercados cadastrados</h2>
          {(!markets || markets.length === 0) && (
            <p className="text-sm text-neutral-500">Nenhum mercado ainda. Use Novo mercado para cadastrar o primeiro.</p>
          )}
          <ul className="space-y-2">
            {markets?.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/${m.slug}`}
                  className="block bg-white border border-neutral-200 rounded-lg px-4 py-3 hover:border-neutral-300"
                >
                  <p className="text-sm font-medium text-neutral-900">{m.name}</p>
                  <p className="text-xs text-neutral-500">/{m.slug}{m.niche ? ` · ${m.niche}` : ""}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
