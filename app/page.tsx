import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");

  if (who.status === "no_profile") {
    // antes: voltava pro login e entrava em loop, sem explicar nada
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8 space-y-4">
          <h1 className="text-lg font-semibold text-neutral-900">Conta sem mercado</h1>
          <p className="text-sm text-neutral-600">
            Você entrou como {who.email ?? "este usuário"}, mas essa conta ainda não está ligada a nenhum mercado.
            Peça ao time Promia para liberar o seu acesso.
          </p>
          <form action="/sair" method="post">
            <button type="submit" className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm">
              Entrar com outra conta
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (who.viewer.role === "master") redirect("/master");

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("slug").eq("id", who.viewer.marketId!).maybeSingle();
  if (market) redirect(`/${market.slug}`);
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-xl p-8 space-y-4">
        <h1 className="text-lg font-semibold text-neutral-900">Mercado não encontrado</h1>
        <p className="text-sm text-neutral-600">O mercado ligado à sua conta não existe mais. Fale com o time Promia.</p>
        <form action="/sair" method="post">
          <button type="submit" className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm">Sair</button>
        </form>
      </div>
    </div>
  );
}
