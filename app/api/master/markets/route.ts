import { NextRequest, NextResponse } from "next/server";
import { readJson, requireMaster, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

const RESERVED_SLUGS = new Set(["api", "login", "master", "sair", "conta", "_next"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Cria um mercado e o login do responsável. Se qualquer passo falhar, o que
// já foi criado é desfeito (antes sobravam mercado e login órfãos).
export async function POST(req: NextRequest) {
  const access = await requireMaster();
  if (!access.ok) return access.response;

  const body = await readJson(req);
  const name = String(body.name ?? "").trim().slice(0, 120);
  const niche = String(body.niche ?? "").trim().slice(0, 120) || null;
  const ownerEmail = String(body.ownerEmail ?? "").trim().toLowerCase();
  const ownerPassword = String(body.ownerPassword ?? "");
  const ownerName = String(body.ownerName ?? "").trim().slice(0, 120) || null;

  if (!name) return NextResponse.json({ error: "Informe o nome do mercado." }, { status: 400 });
  if (!EMAIL_RE.test(ownerEmail)) return NextResponse.json({ error: "Email do responsável inválido." }, { status: 400 });
  if (ownerPassword.length < 8) {
    return NextResponse.json({ error: "A senha do responsável precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const admin = createAdminClient();
  const baseSlug = slugify(name) || "mercado";
  let slug = RESERVED_SLUGS.has(baseSlug) ? `${baseSlug}-mercado` : baseSlug;
  for (let i = 2; i < 60; i++) {
    const { data: existing } = await admin.from("markets").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const { data: market, error: marketError } = await admin
    .from("markets")
    .insert({ name, slug, niche })
    .select("id, slug")
    .single();
  if (marketError || !market) return serverError("markets", marketError, "Não consegui criar o mercado. Tente de novo.");

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: ownerEmail,
    password: ownerPassword,
    email_confirm: true,
    user_metadata: ownerName ? { full_name: ownerName } : undefined,
  });
  if (authError || !authUser.user) {
    await admin.from("markets").delete().eq("id", market.id);
    const exists = authError?.message?.toLowerCase().includes("already");
    console.error("[markets] auth", authError);
    return NextResponse.json(
      { error: exists ? "Já existe um login com esse email." : "Não consegui criar o login do responsável." },
      { status: exists ? 409 : 500 }
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    role: "mercado",
    market_id: market.id,
    full_name: ownerName,
    email: ownerEmail,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    await admin.from("markets").delete().eq("id", market.id);
    return serverError("markets", profileError, "Não consegui criar o perfil do responsável. Nada foi salvo, tente de novo.");
  }

  return NextResponse.json({ market });
}
