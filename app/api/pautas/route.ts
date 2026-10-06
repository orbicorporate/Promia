import { NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContentPlan } from "@/lib/ai/pautas";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import { addDaysISO, todayInSaoPaulo } from "@/lib/dates";
import { upcomingOccasions } from "@/lib/occasions";
import { forecastForCity } from "@/lib/weather";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 120;

// POST /api/pautas { marketId }: gera o calendário de pautas dos próximos 30 dias.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  if ((await remainingToday(marketId, "pautas")) <= 0) {
    return NextResponse.json({ error: "Limite de calendários de hoje atingido. Amanhã libera de novo." }, { status: 429 });
  }

  const admin = createAdminClient();
  const de = todayInSaoPaulo();
  const ate = addDaysISO(de, 29);
  const [{ data: market }, { data: weekly }, { data: cats }] = await Promise.all([
    admin.from("markets").select("name, city, niche, tagline").eq("id", marketId).single(),
    admin.from("weekly_promotions").select("weekday, name, category_hint, active").eq("market_id", marketId),
    admin.from("products").select("category").eq("market_id", marketId).eq("active", true).not("category", "is", null).limit(5000),
  ]);
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });
  const counts = new Map<string, number>();
  for (const c of cats ?? []) if (c.category) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([name, count]) => ({ name, count }));
  const weather = await forecastForCity(market.city, 16);

  try {
    const plan = await generateContentPlan({
      market,
      de,
      ate,
      occasions: upcomingOccasions(de, weekly ?? [], 30).filter((o) => o.kind === "data"),
      weekly: (weekly ?? []).filter((w) => w.active),
      categories,
      weather,
    });
    if (!plan) return NextResponse.json({ error: "A IA não devolveu um calendário completo. Tente de novo." }, { status: 502 });
    const month = de.slice(0, 7);
    const { error } = await admin
      .from("content_plans")
      .upsert({ market_id: marketId, month, content: plan as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "market_id,month" });
    if (error) console.error("[pautas] gravar", error);
    await recordUsage(marketId, access.viewer.userId, "pautas", 1);
    return NextResponse.json({ plan });
  } catch (err) {
    if (isAiUnavailable(err)) return NextResponse.json({ error: "A IA está indisponível agora. Tente de novo em alguns minutos." }, { status: 503 });
    console.error("[pautas]", err);
    return NextResponse.json({ error: "Não consegui montar o calendário agora. Tente de novo." }, { status: 500 });
  }
}
