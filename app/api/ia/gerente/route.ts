import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  gerenteClient,
  GERENTE_MODEL,
  GERENTE_ANALYSIS_SYSTEM_PROMPT,
  GERENTE_STRUCTURE_SYSTEM_PROMPT,
  extractText,
  parseRecommendations,
} from "@/lib/ai/gerente";
import { seasonalDatesInRange } from "@/lib/seasonalDates";

export const maxDuration = 120;

async function requireMarketAccess(marketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, market_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  // dono do mercado só acessa o próprio mercado; time interno acessa qualquer um
  if (profile.role === "mercado" && profile.market_id !== marketId) return null;

  return user;
}

// Roda o gerente inteligente pro mercado: etapa 1 analisa o catálogo em
// texto livre, etapa 2 estrutura em recomendações, e o resultado é
// persistido em ai_recommendations pra aparecer no painel sem precisar
// rodar de novo a cada carregamento de tela.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  if (!marketId) {
    return NextResponse.json({ error: "Informe o mercado." }, { status: 400 });
  }

  const user = await requireMarketAccess(marketId);
  if (!user) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const client = gerenteClient();
  if (!client) {
    return NextResponse.json({ error: "Gerente ainda não configurado (falta ANTHROPIC_API_KEY)." }, { status: 500 });
  }

  const admin = createAdminClient();

  const { data: market } = await admin.from("markets").select("name, niche").eq("id", marketId).single();
  if (!market) {
    return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });
  }

  const { data: products } = await admin
    .from("products")
    .select("name, brand, category, price, cost, stock")
    .eq("market_id", marketId)
    .limit(500);

  if (!products || products.length === 0) {
    return NextResponse.json({ error: "Esse mercado ainda não tem produtos cadastrados." }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const in30days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const upcomingDates = seasonalDatesInRange(today, in30days)
    .map((d) => `${d.date}: ${d.title}`)
    .join("\n");

  const catalogText = products
    .map(
      (p) =>
        `- ${p.name}${p.brand ? ` (${p.brand})` : ""} | categoria: ${p.category || "sem categoria"} | preço: R$ ${p.price ?? "?"}${
          p.cost != null ? ` | custo: R$ ${p.cost}` : ""
        }${p.stock != null ? ` | estoque: ${p.stock}` : ""}`
    )
    .join("\n");

  const analysisPrompt = `Mercado: ${market.name}${market.niche ? ` (nicho: ${market.niche})` : ""}.\n\nDatas comemorativas nos próximos 30 dias:\n${upcomingDates || "nenhuma relevante"}\n\nCatálogo (até 500 produtos):\n${catalogText}`;

  try {
    const analysisResponse = await client.messages.create({
      model: GERENTE_MODEL,
      max_tokens: 4000,
      system: GERENTE_ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: analysisPrompt }],
    });
    const analysis = extractText(analysisResponse.content);

    const structureResponse = await client.messages.create({
      model: GERENTE_MODEL,
      max_tokens: 4000,
      system: GERENTE_STRUCTURE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Análise:\n${analysis}\n\nContexto de época:\n${upcomingDates || "nenhuma data relevante nos próximos 30 dias"}` }],
    });
    const raw = extractText(structureResponse.content);
    const recommendations = parseRecommendations(raw);

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json({ error: "O gerente não conseguiu gerar recomendações dessa vez." }, { status: 422 });
    }

    const rows = recommendations.map((r) => ({
      market_id: marketId,
      type: r.type,
      target: r.target,
      reason: r.reason,
      priority: r.priority,
      generated_at: new Date().toISOString(),
    }));

    await admin.from("ai_recommendations").insert(rows);

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: `Erro ao rodar o gerente: ${message}` }, { status: 500 });
  }
}
