import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapWithConcurrency } from "@/lib/ai/imageSearch";
import { outcomeToUpdate, resolveProductPhoto } from "@/lib/server/photos";
import { planSearches, type SearchPlan } from "@/lib/photos/plan";
import { serperEnabled } from "@/lib/photos/serper";
import { recordUsage, remainingToday } from "@/lib/ai/usage";

export const maxDuration = 180;

const BATCH_SIZE = 12;
const CONCURRENCY = 6;

// Processa um lote da fila de fotos pendentes. O painel chama de novo até
// zerar. A reserva no banco (claim_pending_images) impede que duas abas
// abertas processem o mesmo produto e paguem a busca duas vezes.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const admin = createAdminClient();
  const countPending = async () => {
    const { count } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("market_id", marketId)
      .eq("image_status", "pendente");
    return count ?? 0;
  };

  const allowance = await remainingToday(marketId, "busca_imagem");
  if (allowance <= 0) {
    return NextResponse.json(
      { error: "Limite diário de busca de fotos atingido. A fila continua de onde parou amanhã.", remaining: await countPending() },
      { status: 429 }
    );
  }

  const { data: claimed, error } = await admin.rpc("claim_pending_images", {
    p_market: marketId,
    p_limit: Math.min(BATCH_SIZE, allowance),
  });
  if (error) {
    console.error("[buscar-imagens] fila", error);
    return NextResponse.json({ error: "Não consegui pegar a fila de fotos. Tente de novo." }, { status: 500 });
  }
  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ processed: 0, remaining: await countPending() });
  }

  // um plano de busca para o lote inteiro (uma chamada de IA), só quando a
  // busca de imagens está ligada; os nomes ganham marca, versão e tamanho
  let plans = new Map<string, SearchPlan>();
  if (serperEnabled()) {
    const { data: cats } = await admin.from("products").select("id, category").in("id", claimed.map((c) => c.id));
    const catOf = new Map((cats ?? []).map((c) => [c.id, c.category]));
    plans = await planSearches(claimed.map((c) => ({ id: c.id, name: c.name, brand: c.brand, category: catOf.get(c.id) ?? null })));
  }

  const results = await mapWithConcurrency(claimed, CONCURRENCY, async (p) => {
    const outcome = await resolveProductPhoto(admin, marketId, { id: p.id, name: p.name, brand: p.brand, ean: p.ean }, plans.get(p.id));
    if (outcome.status === "erro") {
      // falha temporária da IA: o produto volta pra fila, sem perder a vez
      await admin.from("products").update({ image_claimed_at: null }).eq("id", p.id).eq("market_id", marketId);
      return { status: "erro" as const, usedAi: false };
    }
    const { error: updateError } = await admin.from("products").update(outcomeToUpdate(outcome)).eq("id", p.id).eq("market_id", marketId);
    if (updateError) console.error("[buscar-imagens] gravar", updateError);
    return { status: outcome.status, usedAi: outcome.usedAi };
  });

  const failed = results.filter((r) => r.status === "erro").length;
  const processed = claimed.length - failed;
  // só conta no limite o que de fato usou IA (banco e catálogo são de graça)
  await recordUsage(marketId, access.viewer.userId, "busca_imagem", results.filter((r) => r.usedAi).length);

  if (processed === 0) {
    return NextResponse.json(
      { error: "A busca de fotos está indisponível agora. Tente de novo em alguns minutos.", remaining: await countPending() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    processed,
    found: results.filter((r) => r.status === "encontrada").length,
    remaining: await countPending(),
  });
}
