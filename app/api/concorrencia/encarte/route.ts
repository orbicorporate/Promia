import { NextResponse } from "next/server";
import sharp from "sharp";
import { isUuid, readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCompetitorFlyer } from "@/lib/ai/flyer";
import { bestMatch } from "@/lib/competition/match";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import { todayInSaoPaulo } from "@/lib/dates";

export const maxDuration = 120;

const IMG = /\.(jpe?g|png|webp|heic|heif)$/i;

// POST { marketId, acao: "envio", fileName } -> URL assinada para a foto
// POST { marketId, acao: "ler", path, competitorId?, competitorName? } -> lê, casa e grava
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  const admin = createAdminClient();

  if (body.acao === "envio") {
    const ext = String(body.fileName ?? "").toLowerCase().match(IMG)?.[1];
    if (!ext) return NextResponse.json({ error: "Envie uma foto ou print do encarte (JPG, PNG ou WebP)." }, { status: 400 });
    const path = `${marketId}/concorrente-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext === "jpeg" ? "jpg" : ext}`;
    const { data, error } = await admin.storage.from("imports").createSignedUploadUrl(path);
    if (error || !data) return serverError("concorrencia/envio", error, "Não consegui preparar o envio.");
    return NextResponse.json({ path: data.path, token: data.token });
  }

  if (body.acao !== "ler") return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  const path = String(body.path ?? "");
  if (!new RegExp(`^${marketId}/concorrente-\\d+-[a-f0-9]{8}\\.(jpg|png|webp|heic|heif)$`).test(path)) {
    return NextResponse.json({ error: "Arquivo inválido. Envie a foto de novo." }, { status: 400 });
  }
  if ((await remainingToday(marketId, "concorrencia")) <= 0) {
    return NextResponse.json({ error: "Limite de encartes lidos hoje atingido. Amanhã libera de novo." }, { status: 429 });
  }

  const file = await admin.storage.from("imports").download(path);
  await admin.storage.from("imports").remove([path]);
  if (file.error || !file.data) return NextResponse.json({ error: "Não consegui buscar a foto. Envie de novo." }, { status: 400 });

  let jpeg: string;
  try {
    // tamanho que a IA lê bem sem gastar demais
    const buf = await sharp(Buffer.from(await file.data.arrayBuffer())).rotate().resize(1800, 1800, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    jpeg = buf.toString("base64");
  } catch {
    return NextResponse.json({ error: "Não consegui abrir essa imagem. Tente um print ou outra foto." }, { status: 422 });
  }

  const today = todayInSaoPaulo();
  let read;
  try {
    read = await readCompetitorFlyer(jpeg, today);
  } catch (err) {
    if (isAiUnavailable(err)) return NextResponse.json({ error: "A IA está indisponível agora. Tente de novo em alguns minutos." }, { status: 503 });
    return serverError("concorrencia/ler", err, "Não consegui ler o encarte agora. Tente de novo.");
  }
  await recordUsage(marketId, access.viewer.userId, "concorrencia", 1);
  if (!read || read.itens.length === 0) {
    return NextResponse.json({ error: "Não achei preços legíveis nessa foto. Tente uma foto mais de perto ou um print." }, { status: 422 });
  }

  // concorrente: o escolhido, o nome digitado ou o que aparece no encarte
  let competitorId: string | null = isUuid(body.competitorId) ? body.competitorId : null;
  let competitorName = String(body.competitorName ?? "").trim().slice(0, 120);
  if (competitorId) {
    const { data: c } = await admin.from("competitors").select("id, name").eq("id", competitorId).eq("market_id", marketId).maybeSingle();
    if (!c) competitorId = null;
    else competitorName = c.name;
  }
  if (!competitorName) competitorName = read.mercado ?? "Concorrente";

  const { data: catalog } = await admin.from("products").select("id, name, brand").eq("market_id", marketId).eq("active", true).limit(20000);
  const { data: flyer, error: fErr } = await admin
    .from("competitor_flyers")
    .insert({ market_id: marketId, competitor_id: competitorId, competitor_name: competitorName, observed_on: today, valid_until: read.validoAte, items: read.itens.length, created_by: access.viewer.userId })
    .select("id")
    .single();
  if (fErr || !flyer) return serverError("concorrencia/gravar", fErr, "Não consegui salvar o encarte lido.");

  const rows = read.itens.map((it) => {
    const m = bestMatch(it.produto, catalog ?? []);
    return { market_id: marketId, flyer_id: flyer.id, competitor_id: competitorId, competitor_name: competitorName, product_name: it.produto, product_id: m?.item.id ?? null, match_score: m ? Math.round(m.score * 100) / 100 : null, price: it.preco, old_price: it.precoDe, observed_on: today };
  });
  const { error } = await admin.from("competitor_prices").insert(rows);
  if (error) return serverError("concorrencia/precos", error, "Não consegui salvar os preços lidos.");
  return NextResponse.json({ items: rows.length, matched: rows.filter((r) => r.product_id).length, competitor: competitorName });
}
