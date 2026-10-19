import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assinaturaValida, baixarMidia, chaveTelefone, enviarTexto, whatsappConfigurado } from "@/lib/whatsapp";
import { lerEncarte } from "@/lib/competition/ler-encarte";
import { resumoWhatsApp } from "@/lib/competition/resumo";

export const maxDuration = 120;

const AJUDA = "Oi! Eu sou o Promia. Mande aqui a foto ou o print do encarte de um concorrente e escreva o nome do mercado na legenda. Em cerca de 30 segundos eu devolvo a comparação com os seus preços.";

// GET: a Meta confirma o endereço com o token combinado
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (whatsappConfigurado() && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("proibido", { status: 403 });
}

const vistas = new Map<string, number>();
function jaVista(id: string): boolean {
  const agora = Date.now();
  for (const [k, t] of vistas) if (agora - t > 3600_000) vistas.delete(k);
  if (vistas.has(id)) return true;
  vistas.set(id, agora);
  return false;
}

type Msg = { from?: string; type?: string; id?: string; text?: { body?: string }; image?: { id?: string; caption?: string } };

// POST: mensagem recebida. Responde 200 na hora e trabalha depois, porque a Meta repete o envio se demorar.
export async function POST(req: NextRequest) {
  const corpo = await req.text();
  if (!whatsappConfigurado() || !assinaturaValida(corpo, req.headers.get("x-hub-signature-256"))) return new NextResponse("proibido", { status: 403 });
  let json: { entry?: { changes?: { value?: { messages?: Msg[] } }[] }[] };
  try {
    json = JSON.parse(corpo);
  } catch {
    return new NextResponse("ok");
  }
  const msgs = (json.entry ?? []).flatMap((e) => (e.changes ?? []).flatMap((c) => c.value?.messages ?? []));
  for (const m of msgs) after(() => tratar(m).catch((err) => console.error("[whatsapp] falhou", err)));
  return new NextResponse("ok");
}

async function tratar(m: Msg) {
  if (!m.from || !m.id) return;
  const admin = createAdminClient();
  // não processa a mesma mensagem duas vezes (a Meta pode reenviar)
  if (jaVista(m.id)) return;

  // quem manda precisa ser o WhatsApp cadastrado de um mercado
  const chave = chaveTelefone(m.from);
  const { data: mercados } = await admin.from("markets").select("id, slug, name, whatsapp").not("whatsapp", "is", null).limit(5000);
  const mercado = (mercados ?? []).find((x) => chaveTelefone(x.whatsapp) === chave && chave.length >= 10);
  if (!mercado) {
    await enviarTexto(m.from, "Esse número não está cadastrado em nenhum mercado do Promia. Coloque o WhatsApp do mercado em Mercado, no app, e mande de novo.");
    return;
  }
  if (m.type !== "image" || !m.image?.id) {
    await enviarTexto(m.from, AJUDA);
    return;
  }
  await enviarTexto(m.from, "Recebi o encarte, estou lendo os preços. Leva cerca de 30 segundos.");
  const imagem = await baixarMidia(m.image.id);
  if (!imagem) {
    await enviarTexto(m.from, "Não consegui baixar a imagem. Mande de novo, de preferência como foto e não como documento.");
    return;
  }
  const r = await lerEncarte({ marketId: mercado.id, userId: null, image: imagem, competitorName: m.image.caption ?? null });
  if (!r.ok) {
    if (r.log) console.error("[whatsapp] leitura", r.log);
    await enviarTexto(m.from, r.error);
    return;
  }
  const ids = [...new Set(r.rows.map((x) => x.product_id).filter((x): x is string => !!x))];
  const { data: nossos } = ids.length ? await admin.from("products").select("id, name, price").in("id", ids) : { data: [] };
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://promia.vercel.app";
  await enviarTexto(
    m.from,
    resumoWhatsApp(r.competitor, r.rows, (nossos ?? []).map((p) => ({ id: p.id, name: p.name, price: p.price == null ? null : Number(p.price) })), `${base}/${mercado.slug}/concorrencia`),
  );
}
