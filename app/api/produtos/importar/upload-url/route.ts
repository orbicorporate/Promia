import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// A Vercel recusa (413) corpos acima de ~4,5 MB antes de chegar na função,
// então a planilha vai direto pro Storage por URL assinada. O caminho
// sempre começa com o id do mercado: é isso que a rota de leitura confere.
export async function POST(req: NextRequest) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;

  const fileName = String(body.fileName || "").trim().toLowerCase();
  const ext = fileName.endsWith(".xlsx") ? "xlsx" : fileName.endsWith(".csv") ? "csv" : null;
  if (fileName.endsWith(".xls")) {
    return NextResponse.json(
      { error: "Arquivos .xls (Excel antigo) não são lidos. Abra no Excel e salve como .xlsx, ou exporte em .csv." },
      { status: 400 }
    );
  }
  if (!ext) return NextResponse.json({ error: "Formato não suportado. Envie .xlsx ou .csv." }, { status: 400 });

  const admin = createAdminClient();
  const path = `${marketId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { data, error } = await admin.storage.from("imports").createSignedUploadUrl(path);
  if (error || !data) return serverError("importar/upload-url", error, "Não consegui preparar o envio. Tente de novo.");

  return NextResponse.json({ path: data.path, token: data.token });
}
