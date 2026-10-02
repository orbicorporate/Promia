import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeProducts, type ParsedProduct, type ProductField } from "@/lib/products";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 60;

// lote pequeno: a consulta dos códigos existentes vai na URL
const CHUNK = 300;

const OPTIONAL_FIELDS: Exclude<ProductField, "sku" | "name">[] = ["ean", "brand", "category", "price", "cost", "stock", "unit"];

// Grava a lista revisada pelo dono do mercado. Só as colunas que vieram na
// planilha são atualizadas: uma planilha só com código e preço atualiza o
// preço e não apaga custo, estoque nem categoria de quem já existia. A foto
// e o status da foto de produto existente também ficam como estão. A tela
// manda em lotes; o registro da importação vai no último lote.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const products = sanitizeProducts(body.products);
  if (products.length === 0) {
    return NextResponse.json({ error: "Nenhum produto válido pra importar." }, { status: 400 });
  }

  const declared = body.columns && typeof body.columns === "object" ? Object.keys(body.columns) : [];
  // produto que já existe: só atualiza colunas que vieram na planilha (e as
  // que o dono preencheu na revisão). Produto novo: entra com tudo.
  const updateFields = OPTIONAL_FIELDS.filter(
    (f) => declared.includes(f) || ((f === "category" || f === "price") && products.some((p) => p[f] != null))
  );

  const admin = createAdminClient();
  const fullRow = (p: ParsedProduct) => ({
    market_id: marketId,
    sku: p.sku,
    name: p.name,
    ean: p.ean,
    brand: p.brand,
    category: p.category,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit,
    active: true,
  });
  const partialRow = (p: ParsedProduct) => {
    const row: Record<string, unknown> = { market_id: marketId, sku: p.sku, name: p.name, active: true };
    for (const f of updateFields) row[f] = p[f];
    return row as { market_id: string; sku: string; name: string };
  };

  let imported = 0;
  for (let i = 0; i < products.length; i += CHUNK) {
    const chunk = products.slice(i, i + CHUNK);
    const { data: existing, error: lookupError } = await admin
      .from("products")
      .select("sku")
      .eq("market_id", marketId)
      .in("sku", chunk.map((p) => p.sku));
    if (lookupError) return serverError("importar/gravar", lookupError, "Não consegui gravar os produtos. Tente de novo.");

    const existingSkus = new Set((existing ?? []).map((e) => e.sku));
    const toInsert = chunk.filter((p) => !existingSkus.has(p.sku)).map(fullRow);
    const toUpdate = chunk.filter((p) => existingSkus.has(p.sku)).map(partialRow);

    for (const batch of [toInsert, toUpdate]) {
      if (batch.length === 0) continue;
      const { error } = await admin.from("products").upsert(batch, { onConflict: "market_id,sku" });
      if (error) {
        return serverError(
          "importar/gravar",
          error,
          imported > 0
            ? `Gravei ${imported} produtos, mas o resto falhou. Importe de novo (nada se duplica).`
            : "Não consegui gravar os produtos. Tente de novo."
        );
      }
    }
    imported += chunk.length;
  }

  if (body.final === true) {
    const skipped = Array.isArray(body.skippedRows) ? body.skippedRows.slice(0, 500) : [];
    const total = typeof body.totalImported === "number" ? body.totalImported : imported;
    const { error: logError } = await admin.from("product_imports").insert({
      market_id: marketId,
      imported_by: access.viewer.userId,
      file_name: typeof body.fileName === "string" ? body.fileName.slice(0, 200) : null,
      rows_imported: total,
      rows_skipped: skipped.length,
      skipped: skipped as Json,
      columns: (body.columns && typeof body.columns === "object" ? body.columns : null) as Json,
    });
    if (logError) console.error("[importar/gravar] registro", logError);
  }

  return NextResponse.json({ imported });
}
