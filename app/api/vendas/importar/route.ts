import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isISODate } from "@/lib/dates";
import { normalizeSku, SpreadsheetError } from "@/lib/products";
import { parseSalesSpreadsheet } from "@/lib/sales/parse";
import { photoKey } from "@/lib/photos/key";

export const maxDuration = 60;

// POST /api/vendas/importar { marketId, path, fileName, de, ate }
// Lê o relatório de vendas que o navegador subiu para o Storage, liga cada
// linha a um produto do catálogo (código, código de barras ou nome) e grava
// o período. Importar o mesmo período de novo substitui o anterior.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const de = body.de;
  const ate = body.ate;
  if (!isISODate(de) || !isISODate(ate) || de > ate) {
    return NextResponse.json({ error: "Informe o período do relatório: data inicial e final." }, { status: 400 });
  }
  const path = String(body.path ?? "").trim();
  if (!new RegExp(`^${marketId}/[\\w-]+\\.(xlsx|csv)$`).test(path)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie o relatório de novo." }, { status: 400 });
  }

  const admin = createAdminClient();
  const download = await admin.storage.from("imports").download(path);
  await admin.storage.from("imports").remove([path]);
  if (download.error || !download.data) return NextResponse.json({ error: "Não consegui buscar o arquivo enviado. Envie de novo." }, { status: 400 });

  let parsed;
  try {
    parsed = await parseSalesSpreadsheet(await download.data.arrayBuffer(), path);
  } catch (err) {
    if (err instanceof SpreadsheetError) return NextResponse.json({ error: err.message }, { status: 422 });
    return serverError("vendas/ler", err, "Não consegui ler o relatório. Confira se é a planilha certa.");
  }
  if (parsed.rows.length === 0) return NextResponse.json({ error: "O relatório não tem nenhuma linha com venda." }, { status: 422 });

  // liga ao catálogo: código interno, código de barras, depois nome
  const { data: products } = await admin.from("products").select("id, sku, ean, name, brand").eq("market_id", marketId).limit(20000);
  const bySku = new Map<string, string>();
  const byEan = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const p of products ?? []) {
    if (p.sku) bySku.set(normalizeSku(p.sku) ?? p.sku, p.id);
    if (p.ean) byEan.set(p.ean, p.id);
    byName.set(photoKey(p.name), p.id);
    byName.set(photoKey(p.name, p.brand), p.id);
  }
  const productIdFor = (r: (typeof parsed.rows)[number]) => (r.ean && byEan.get(r.ean)) || (r.sku && bySku.get(r.sku)) || byName.get(photoKey(r.name)) || null;

  // mesmo período de novo: substitui
  await admin.from("sales_imports").delete().eq("market_id", marketId).eq("period_start", de).eq("period_end", ate);

  const rows = parsed.rows.map((r) => ({ ...r, product_id: productIdFor(r) }));
  const matched = rows.filter((r) => r.product_id).length;
  const { data: imp, error: impErr } = await admin
    .from("sales_imports")
    .insert({ market_id: marketId, file_name: String(body.fileName ?? "").slice(0, 200) || null, period_start: de, period_end: ate, rows: rows.length, matched, created_by: access.viewer.userId })
    .select("id")
    .single();
  if (impErr || !imp) return serverError("vendas/importar", impErr, "Não consegui gravar o relatório. Tente de novo.");

  for (let i = 0; i < rows.length; i += 1000) {
    const { error } = await admin.from("sales_records").insert(
      rows.slice(i, i + 1000).map((r) => ({
        market_id: marketId,
        import_id: imp.id,
        product_id: r.product_id,
        sku: r.sku,
        name: r.name,
        category: r.category,
        period_start: de,
        period_end: ate,
        qty: r.qty,
        revenue: r.revenue,
        cost: r.cost,
      }))
    );
    if (error) {
      await admin.from("sales_imports").delete().eq("id", imp.id);
      return serverError("vendas/gravar", error, "Não consegui gravar as vendas. Tente de novo.");
    }
  }

  return NextResponse.json({ rows: rows.length, matched, skipped: parsed.skipped, columns: parsed.columns });
}
