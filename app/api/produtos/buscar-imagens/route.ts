import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { findProductImage, mapWithConcurrency } from "@/lib/ai/imageSearch";
import { recordUsage, remainingToday } from "@/lib/ai/usage";

export const maxDuration = 180;

const BATCH_SIZE = 10;
const CONCURRENCY = 5;

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

  const results = await mapWithConcurrency(claimed, CONCURRENCY, async (p) => {
    const result = await findProductImage({ name: p.name, brand: p.brand, ean: p.ean });
    if (result.status === "erro") {
      // falha temporária da IA: o produto volta pra fila, sem perder a vez
      await admin.from("products").update({ image_claimed_at: null }).eq("id", p.id).eq("market_id", marketId);
      return result.status;
    }
    const { error: updateError } = await admin
      .from("products")
      .update({
        image_url: result.imageUrl,
        image_source_url: result.sourceUrl,
        image_status: result.status,
        image_claimed_at: null,
      })
      .eq("id", p.id)
      .eq("market_id", marketId);
    if (updateError) console.error("[buscar-imagens] gravar", updateError);
    return result.status;
  });

  const failed = results.filter((s) => s === "erro").length;
  const processed = claimed.length - failed;
  await recordUsage(marketId, access.viewer.userId, "busca_imagem", processed);

  if (processed === 0) {
    return NextResponse.json(
      { error: "A busca de fotos está indisponível agora. Tente de novo em alguns minutos.", remaining: await countPending() },
      { status: 503 }
    );
  }

  return NextResponse.json({
    processed,
    found: results.filter((s) => s === "encontrada").length,
    remaining: await countPending(),
  });
}
