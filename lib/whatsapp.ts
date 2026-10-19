import crypto from "node:crypto";

// WhatsApp Business (Cloud API da Meta). As chaves ficam só nas variáveis de ambiente:
// WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN, META_APP_SECRET.
const GRAPH = "https://graph.facebook.com/v21.0";

export const whatsappConfigurado = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID && process.env.WHATSAPP_VERIFY_TOKEN && process.env.META_APP_SECRET);

// a Meta assina o corpo com o segredo do app; sem assinatura válida, ninguém é atendido
export function assinaturaValida(corpo: string, cabecalho: string | null): boolean {
  const segredo = process.env.META_APP_SECRET;
  if (!segredo || !cabecalho?.startsWith("sha256=")) return false;
  const esperado = crypto.createHmac("sha256", segredo).update(corpo).digest("hex");
  const recebido = cabecalho.slice(7);
  return recebido.length === esperado.length && crypto.timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado));
}

// só os dígitos, sem o 55 do país e sem o 9 extra do celular, para comparar números do mesmo aparelho
export function chaveTelefone(n: string | null | undefined): string {
  const d = String(n ?? "").replace(/\D/g, "").replace(/^55/, "");
  return d.length === 11 && d[2] === "9" ? d.slice(0, 2) + d.slice(3) : d;
}

export async function enviarTexto(para: string, texto: string): Promise<boolean> {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: para, type: "text", text: { body: texto.slice(0, 3800), preview_url: false } }),
  });
  if (!res.ok) console.error("[whatsapp] envio", res.status);
  return res.ok;
}

export async function baixarMidia(id: string): Promise<Buffer | null> {
  const auth = { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` };
  const meta = await fetch(`${GRAPH}/${encodeURIComponent(id)}`, { headers: auth });
  if (!meta.ok) return null;
  const { url } = (await meta.json()) as { url?: string };
  if (!url || !/^https:\/\/[^/]*(facebook|fbcdn|whatsapp)\./.test(url)) return null;
  const file = await fetch(url, { headers: auth });
  if (!file.ok) return null;
  const buf = Buffer.from(await file.arrayBuffer());
  return buf.length > 0 && buf.length <= 16 * 1024 * 1024 ? buf : null;
}
