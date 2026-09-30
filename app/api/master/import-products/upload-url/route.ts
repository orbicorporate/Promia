import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// A Vercel rejeita (413) requisições cujo corpo passe de ~4.5MB antes mesmo
// de chegar na função — por isso o upload vai direto pro Supabase Storage
// via URL assinada, sem passar pelo corpo da nossa API route (mesmo
// esquema usado pro import de cronograma no Nume Calendar).
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "master" && profile.role !== "mercado")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const marketId = String(body?.marketId || "").trim();
  const fileName = String(body?.fileName || "").trim();
  if (!marketId || !fileName) {
    return NextResponse.json({ error: "Informe o mercado e o arquivo." }, { status: 400 });
  }

  const lower = fileName.toLowerCase();
  const ext = lower.endsWith(".xlsx") ? "xlsx" : lower.endsWith(".csv") ? "csv" : lower.endsWith(".xls") ? "xls" : null;
  if (!ext) {
    return NextResponse.json({ error: "Formato não suportado. Envie um .xlsx ou .csv." }, { status: 400 });
  }

  const admin = createAdminClient();
  const path = `${marketId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await admin.storage.from("imports").createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: `Não consegui preparar o upload: ${error?.message || "erro desconhecido"}` }, { status: 500 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}
