import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { findProductImage } from "@/lib/ai/imageSearch";
import { storeImageFromUrl } from "./media";

type Admin = SupabaseClient<Database>;

export type PhotoProduct = { id: string; name: string; brand: string | null; ean: string | null };

export type PhotoOutcome =
  | { status: "encontrada"; origin: "banco" | "catalogo" | "web"; imageUrl: string; sourceUrl: string | null; candidates: string[]; usedAi: boolean }
  | { status: "revisar" | "nao_encontrada"; sourceUrl: string | null; candidates: string[]; usedAi: boolean }
  | { status: "erro" };

// Ordem de busca, da mais barata e certeira para a mais cara:
// 1. banco de fotos do Promia (mesmo código de barras, aprovado antes),
// 2. Open Food Facts (catálogo aberto por código de barras),
// 3. busca na web com IA.
export async function resolveProductPhoto(admin: Admin, marketId: string, p: PhotoProduct): Promise<PhotoOutcome> {
  if (p.ean) {
    const { data: bank } = await admin.from("photo_bank").select("image_url").eq("ean", p.ean).maybeSingle();
    if (bank?.image_url) {
      return { status: "encontrada", origin: "banco", imageUrl: bank.image_url, sourceUrl: null, candidates: [], usedAi: false };
    }
    const off = await openFoodFactsImage(p.ean);
    if (off) {
      const stored = await storeImageFromUrl(admin, `${marketId}/produtos/${p.id}`, off);
      if (stored) {
        await rememberInBank(admin, p.ean, stored.url, stored.path, "catalogo");
        return { status: "encontrada", origin: "catalogo", imageUrl: stored.url, sourceUrl: off, candidates: [], usedAi: false };
      }
    }
  }

  const found = await findProductImage({ name: p.name, brand: p.brand, ean: p.ean });
  if (found.status === "erro") return { status: "erro" };
  if (found.status === "encontrada" && found.imageUrl) {
    const stored = await storeImageFromUrl(admin, `${marketId}/produtos/${p.id}`, found.imageUrl);
    if (stored) {
      return { status: "encontrada", origin: "web", imageUrl: stored.url, sourceUrl: found.sourceUrl, candidates: found.candidates, usedAi: true };
    }
    // não deu pra copiar: as opções ficam para o dono escolher
    return { status: "revisar", sourceUrl: found.sourceUrl, candidates: [found.imageUrl, ...found.candidates], usedAi: true };
  }
  return { status: found.status === "nao_encontrada" ? "nao_encontrada" : "revisar", sourceUrl: found.sourceUrl, candidates: found.candidates, usedAi: true };
}

export async function openFoodFactsImage(ean: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json?fields=image_front_url,image_url`, {
      signal: controller.signal,
      headers: { "user-agent": "Promia/1.0 (https://promia.vercel.app)" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { status?: number; product?: { image_front_url?: string; image_url?: string } };
    const url = json.product?.image_front_url || json.product?.image_url;
    return url && url.startsWith("https://") ? url : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Foto aprovada (ou de catálogo) vira referência para o mesmo EAN em
// todos os mercados.
export async function rememberInBank(admin: Admin, ean: string, imageUrl: string, storagePath: string | null, source: string) {
  const { data: current } = await admin.from("photo_bank").select("approvals").eq("ean", ean).maybeSingle();
  const { error } = await admin.from("photo_bank").upsert({
    ean,
    image_url: imageUrl,
    storage_path: storagePath,
    source,
    approvals: (current?.approvals ?? 0) + 1,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[photos] banco", error);
}

export function outcomeToUpdate(o: Exclude<PhotoOutcome, { status: "erro" }>) {
  return {
    image_status: o.status,
    image_url: o.status === "encontrada" ? o.imageUrl : null,
    image_origin: o.status === "encontrada" ? o.origin : null,
    image_source_url: o.sourceUrl,
    image_candidates: (o.candidates.length ? o.candidates.slice(0, 6) : null) as Json,
    image_claimed_at: null,
  };
}
