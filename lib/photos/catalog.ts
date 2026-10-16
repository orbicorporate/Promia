import type { ImageHit } from "./serper";

// Open Food Facts por nome (catálogo aberto, sem chave): fotos de embalagem
// de produtos vendidos no Brasil. Último recurso antes de deixar para revisão.
export async function searchOpenFoodFacts(q: string, { timeoutMs = 7000 } = {}): Promise<ImageHit[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?" +
      new URLSearchParams({
        search_terms: q,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: "8",
        fields: "product_name,brands,image_front_url",
        tagtype_0: "countries",
        tag_contains_0: "contains",
        tag_0: "brazil",
      }).toString();
    const res = await fetch(url, { signal: controller.signal, headers: { "user-agent": "Promia/1.0 (https://promia.vercel.app)" } });
    if (!res.ok) return [];
    const json = (await res.json()) as { products?: { product_name?: string; brands?: string; image_front_url?: string }[] };
    return (json.products ?? [])
      .filter((p) => p.image_front_url?.startsWith("https://"))
      .map((p) => ({
        title: [p.product_name, p.brands].filter(Boolean).join(" ").slice(0, 160),
        imageUrl: p.image_front_url!,
        thumbnailUrl: null,
        width: null,
        height: null,
        domain: "openfoodfacts.org",
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
