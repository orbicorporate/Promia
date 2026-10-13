import { NextResponse } from "next/server";
import { readJson, requireMarketAccess } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { geocodeAddress } from "@/lib/competition/places";

export const maxDuration = 15;

// POST /api/concorrencia/origem { marketId }: coordenadas do endereço do
// mercado analisado, para medir a distância de cada concorrente.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("address, city").eq("id", body.marketId as string).single();
  const location = [market?.address, market?.city].filter(Boolean).join(", ");
  const origin = location ? await geocodeAddress(location) : null;
  return NextResponse.json({ origin });
}
