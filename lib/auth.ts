import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Ponto único de identidade e acesso do Promia (mesmo papel do
// currentStaff() do Nume Calendar). Toda rota de API e toda página passa
// por aqui: as rotas usam o client de service role, que ignora o RLS, então
// é este arquivo que garante que um mercado nunca mexe nos dados de outro.

export type Role = "master" | "mercado";

export type Viewer = {
  userId: string;
  email: string | null;
  role: Role;
  marketId: string | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

// Quem está logado e com qual papel. `null` = não logado. Um usuário logado
// sem perfil (ou com perfil inválido) volta como `{ userId, role: null }`
// pra página poder explicar o problema em vez de cair num loop de login.
export async function getViewer(): Promise<
  { status: "anon" } | { status: "no_profile"; userId: string; email: string | null } | { status: "ok"; viewer: Viewer }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anon" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, market_id")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role === "master" || profile?.role === "mercado" ? (profile.role as Role) : null;
  if (!profile || !role || (role === "mercado" && !profile.market_id)) {
    return { status: "no_profile", userId: user.id, email: user.email ?? null };
  }

  return {
    status: "ok",
    viewer: { userId: user.id, email: user.email ?? null, role, marketId: profile.market_id },
  };
}

export function canAccessMarket(viewer: Viewer, marketId: string): boolean {
  return viewer.role === "master" || viewer.marketId === marketId;
}

type Guard = { ok: true; viewer: Viewer } | { ok: false; response: NextResponse };

function deny(status: number, error: string): Guard {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

// Para rotas de API: exige login e acesso ao mercado informado.
export async function requireMarketAccess(marketId: unknown): Promise<Guard & { marketId?: string }> {
  if (!isUuid(marketId)) return deny(400, "Mercado inválido.");
  const result = await getViewer();
  if (result.status === "anon") return deny(401, "Sua sessão expirou. Entre de novo.");
  if (result.status === "no_profile") return deny(403, "Sua conta ainda não está ligada a nenhum mercado.");
  if (!canAccessMarket(result.viewer, marketId)) return deny(403, "Você não tem acesso a esse mercado.");
  return { ok: true, viewer: result.viewer };
}

// Para rotas de API do painel master.
export async function requireMaster(): Promise<Guard> {
  const result = await getViewer();
  if (result.status === "anon") return deny(401, "Sua sessão expirou. Entre de novo.");
  if (result.status !== "ok" || result.viewer.role !== "master") return deny(403, "Só o time Promia pode fazer isso.");
  return { ok: true, viewer: result.viewer };
}

// Lê o corpo JSON sem derrubar a rota quando vem vazio ou quebrado.
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

// Erro de banco vai pro log com contexto; pro usuário, uma frase clara.
export function serverError(context: string, err: unknown, message: string) {
  console.error(`[${context}]`, err);
  return NextResponse.json({ error: message }, { status: 500 });
}
