import { createAdminClient } from "@/lib/supabase/admin";

// Limite diário de uso de IA por mercado, pra um clique repetido (ou um
// usuário mal-intencionado) não virar uma conta alta. Os números são
// propositalmente folgados pro uso normal e ficam num lugar só.
export const DAILY_LIMITS = {
  gerente: 10, // rodadas do gerente por dia
  busca_imagem: 1500, // produtos buscados por dia
  campanha: 30, // campanhas completas geradas por dia
  pautas: 10, // calendários de pautas por dia
  concorrencia: 40, // encartes de concorrente lidos por dia
  bairro: 5, // análises de bairro por dia
  vendas: 20, // análises de vendas por dia
} as const;

export type UsageKind = keyof typeof DAILY_LIMITS;

export async function usedToday(marketId: string, kind: UsageKind): Promise<number> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from("ai_usage")
    .select("units")
    .eq("market_id", marketId)
    .eq("kind", kind)
    .gte("created_at", since);
  if (error) {
    console.error("[usage] leitura", error);
    return 0;
  }
  return (data ?? []).reduce((sum, r) => sum + (r.units ?? 0), 0);
}

export async function remainingToday(marketId: string, kind: UsageKind): Promise<number> {
  return Math.max(0, DAILY_LIMITS[kind] - (await usedToday(marketId, kind)));
}

export async function recordUsage(marketId: string, userId: string, kind: UsageKind, units: number) {
  if (units <= 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("ai_usage").insert({ market_id: marketId, user_id: userId, kind, units });
  if (error) console.error("[usage] registro", error);
}
