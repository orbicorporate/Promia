// Concorrentes próximos pela busca de lugares do Google (Serper, mesma chave
// da busca de fotos).

export type Place = { name: string; address: string | null; latitude: number | null; longitude: number | null; rating: number | null; reviews: number | null; phone: string | null; website: string | null; category: string | null };

export type Origin = { latitude: number; longitude: number };

// distância em km entre dois pontos (fórmula de haversine)
export function distanceKm(a: Origin, b: Origin): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// zoom do mapa que cobre o raio pedido (viés da busca de lugares)
export const RAIOS_KM = [1, 2, 3, 5, 10] as const;
const ZOOM_DO_RAIO: Record<number, number> = { 1: 15, 2: 14, 3: 14, 5: 13, 10: 12 };

// Coordenadas do endereço do mercado analisado, pela busca de lugares. A
// resposta fica em memória por 6 horas para não gastar uma busca a cada visita.
const origemCache = new Map<string, { at: number; value: Origin | null }>();

export async function geocodeAddress(location: string): Promise<Origin | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  const q = location.trim();
  if (!key || !q) return null;
  const hit = origemCache.get(q);
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.value;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({ q, gl: "br", hl: "pt-br" }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { places?: { latitude?: number; longitude?: number }[] };
    const first = (json.places ?? []).find((p) => typeof p.latitude === "number" && typeof p.longitude === "number");
    const value = first ? { latitude: first.latitude!, longitude: first.longitude! } : null;
    if (value) origemCache.set(q, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchNearbyMarkets(location: string, opts: { origin?: Origin | null; radiusKm?: number } = {}): Promise<Place[] | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key || !location.trim()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({
        q: `supermercado perto de ${location}`,
        gl: "br",
        hl: "pt-br",
        ...(opts.origin ? { ll: `@${opts.origin.latitude},${opts.origin.longitude},${ZOOM_DO_RAIO[opts.radiusKm ?? 3] ?? 14}z` } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[serper places]", res.status);
      return null;
    }
    const json = (await res.json()) as { places?: { title?: string; address?: string; latitude?: number; longitude?: number; rating?: number; ratingCount?: number; phoneNumber?: string; website?: string; category?: string }[] };
    return (json.places ?? [])
      .filter((p) => p.title)
      .filter((p) => !p.category || /mercado|supermercado|atacad|hortifr|mercearia|açougue|acougue|minimercado|empório|emporio/i.test(p.category))
      .map((p) => ({
        name: p.title!.slice(0, 120),
        address: p.address?.slice(0, 200) ?? null,
        latitude: p.latitude ?? null,
        longitude: p.longitude ?? null,
        rating: p.rating ?? null,
        reviews: p.ratingCount ?? null,
        phone: p.phoneNumber ?? null,
        website: p.website ?? null,
        category: p.category ?? null,
      }));
  } catch (err) {
    console.error("[serper places] falhou", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
