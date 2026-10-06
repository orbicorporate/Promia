// Concorrentes próximos pela busca de lugares do Google (Serper, mesma chave
// da busca de fotos).

export type Place = { name: string; address: string | null; latitude: number | null; longitude: number | null; rating: number | null; reviews: number | null; phone: string | null; website: string | null; category: string | null };

export async function searchNearbyMarkets(location: string): Promise<Place[] | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key || !location.trim()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({ q: `supermercado perto de ${location}`, gl: "br", hl: "pt-br" }),
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
