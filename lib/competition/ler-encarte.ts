import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCompetitorFlyer } from "@/lib/ai/flyer";
import { bestMatch } from "./match";
import { recordUsage, remainingToday } from "@/lib/ai/usage";
import { isAiUnavailable } from "@/lib/photos/judge";
import { todayInSaoPaulo } from "@/lib/dates";
import { isUuid } from "@/lib/auth";

export type LeituraEncarte =
  | { ok: true; items: number; matched: number; competitor: string; rows: { product_name: string; product_id: string | null; price: number; old_price: number | null }[] }
  | { ok: false; status: number; error: string; log?: unknown };

// Lê a foto de um encarte de concorrente, casa com o catálogo e grava os preços.
// Usada pela tela (foto enviada pelo navegador) e pelo WhatsApp.
export async function lerEncarte(opts: { marketId: string; userId: string | null; image: Buffer; competitorId?: unknown; competitorName?: string | null }): Promise<LeituraEncarte> {
  const { marketId, userId } = opts;
  const admin = createAdminClient();
  if ((await remainingToday(marketId, "concorrencia")) <= 0) return { ok: false, status: 429, error: "Limite de encartes lidos hoje atingido. Amanhã libera de novo." };

  let jpeg: string;
  try {
    // tamanho que a IA lê bem sem gastar demais
    const buf = await sharp(opts.image).rotate().resize(1800, 1800, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer();
    jpeg = buf.toString("base64");
  } catch {
    return { ok: false, status: 422, error: "Não consegui abrir essa imagem. Tente um print ou outra foto." };
  }

  const today = todayInSaoPaulo();
  let read;
  try {
    read = await readCompetitorFlyer(jpeg, today);
  } catch (err) {
    if (isAiUnavailable(err)) return { ok: false, status: 503, error: "A IA está indisponível agora. Tente de novo em alguns minutos." };
    return { ok: false, status: 500, error: "Não consegui ler o encarte agora. Tente de novo.", log: err };
  }
  await recordUsage(marketId, userId, "concorrencia", 1);
  if (!read || read.itens.length === 0) return { ok: false, status: 422, error: "Não achei preços legíveis nessa foto. Tente uma foto mais de perto ou um print." };

  // concorrente: o escolhido, o nome digitado ou o que aparece no encarte
  let competitorId: string | null = isUuid(opts.competitorId) ? (opts.competitorId as string) : null;
  let competitorName = String(opts.competitorName ?? "").trim().slice(0, 120);
  if (competitorId) {
    const { data: c } = await admin.from("competitors").select("id, name").eq("id", competitorId).eq("market_id", marketId).maybeSingle();
    if (!c) competitorId = null;
    else competitorName = c.name;
  } else if (competitorName) {
    // nome digitado que bate com um concorrente já salvo vira o mesmo concorrente
    const { data: lista } = await admin.from("competitors").select("id, name").eq("market_id", marketId).limit(100);
    const m = bestMatch(competitorName, lista ?? []);
    if (m && m.score >= 0.7) {
      competitorId = m.item.id;
      competitorName = m.item.name;
    }
  }
  if (!competitorName) competitorName = read.mercado ?? "Concorrente";

  const { data: catalog } = await admin.from("products").select("id, name, brand").eq("market_id", marketId).eq("active", true).limit(20000);
  const { data: flyer, error: fErr } = await admin
    .from("competitor_flyers")
    .insert({ market_id: marketId, competitor_id: competitorId, competitor_name: competitorName, observed_on: today, valid_until: read.validoAte, items: read.itens.length, created_by: userId })
    .select("id")
    .single();
  if (fErr || !flyer) return { ok: false, status: 500, error: "Não consegui salvar o encarte lido.", log: fErr };

  const rows = read.itens.map((it) => {
    const m = bestMatch(it.produto, catalog ?? []);
    return { market_id: marketId, flyer_id: flyer.id, competitor_id: competitorId, competitor_name: competitorName, product_name: it.produto, product_id: m?.item.id ?? null, match_score: m ? Math.round(m.score * 100) / 100 : null, price: it.preco, old_price: it.precoDe, observed_on: today };
  });
  const { error } = await admin.from("competitor_prices").insert(rows);
  if (error) return { ok: false, status: 500, error: "Não consegui salvar os preços lidos.", log: error };
  return { ok: true, items: rows.length, matched: rows.filter((r) => r.product_id).length, competitor: competitorName, rows: rows.map((r) => ({ product_name: r.product_name, product_id: r.product_id, price: r.price, old_price: r.old_price })) };
}
