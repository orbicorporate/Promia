import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findProductImage } from "@/lib/ai/imageSearch";

export const maxDuration = 180;

// Processa em lotes pequenos (10 por chamada) pra não estourar o tempo
// máximo de uma função serverless: o painel chama essa rota repetidamente
// (uma "fila") até não sobrar mais produto pendente.
const BATCH_SIZE = 10;

async function requireMarketAccess(marketId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role, market_id").eq("id", user.id).single();
  if (!profile) return null;
  if (profile.role === "mercado" && profile.market_id !== marketId) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  if (!marketId) return NextResponse.json({ error: "Informe o mercado." }, { status: 400 });

  const user = await requireMarketAccess(marketId);
  if (!user) return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const admin = createAdminClient();
  const { data: pending } = await admin
    .from("products")
    .select("id, name, brand")
    .eq("market_id", marketId)
    .eq("image_status", "pendente")
    .limit(BATCH_SIZE);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0, remaining: 0 });
  }

  for (const product of pending) {
    const result = await findProductImage(product.name, product.brand);
    await admin
      .from("products")
      .update({
        image_url: result.imageUrl,
        image_source_url: result.sourceUrl,
        image_status: result.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);
  }

  const { count: remaining } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("market_id", marketId)
    .eq("image_status", "pendente");

  return NextResponse.json({ processed: pending.length, remaining: remaining ?? 0 });
}
