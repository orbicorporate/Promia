import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseProductSpreadsheet } from "@/lib/products";

export const maxDuration = 60;

async function requireTeamMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "master" && profile.role !== "mercado")) return null;
  return user;
}

// Recebe o caminho de um arquivo já enviado pro Storage (planilha de
// produtos), baixa do lado do servidor (sem limite de tamanho de body da
// Vercel) e devolve a lista já normalizada pra revisão antes de gravar no
// banco. Nenhuma IA entra nessa etapa: planilha estruturada dá pra ler
// direto (ver lib/products.ts), a IA é usada só depois, no gerente
// inteligente e na busca de imagem.
export async function POST(req: NextRequest) {
  const user = await requireTeamMember();
  if (!user) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  const storagePath = String(body?.path || "").trim();

  if (!marketId) return NextResponse.json({ error: "Informe o mercado." }, { status: 400 });
  if (!storagePath) return NextResponse.json({ error: "Envie um arquivo." }, { status: 400 });

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("id").eq("id", marketId).single();
  if (!market) return NextResponse.json({ error: "Mercado não encontrado." }, { status: 404 });

  const download = await admin.storage.from("imports").download(storagePath);
  if (download.error || !download.data) {
    return NextResponse.json(
      { error: `Não consegui buscar o arquivo enviado: ${download.error?.message || "erro desconhecido"}` },
      { status: 400 }
    );
  }

  const ext = storagePath.toLowerCase();
  if (!ext.endsWith(".xlsx") && !ext.endsWith(".csv") && !ext.endsWith(".xls")) {
    await admin.storage.from("imports").remove([storagePath]);
    return NextResponse.json({ error: "Formato não suportado. Envie um .xlsx ou .csv." }, { status: 400 });
  }

  try {
    const buffer = await download.data.arrayBuffer();
    const { products, skippedRows } = await parseProductSpreadsheet(buffer, storagePath);

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Não consegui identificar produtos nessa planilha. Confira se tem uma coluna de nome/produto." },
        { status: 422 }
      );
    }

    return NextResponse.json({ products, skippedRows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ error: `Não consegui ler a planilha: ${message}` }, { status: 400 });
  } finally {
    await admin.storage.from("imports").remove([storagePath]);
  }
}
