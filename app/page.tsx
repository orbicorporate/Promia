import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusScreen } from "@/components/shell/status-screen";

function SairButton({ label }: { label: string }) {
  return (
    <form action="/sair" method="post">
      <button type="submit" className="h-11 w-full rounded-[14px] bg-[var(--ink)] font-medium text-[var(--bg)]">
        {label}
      </button>
    </form>
  );
}

export default async function Home() {
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");

  if (who.status === "no_profile") {
    return (
      <StatusScreen title="Conta sem mercado" action={<SairButton label="Entrar com outra conta" />}>
        Você entrou como {who.email ?? "este usuário"}, mas essa conta ainda não está ligada a nenhum mercado. Peça ao time Promia para liberar o acesso.
      </StatusScreen>
    );
  }

  if (who.viewer.role === "master") redirect("/master");

  const { data: market } = await createAdminClient().from("markets").select("slug").eq("id", who.viewer.marketId!).maybeSingle();
  if (market) redirect(`/${market.slug}`);
  return (
    <StatusScreen title="Mercado não encontrado" action={<SairButton label="Sair" />}>
      O mercado ligado à sua conta não existe mais. Fale com o time Promia.
    </StatusScreen>
  );
}
