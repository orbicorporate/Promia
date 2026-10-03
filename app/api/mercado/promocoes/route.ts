import { NextResponse } from "next/server";
import { isUuid, readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// Promoções fixas da semana ("Quarta do hortifrúti").
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const weekday = Number(body.weekday);
  const name = String(body.name ?? "").trim().slice(0, 60);
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return NextResponse.json({ error: "Escolha o dia da semana." }, { status: 400 });
  if (!name) return NextResponse.json({ error: "Dê um nome à promoção." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("weekly_promotions")
    .insert({ market_id: body.marketId as string, weekday, name, category_hint: String(body.categoryHint ?? "").trim().slice(0, 60) || null, active: true })
    .select("id, weekday, name, category_hint, active")
    .single();
  if (error) return serverError("promocoes", error, "Não consegui salvar a promoção.");
  return NextResponse.json({ promotion: data });
}

export async function DELETE(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  if (!isUuid(body.id)) return NextResponse.json({ error: "Promoção inválida." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("weekly_promotions").delete().eq("id", body.id).eq("market_id", body.marketId as string);
  if (error) return serverError("promocoes", error, "Não consegui remover a promoção.");
  return NextResponse.json({ ok: true });
}
