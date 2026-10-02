import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseProductSpreadsheet, SpreadsheetError } from "@/lib/products";

export const maxDuration = 60;

// Lê a planilha que o navegador acabou de subir pro Storage e devolve os
// produtos já normalizados pra revisão. Nada é gravado aqui. O arquivo é
// apagado logo depois da leitura.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const storagePath = String(body.path || "").trim();
  // só arquivos da pasta do próprio mercado, sem subir de pasta
  const validPath = new RegExp(`^${marketId}/[\\w-]+\\.(xlsx|csv)$`);
  if (!validPath.test(storagePath)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie a planilha de novo." }, { status: 400 });
  }

  const admin = createAdminClient();
  try {
    const download = await admin.storage.from("imports").download(storagePath);
    if (download.error || !download.data) {
      console.error("[importar/ler] download", download.error);
      return NextResponse.json({ error: "Não consegui buscar o arquivo enviado. Envie de novo." }, { status: 400 });
    }

    const buffer = await download.data.arrayBuffer();
    const result = await parseProductSpreadsheet(buffer, storagePath);
    if (result.products.length === 0) {
      return NextResponse.json(
        { error: "Achei o cabeçalho, mas nenhuma linha de produto embaixo dele." },
        { status: 422 }
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof SpreadsheetError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[importar/ler]", err);
    return NextResponse.json({ error: "Não consegui ler essa planilha. Confira o arquivo e tente de novo." }, { status: 400 });
  } finally {
    await admin.storage.from("imports").remove([storagePath]);
  }
}
