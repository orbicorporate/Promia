import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// Cria um tabloide (nome, categoria, tema, vigência) e já grava os
// produtos selecionados. A planilha não é reenviada aqui: os produtos já
// existem no catálogo do mercado (importados antes), só referenciamos os
// ids escolhidos.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  const name = String(body?.name || "").trim();
  const category = String(body?.category || "").trim() || null;
  const themeId = String(body?.themeId || "").trim() || null;
  const validFrom = body?.validFrom ? String(body.validFrom) : null;
  const validUntil = body?.validUntil ? String(body.validUntil) : null;
  const productIds: string[] = Array.isArray(body?.productIds) ? body.productIds.map(String) : [];

  if (!marketId) return NextResponse.json({ error: "Informe o mercado." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Dê um nome pro tabloide." }, { status: 400 });
  if (productIds.length === 0) return NextResponse.json({ error: "Selecione ao menos um produto." }, { status: 400 });

  const user = await requireMarketAccess(marketId);
  if (!user) return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const admin = createAdminClient();

  const { data: tabloid, error: tabloidError } = await admin
    .from("tabloids")
    .insert({
      market_id: marketId,
      name,
      category,
      theme_id: themeId,
      valid_from: validFrom,
      valid_until: validUntil,
      status: "pronto",
    })
    .select("id")
    .single();

  if (tabloidError || !tabloid) {
    return NextResponse.json({ error: `Erro ao criar tabloide: ${tabloidError?.message}` }, { status: 500 });
  }

  const rows = productIds.map((productId, i) => ({
    tabloid_id: tabloid.id,
    product_id: productId,
    position: i,
  }));

  const { error: itemsError } = await admin.from("tabloid_products").insert(rows);
  if (itemsError) {
    await admin.from("tabloids").delete().eq("id", tabloid.id);
    return NextResponse.json({ error: `Erro ao gravar produtos do tabloide: ${itemsError.message}` }, { status: 500 });
  }

  return NextResponse.json({ id: tabloid.id });
}
