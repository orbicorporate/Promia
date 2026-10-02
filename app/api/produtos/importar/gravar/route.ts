import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeProducts } from "@/lib/products";
import type { Json } from "@/lib/supabase/database.types";

export const maxDuration = 60;

const CHUNK = 1000;

// Grava a lista revisada pelo dono do mercado. Reenviar a planilha só
// atualiza preço, custo, estoque e dados de cadastro: a foto e o status da
// foto de produto que já existe ficam como estão (antes, cada reimportação
// zerava as fotos e pagava a busca de novo).
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const products = sanitizeProducts(body.products);
  if (products.length === 0) {
    return NextResponse.json({ error: "Nenhum produto válido pra importar." }, { status: 400 });
  }

  const admin = createAdminClient();
  const rows = products.map((p) => ({
    market_id: marketId,
    sku: p.sku,
    ean: p.ean,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    unit: p.unit,
    active: true,
  }));

  let imported = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await admin.from("products").upsert(chunk, { onConflict: "market_id,sku" });
    if (error) {
      return serverError(
        "importar/gravar",
        error,
        imported > 0
          ? `Gravei ${imported} produtos, mas o resto falhou. Tente importar de novo (nada se duplica).`
          : "Não consegui gravar os produtos. Tente de novo."
      );
    }
    imported += chunk.length;
  }

  const skipped = Array.isArray(body.skippedRows) ? body.skippedRows.slice(0, 500) : [];
  const { error: logError } = await admin.from("product_imports").insert({
    market_id: marketId,
    imported_by: access.viewer.userId,
    file_name: typeof body.fileName === "string" ? body.fileName.slice(0, 200) : null,
    rows_imported: imported,
    rows_skipped: skipped.length,
    skipped: skipped as Json,
    columns: (body.columns && typeof body.columns === "object" ? body.columns : null) as Json,
  });
  if (logError) console.error("[importar/gravar] registro", logError);

  return NextResponse.json({ imported });
}
