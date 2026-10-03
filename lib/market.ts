import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getViewer, canAccessMarket, type Viewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type Market = Tables<"markets">;

// Carrega o mercado da URL já conferindo o acesso. Cacheado por
// requisição: o layout e a página chamam e o banco é consultado uma vez.
export const requireMarketPage = cache(async (slug: string): Promise<{ market: Market; viewer: Viewer }> => {
  const who = await getViewer();
  if (who.status === "anon") redirect("/login");
  if (who.status !== "ok") redirect("/");

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("*").eq("slug", slug).maybeSingle();
  if (!market) notFound();
  if (!canAccessMarket(who.viewer, market.id)) redirect("/");
  return { market, viewer: who.viewer };
});
