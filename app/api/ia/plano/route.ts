import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { anthropic, GERENTE_MODEL } from "@/lib/ai/models";
import { extractText, jsonFromText } from "@/lib/ai/gerente";
import { montarContexto } from "@/lib/ai/chat-contexto";
import { normalizarPlano, PLANO_SYSTEM } from "@/lib/ai/plano";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const client = anthropic();
  if (!client) return NextResponse.json({ error: "A IA ainda não está configurada. Avise o time Promia." }, { status: 503 });
  if ((await remainingToday(marketId, "plano")) <= 0) return NextResponse.json({ error: "Limite de planos de hoje atingido. Amanhã libera de novo." }, { status: 429 });

  const admin = createAdminClient();
  const ctx = await montarContexto(admin, marketId, "geral");
  if (!ctx) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  try {
    const res = await client.messages.create({
      model: GERENTE_MODEL,
      max_tokens: 5000,
      system: PLANO_SYSTEM,
      messages: [{ role: "user", content: `<dados>\n${ctx.dados}\n</dados>\n\nMonte o plano de 4 semanas.` }],
    });
    const plano = normalizarPlano(jsonFromText(extractText(res.content)), ctx.slug);
    if (!plano) return NextResponse.json({ error: "A IA não devolveu um plano completo. Tente de novo." }, { status: 502 });
    await admin.from("market_insights").upsert({ market_id: marketId, kind: "plano", content: plano as unknown as Json, updated_at: new Date().toISOString() }, { onConflict: "market_id,kind" });
    await recordUsage(marketId, access.viewer.userId, "plano", 1);
    return NextResponse.json({ plano });
  } catch (err) {
    if (isAiUnavailable(err)) return NextResponse.json({ error: "A IA está indisponível agora. Tente de novo em alguns minutos." }, { status: 503 });
    console.error("[plano]", err);
    return NextResponse.json({ error: "Não consegui montar o plano agora. Tente de novo." }, { status: 500 });
  }
}
