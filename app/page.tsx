import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, market_id").eq("id", user.id).single();

  if (profile?.role === "master") redirect("/master");
  if (profile?.role === "mercado" && profile.market_id) {
    const { data: market } = await supabase.from("markets").select("slug").eq("id", profile.market_id).single();
    if (market) redirect(`/${market.slug}`);
  }

  redirect("/login");
}
