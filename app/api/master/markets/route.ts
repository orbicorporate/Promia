import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireMaster() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "master") return null;
  return user;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Cria um novo mercado, e já cria o primeiro login (dono/responsável) pra
// ele, no mesmo padrão do painel master do Nume Calendar: login simples
// (nome, email, senha), sem verificação de email.
export async function POST(req: NextRequest) {
  const user = await requireMaster();
  if (!user) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const niche = String(body?.niche || "").trim() || null;
  const ownerEmail = String(body?.ownerEmail || "").trim();
  const ownerPassword = String(body?.ownerPassword || "").trim();
  const ownerName = String(body?.ownerName || "").trim() || null;

  if (!name) return NextResponse.json({ error: "Informe o nome do mercado." }, { status: 400 });
  if (!ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "Informe email e senha do responsável pelo mercado." }, { status: 400 });
  }

  const admin = createAdminClient();
  const baseSlug = slugify(name) || "mercado";

  let slug = baseSlug;
  for (let i = 1; i < 50; i++) {
    const { data: existing } = await admin.from("markets").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i + 1}`;
  }

  const { data: market, error: marketError } = await admin
    .from("markets")
    .insert({ name, slug, niche })
    .select("id, slug")
    .single();

  if (marketError || !market) {
    return NextResponse.json({ error: `Erro ao criar mercado: ${marketError?.message}` }, { status: 500 });
  }

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    await admin.from("markets").delete().eq("id", market.id);
    return NextResponse.json({ error: `Erro ao criar login do responsável: ${authError?.message}` }, { status: 500 });
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    role: "mercado",
    market_id: market.id,
    full_name: ownerName,
    email: ownerEmail,
  });

  if (profileError) {
    return NextResponse.json({ error: `Erro ao criar perfil do responsável: ${profileError.message}` }, { status: 500 });
  }

  return NextResponse.json({ market });
}
