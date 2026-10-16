import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { limparRodape, type RodapeOpcoes } from "@/lib/encarte/rodape";
import { MEDIA_BUCKET } from "./media";

type Admin = SupabaseClient<Database>;

// Rodapé padrão do mercado: um arquivinho JSON no armazenamento do próprio
// mercado (sem coluna nova no banco). Encarte novo já nasce com ele.
const caminho = (marketId: string) => `${marketId}/config/rodape-padrao.json`;

export async function lerRodapePadrao(admin: Admin, marketId: string): Promise<Partial<RodapeOpcoes> | null> {
  try {
    const { data, error } = await admin.storage.from(MEDIA_BUCKET).download(caminho(marketId));
    if (error || !data) return null;
    const limpo = limparRodape(JSON.parse(await data.text()));
    return Object.keys(limpo).length ? limpo : null;
  } catch {
    return null;
  }
}

export async function gravarRodapePadrao(admin: Admin, marketId: string, rodape: unknown): Promise<boolean> {
  const limpo = limparRodape(rodape);
  const { error } = await admin.storage.from(MEDIA_BUCKET).upload(caminho(marketId), Buffer.from(JSON.stringify(limpo)), { contentType: "application/json", upsert: true, cacheControl: "0" });
  if (error) console.error("[rodape-padrao] gravar", error);
  return !error;
}

export async function apagarRodapePadrao(admin: Admin, marketId: string): Promise<boolean> {
  const { error } = await admin.storage.from(MEDIA_BUCKET).remove([caminho(marketId)]);
  if (error) console.error("[rodape-padrao] apagar", error);
  return !error;
}
