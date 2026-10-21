import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { distanceKm, geocodeAddress, searchNearbyMarkets } from "@/lib/competition/places";
import { similarity } from "@/lib/competition/match";

export const maxDuration = 30;

// POST /api/concorrencia/buscar { marketId }: acha os mercados perto do
// endereço do mercado e guarda como concorrentes (sem duplicar).
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("name, address, city").eq("id", marketId).single();
  const location = [market?.address, market?.city].filter(Boolean).join(", ");
  if (!location) return NextResponse.json({ error: "Coloque o endereço e a cidade do mercado em Mercado para achar os concorrentes." }, { status: 400 });

  const radiusKm = [1, 2, 3, 5, 10].includes(Number(body.radiusKm)) ? Number(body.radiusKm) : 3;
  const origin = await geocodeAddress(location);
  const places = await searchNearbyMarkets(location, { origin, radiusKm });
  if (places === null) return NextResponse.json({ error: "A busca de lugares está indisponível agora. Tente de novo." }, { status: 503 });
  // só o que está dentro do raio (quando dá para medir) e não é o próprio mercado
  const others = places
    .filter((p) => similarity(p.name, market?.name ?? "") < 0.8)
    .filter((p) => !origin || p.latitude == null || p.longitude == null || distanceKm(origin, { latitude: p.latitude, longitude: p.longitude }) <= radiusKm)
    .sort((a, b) => (origin && a.latitude != null && a.longitude != null ? distanceKm(origin, { latitude: a.latitude, longitude: a.longitude }) : 99) - (origin && b.latitude != null && b.longitude != null ? distanceKm(origin, { latitude: b.latitude, longitude: b.longitude }) : 99))
    .slice(0, 40);
  if (others.length === 0) return NextResponse.json({ found: 0, origin, radiusKm });
  const { error } = await admin
    .from("competitors")
    .upsert(others.map((p) => ({ market_id: marketId, ...p, source: "busca" })), { onConflict: "market_id,name,address", ignoreDuplicates: true });
  if (error) return serverError("concorrencia/buscar", error, "Não consegui salvar os concorrentes.");
  return NextResponse.json({ found: others.length, origin, radiusKm });
}
