import { NextRequest, NextResponse } from "next/server";
import { isUuid, readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isISODate } from "@/lib/dates";

const MAX_PRODUCTS = 200;

// Cria o tabloide como rascunho com os produtos escolhidos. Ele só vira
// "pronto" quando a renderização dá certo (rota /render). Tudo o que vem
// do navegador é conferido: os produtos e o tema precisam ser deste
// mercado (ou um tema global da plataforma).
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const name = String(body.name ?? "").trim().slice(0, 120);
  const category = String(body.category ?? "").trim().slice(0, 80) || null;
  const themeId = body.themeId;
  const validFrom = body.validFrom ? String(body.validFrom) : null;
  const validUntil = body.validUntil ? String(body.validUntil) : null;
  const productIds = Array.isArray(body.productIds) ? Array.from(new Set(body.productIds.filter(isUuid))) : [];

  if (!name) return NextResponse.json({ error: "Dê um nome pro tabloide." }, { status: 400 });
  if (!isUuid(themeId)) return NextResponse.json({ error: "Escolha um tema." }, { status: 400 });
  if (productIds.length === 0) return NextResponse.json({ error: "Selecione ao menos um produto." }, { status: 400 });
  if (productIds.length > MAX_PRODUCTS) {
    return NextResponse.json({ error: `Um tabloide aceita até ${MAX_PRODUCTS} produtos.` }, { status: 400 });
  }
  if ((validFrom && !isISODate(validFrom)) || (validUntil && !isISODate(validUntil))) {
    return NextResponse.json({ error: "Data de validade inválida." }, { status: 400 });
  }
  if (validFrom && validUntil && validFrom > validUntil) {
    return NextResponse.json({ error: "A data final da validade vem antes da inicial." }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: theme }, { data: owned, error: ownedError }] = await Promise.all([
    admin.from("themes").select("id, market_id").eq("id", themeId).maybeSingle(),
    admin.from("products").select("id").eq("market_id", marketId).in("id", productIds),
  ]);
  if (!theme || (theme.market_id !== null && theme.market_id !== marketId)) {
    return NextResponse.json({ error: "Tema não encontrado." }, { status: 400 });
  }
  if (ownedError) return serverError("tabloides/create", ownedError, "Não consegui conferir os produtos. Tente de novo.");
  if ((owned ?? []).length !== productIds.length) {
    return NextResponse.json({ error: "Alguns produtos selecionados não são deste mercado." }, { status: 400 });
  }

  const { data: tabloid, error: tabloidError } = await admin
    .from("tabloids")
    .insert({
      market_id: marketId,
      name,
      category,
      theme_id: themeId,
      valid_from: validFrom,
      valid_until: validUntil,
      status: "rascunho",
    })
    .select("id")
    .single();
  if (tabloidError || !tabloid) return serverError("tabloides/create", tabloidError, "Não consegui criar o tabloide. Tente de novo.");

  const { error: itemsError } = await admin
    .from("tabloid_products")
    .insert(productIds.map((productId, i) => ({ tabloid_id: tabloid.id, product_id: productId, position: i })));
  if (itemsError) {
    await admin.from("tabloids").delete().eq("id", tabloid.id);
    return serverError("tabloides/create", itemsError, "Não consegui gravar os produtos do tabloide. Tente de novo.");
  }

  return NextResponse.json({ id: tabloid.id });
}
