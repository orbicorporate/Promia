import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { anthropic, GERENTE_MODEL } from "@/lib/ai/models";
import {
  GERENTE_ANALYSIS_SYSTEM_PROMPT,
  GERENTE_STRUCTURE_SYSTEM_PROMPT,
  RECOMMENDATIONS_TOOL,
  extractText,
  normalizeRecommendations,
  promptSafe,
  toolInput,
  weekdayName,
} from "@/lib/ai/gerente";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { seasonalDatesInRange } from "@/lib/seasonalDates";
import { todayInSaoPaulo, addDaysISO } from "@/lib/dates";

export const maxDuration = 120;

const MAX_PRODUCTS = 500;

// Catálogo grande: em vez dos primeiros 500 em ordem alfabética, pega um
// pouco de cada categoria (os com custo e estoque informados primeiro).
function sampleByCategory<T extends { category: string | null; cost: number | null; stock: number | null; price: number | null }>(
  rows: T[],
  max: number
): T[] {
  if (rows.length <= max) return rows;
  const groups = new Map<string, T[]>();
  for (const r of rows) {
    const key = r.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  const score = (r: T) => (r.cost != null ? 2 : 0) + (r.stock != null ? 1 : 0);
  const queues = [...groups.values()].map((g) => g.sort((a, b) => score(b) - score(a) || (b.price ?? 0) - (a.price ?? 0)));
  const out: T[] = [];
  for (let i = 0; out.length < max; i++) {
    let added = false;
    for (const q of queues) {
      if (i < q.length && out.length < max) {
        out.push(q[i]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const client = anthropic();
  if (!client) {
    console.error("[gerente] ANTHROPIC_API_KEY ausente");
    return NextResponse.json({ error: "O gerente ainda não está configurado. Avise o time Promia." }, { status: 503 });
  }

  if ((await remainingToday(marketId, "gerente")) <= 0) {
    return NextResponse.json(
      { error: "O gerente já rodou o máximo de vezes hoje pra esse mercado. Amanhã ele libera de novo." },
      { status: 429 }
    );
  }

  const admin = createAdminClient();

  type Row = { name: string; brand: string | null; category: string | null; price: number | null; cost: number | null; stock: number | null; unit: string | null };
  async function loadCatalog() {
    const all: Row[] = [];
    for (let from = 0; from < 5000; from += 1000) {
      const { data, error } = await admin
        .from("products")
        .select("name, brand, category, price, cost, stock, unit")
        .eq("market_id", marketId)
        .eq("active", true)
        .order("name")
        .range(from, from + 999);
      if (error || !data) break;
      all.push(...data);
      if (data.length < 1000) break;
    }
    return all;
  }

  const [{ data: market }, catalog, { data: weekly }] = await Promise.all([
    admin.from("markets").select("name, niche").eq("id", marketId).single(),
    loadCatalog(),
    admin.from("weekly_promotions").select("weekday, name, category_hint").eq("market_id", marketId).eq("active", true),
  ]);
  const count = catalog.length;
  const products = sampleByCategory(catalog, MAX_PRODUCTS);

  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });
  if (products.length === 0) {
    return NextResponse.json({ error: "Esse mercado ainda não tem produtos. Importe a planilha primeiro." }, { status: 400 });
  }

  const today = todayInSaoPaulo();
  const upcomingDates = seasonalDatesInRange(today, addDaysISO(today, 30))
    .map((d) => `${d.date}: ${d.title}`)
    .join("\n");
  const weeklyText = (weekly ?? [])
    .map((w) => `${weekdayName(w.weekday)}: ${promptSafe(w.name)}${w.category_hint ? ` (${promptSafe(w.category_hint)})` : ""}`)
    .join("\n");

  const catalogText = products
    .map((p) =>
      [
        `- ${promptSafe(p.name)}${p.brand ? ` (${promptSafe(p.brand)})` : ""}`,
        `categoria: ${promptSafe(p.category) || "sem categoria"}`,
        `preço: ${p.price != null ? `R$ ${p.price}` : "?"}${p.unit ? `/${p.unit}` : ""}`,
        p.cost != null ? `custo: R$ ${p.cost}` : null,
        p.stock != null ? `estoque: ${p.stock}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
    )
    .join("\n");

  const total = count ?? products.length;
  const analysisPrompt = [
    `Mercado: ${promptSafe(market.name)}${market.niche ? ` (nicho: ${promptSafe(market.niche)})` : ""}. Hoje: ${today}.`,
    `<datas>\n${upcomingDates || "nenhuma data relevante nos próximos 30 dias"}\n</datas>`,
    `<promocoes_fixas>\n${weeklyText || "nenhuma cadastrada"}\n</promocoes_fixas>`,
    `<catalogo total="${total}" enviados="${products.length}">\n${catalogText}\n</catalogo>`,
  ].join("\n\n");

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
      max_tokens: 3000,
      system: GERENTE_STRUCTURE_SYSTEM_PROMPT,
      tools: [RECOMMENDATIONS_TOOL],
      tool_choice: { type: "tool", name: RECOMMENDATIONS_TOOL.name },
      messages: [
        {
          role: "user",
          content: `<analise>\n${analysis}\n</analise>\n\n<datas>\n${upcomingDates || "nenhuma"}\n</datas>\n\n<promocoes_fixas>\n${weeklyText || "nenhuma"}\n</promocoes_fixas>`,
        },
      ],
    });

    await recordUsage(marketId, access.viewer.userId, "gerente", 1);

    const recommendations = normalizeRecommendations(toolInput(structureResponse.content));
    if (recommendations.length === 0) {
      return NextResponse.json({ error: "O gerente não conseguiu montar recomendações dessa vez. Tente de novo." }, { status: 422 });
    }

    const runId = crypto.randomUUID();
    const generatedAt = new Date().toISOString();
    const { error: insertError } = await admin.from("ai_recommendations").insert(
      recommendations.map((r) => ({ ...r, market_id: marketId, run_id: runId, generated_at: generatedAt }))
    );
    if (insertError) {
      console.error("[gerente] gravar", insertError);
      return NextResponse.json({ recommendations, warning: "As recomendações não ficaram salvas. Elas somem ao recarregar a página." });
    }

    return NextResponse.json({ recommendations, runId });
  } catch (err) {
    console.error("[gerente]", err);
    return NextResponse.json({ error: "O gerente não respondeu agora. Tente de novo em alguns minutos." }, { status: 502 });
  }
}
