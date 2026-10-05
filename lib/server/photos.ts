import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import { findProductImage } from "@/lib/ai/imageSearch";
import { photoKey } from "@/lib/photos/key";
import { fallbackPlan, type SearchPlan } from "@/lib/photos/plan";
import { searchImages, serperEnabled, type ImageHit } from "@/lib/photos/serper";
import { judgeCandidates } from "@/lib/photos/judge";
import { storeImageFromUrl } from "./media";

type Admin = SupabaseClient<Database>;

export type PhotoProduct = { id: string; name: string; brand: string | null; ean: string | null };

export type PhotoOutcome =
  | { status: "encontrada"; origin: "banco" | "catalogo" | "web"; imageUrl: string; sourceUrl: string | null; candidates: string[]; usedAi: boolean }
  | { status: "revisar" | "nao_encontrada"; sourceUrl: string | null; candidates: string[]; usedAi: boolean }
  | { status: "erro" };

// Ordem de busca, da mais barata e certeira para a mais cara:
// 1. banco de fotos do Promia pelo código de barras (aprovada antes),
// 2. Open Food Facts (catálogo aberto por código de barras),
// 3. banco de fotos do Promia pelo nome (aprovada por qualquer mercado),
// 4. busca de imagens do Google (Serper) + a IA olhando as miniaturas,
// 5. sem chave do Serper: a busca antiga, por páginas.
export async function resolveProductPhoto(admin: Admin, marketId: string, p: PhotoProduct, plan?: SearchPlan): Promise<PhotoOutcome> {
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

  // memória entre mercados: pelo nome da planilha e pelo nome padrão da IA
  const keys = [...new Set([photoKey(p.name, p.brand), plan?.canonical ? photoKey(plan.canonical) : ""].filter(Boolean))];
  const { data: known } = await admin.from("photo_name_bank").select("image_url, source, approvals").in("key", keys);
  const byName = (known ?? []).sort((a, b) => (b.source === "aprovada" ? 1 : 0) - (a.source === "aprovada" ? 1 : 0) || b.approvals - a.approvals)[0];
  if (byName?.image_url) {
    return { status: "encontrada", origin: "banco", imageUrl: byName.image_url, sourceUrl: null, candidates: [], usedAi: false };
  }

  if (serperEnabled()) {
    const outcome = await searchAndJudge(admin, marketId, p, plan ?? fallbackPlan(p.name, p.brand));
    if (outcome) return outcome;
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

// confiança mínima para aplicar a foto sozinha; abaixo disso vira opção
export const AUTO_APPLY_CONFIDENCE = 0.7;

async function searchAndJudge(admin: Admin, marketId: string, p: PhotoProduct, plan: SearchPlan): Promise<PhotoOutcome | null> {
  const first = await searchOnce(admin, marketId, p, plan, plan.query);
  if (first === null) return null; // Serper fora do ar: segue para a busca antiga
  if (first.status === "encontrada" || !plan.alt) return first;
  // a primeira busca não trouxe a foto certa: tenta a busca alternativa
  const second = await searchOnce(admin, marketId, p, plan, plan.alt);
  if (second?.status === "encontrada") return second;
  // junta as opções das duas, sem repetir
  const merged = [...new Set([...("candidates" in first ? first.candidates : []), ...(second && "candidates" in second ? second.candidates : [])])];
  return { status: merged.length ? "revisar" : "nao_encontrada", sourceUrl: null, candidates: merged.slice(0, 6), usedAi: true };
}

async function searchOnce(admin: Admin, marketId: string, p: PhotoProduct, plan: SearchPlan, query: string): Promise<PhotoOutcome | null> {
  const raw = await searchImages(query);
  if (raw === null) return null;
  // foto pequena demais não serve para encarte
  const hits: ImageHit[] = raw.filter((h) => !h.width || !h.height || Math.min(h.width, h.height) >= 300).slice(0, 8);
  if (hits.length === 0) return { status: "nao_encontrada", sourceUrl: null, candidates: [], usedAi: true };

  const verdict = await judgeCandidates({ name: p.name, brand: p.brand, expect: plan.expect, generic: plan.generic }, hits);
  console.info("[fotos] veredito", JSON.stringify({ produto: p.name, busca: query, melhor: verdict?.best ?? null, confianca: verdict?.confidence ?? null, servem: verdict?.order.length ?? null, fotos: hits.length }));
  const ordered = verdict ? [...verdict.order.map((i) => hits[i]), ...hits.filter((_, i) => !verdict.order.includes(i))] : hits;
  const candidates = ordered.map((h) => h.imageUrl);

  if (verdict && verdict.best !== null && verdict.confidence >= AUTO_APPLY_CONFIDENCE) {
    // tenta copiar a escolhida; se o site bloquear, a próxima que a IA aprovou
    for (const i of verdict.order.slice(0, 5)) {
      const stored = await storeImageFromUrl(admin, `${marketId}/produtos/${p.id}`, hits[i].imageUrl);
      if (stored) {
        // entra na memória com peso de IA: a escolha de um dono sempre prevalece
        await rememberByName(admin, [p.name, plan.canonical], p.brand, stored.url, stored.path, "ia");
        return {
          status: "encontrada",
          origin: "web",
          imageUrl: stored.url,
          sourceUrl: hits[i].imageUrl,
          candidates: candidates.filter((c) => c !== hits[i].imageUrl).slice(0, 6),
          usedAi: true,
        };
      }
    }
    console.info("[fotos] nenhuma aprovada pôde ser copiada", p.name);
  }
  // sem confiança (ou nenhuma serviu): as opções, na ordem da IA, ficam para o dono
  return { status: verdict && verdict.order.length === 0 ? "nao_encontrada" : "revisar", sourceUrl: null, candidates: candidates.slice(0, 6), usedAi: true };
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

// Foto aprovada vira referência pelo nome para todos os mercados, pela chave
// do nome da planilha e pela do nome padrão. Fonte "ia" (aplicada sozinha)
// nunca substitui uma foto que algum dono aprovou.
export async function rememberByName(
  admin: Admin,
  names: (string | null | undefined)[],
  brand: string | null,
  imageUrl: string,
  storagePath: string | null,
  source: "aprovada" | "ia"
) {
  const entries = new Map<string, string>();
  names.forEach((n, i) => {
    if (!n) return;
    const key = i === 0 ? photoKey(n, brand) : photoKey(n);
    if (key) entries.set(key, n);
  });
  for (const [key, label] of entries) {
    const { data: current } = await admin.from("photo_name_bank").select("approvals, source").eq("key", key).maybeSingle();
    if (source === "ia" && current) continue; // já existe: a IA não sobrescreve
    const { error } = await admin.from("photo_name_bank").upsert({
      key,
      label: label.slice(0, 200),
      image_url: imageUrl,
      storage_path: storagePath,
      source,
      approvals: source === "aprovada" ? (current?.approvals ?? 0) + 1 : 0,
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("[photos] banco por nome", error);
  }
}
