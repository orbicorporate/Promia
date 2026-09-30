import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewMarketForm } from "./new-market-form";

export default async function MasterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "master") redirect("/login");

  const admin = createAdminClient();
  const { data: markets } = await admin
    .from("markets")
    .select("id, slug, name, niche, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Painel Promia</h1>
        </div>

        <NewMarketForm />

        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-500">Mercados cadastrados</h2>
          {(!markets || markets.length === 0) && (
            <p className="text-sm text-neutral-400">Nenhum mercado ainda.</p>
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
