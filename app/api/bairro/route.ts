import { NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { scanSurroundings } from "@/lib/competition/surroundings";
import { generateBairro } from "@/lib/ai/bairro";
import { loadSalesAnalysis } from "@/lib/sales/load";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 120;

// POST /api/bairro { marketId }: levanta o entorno e gera o plano de público.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  if ((await remainingToday(marketId, "bairro")) <= 0) {
    return NextResponse.json({ error: "Limite de análises de bairro de hoje atingido. Amanhã libera de novo." }, { status: 429 });
  }
  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("name, address, city, niche").eq("id", marketId).single();
  const location = [market?.address, market?.city].filter(Boolean).join(", ");
  if (!market || !location) return NextResponse.json({ error: "Coloque o endereço e a cidade do mercado em Mercado para analisar o bairro." }, { status: 400 });

  const [entorno, sales, { data: competitors }, { data: cats }] = await Promise.all([
    scanSurroundings(location),
    loadSalesAnalysis(admin, marketId),
    admin.from("competitors").select("name, rating, reviews").eq("market_id", marketId).limit(10),
    admin.from("products").select("category").eq("market_id", marketId).eq("active", true).not("category", "is", null).limit(5000),
  ]);
  if (!entorno) return NextResponse.json({ error: "A busca do entorno está indisponível agora. Tente de novo." }, { status: 503 });
  const catalogCategories = [...new Set((cats ?? []).map((c) => c.category!).filter(Boolean))].slice(0, 40);

  try {
    const insight = await generateBairro({
      market,
      entorno,
      categories: sales.analysis?.categories.map((c) => ({ name: c.name, share: c.share })) ?? [],
      topProducts: sales.analysis?.top.map((t) => t.name) ?? [],
      competitors: (competitors ?? []).map((c) => ({ ...c, rating: c.rating == null ? null : Number(c.rating) })),
      catalogCategories,
    });
    if (!insight) return NextResponse.json({ error: "A IA não devolveu uma análise completa. Tente de novo." }, { status: 502 });
    await admin.from("market_insights").upsert({ market_id: marketId, kind: "bairro", content: insight as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "market_id,kind" });
    await recordUsage(marketId, access.viewer.userId, "bairro", 1);
    return NextResponse.json({ insight });
  } catch (err) {
    if (isAiUnavailable(err)) return NextResponse.json({ error: "A IA está indisponível agora. Tente de novo em alguns minutos." }, { status: 503 });
    console.error("[bairro]", err);
    return NextResponse.json({ error: "Não consegui analisar o bairro agora. Tente de novo." }, { status: 500 });
  }
}
