import { NextResponse } from "next/server";
import { canAccessMarket, getViewer, isUuid } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function loadOwnedProduct(id: string) {
  if (!isUuid(id)) return { error: NextResponse.json({ error: "Produto não encontrado." }, { status: 404 }) };
  const who = await getViewer();
  if (who.status !== "ok") return { error: NextResponse.json({ error: "Sua sessão expirou. Entre de novo." }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id, market_id, name, brand, ean, image_candidates, canonical_name").eq("id", id).maybeSingle();
  if (!product || !canAccessMarket(who.viewer, product.market_id)) {
    return { error: NextResponse.json({ error: "Produto não encontrado." }, { status: 404 }) };
  }
  return { admin, product, viewer: who.viewer };
}

