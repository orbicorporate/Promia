import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, loadAuthorizedEncarte } from "@/lib/encarte/http";
import { generateCampaign, normalizeCampaign } from "@/lib/ai/campaign";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import { todayInSaoPaulo } from "@/lib/dates";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 120;

// GET: a campanha já gerada para este encarte (ou null).
export async function GET(_req: Request, { params }: RouteContext<"/api/encartes/[id]/campanha">) {
  const { id } = await params;
  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data } = await createAdminClient().from("campaigns").select("content").eq("tabloid_id", id).maybeSingle();
  return NextResponse.json({ campaign: data ? normalizeCampaign(data.content) : null });
}

// POST: gera (ou refaz) a campanha completa com a IA.
export async function POST(_req: Request, { params }: RouteContext<"/api/encartes/[id]/campanha">) {
  const { id } = await params;
  const auth = await loadAuthorizedEncarte(id);
  if (!auth.ok) return auth.response;
  const { data, marketId } = auth.loaded;
  if (data.items.length === 0) return jsonError(400, "Coloque produtos com preço no encarte antes de criar a campanha.");

  if ((await remainingToday(marketId, "campanha")) <= 0) {
    return jsonError(429, "Limite de campanhas de hoje atingido. Amanhã libera de novo.");
  }
  const who = await getViewer();
  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("niche").eq("id", marketId).maybeSingle();

  try {
    const campaign = await generateCampaign(data, { today: todayInSaoPaulo(), niche: market?.niche ?? null });
    if (!campaign) return jsonError(502, "A IA não devolveu uma campanha completa. Tente de novo.");
    const { error } = await admin
      .from("campaigns")
      .upsert(
        { market_id: marketId, tabloid_id: id, content: campaign as unknown as Json, created_by: who.status === "ok" ? who.viewer.userId : null, updated_at: new Date().toISOString() },
        { onConflict: "tabloid_id" }
      );
    if (error) console.error("[campanha] gravar", error);
    if (who.status === "ok") await recordUsage(marketId, who.viewer.userId, "campanha", 1);
    return NextResponse.json({ campaign });
  } catch (err) {
    if (isAiUnavailable(err)) return jsonError(503, "A IA está indisponível agora. Tente de novo em alguns minutos.");
    console.error("[campanha]", err);
    return jsonError(500, "Não consegui criar a campanha agora. Tente de novo.");
  }
}
