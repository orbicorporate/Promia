import { createAdminClient } from "@/lib/supabase/admin";
import { MEDIA_BUCKET, publicUrl } from "@/lib/server/media";

export type Arquivo = { path: string; nome: string; url: string; criadoEm: string };
export const MAX_ARQUIVOS = 60;

// Imagens que o mercado enviou em Biblioteca, Meus arquivos (ficam no Storage, sem tabela).
export async function listarArquivos(marketId: string): Promise<Arquivo[]> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(MEDIA_BUCKET).list(`${marketId}/arquivos`, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  return (data ?? [])
    .filter((f) => /\.(png|jpe?g|gif)$/i.test(f.name))
    .map((f) => {
      const path = `${marketId}/arquivos/${f.name}`;
      return { path, nome: f.name, url: publicUrl(admin, path), criadoEm: f.created_at ?? "" };
    });
}
