import sharp from "sharp";
import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, IMAGE_SEARCH_MODEL } from "@/lib/ai/models";
import { jsonFromText, promptSafe } from "@/lib/ai/gerente";
import { fetchPublicImage } from "@/lib/net";
import type { ImageHit } from "./serper";

// A IA olha as miniaturas e escolhe a que é de fato o produto: mesma marca,
// mesma versão, tamanho parecido, embalagem de frente, fundo limpo. Sem
// isso a busca acerta "algo parecido"; com isso acerta o produto.

export type Verdict = { order: number[]; best: number | null; confidence: number };

// IA fora do ar (sem crédito, chave inválida, sobrecarga): o produto volta
// para a fila em vez de cair na revisão sem a conferência.
export class AiUnavailable extends Error {}

export function isAiUnavailable(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 401 || e?.status === 403 || e?.status === 429 || e?.status === 529 || (e?.status === 400 && /credit balance/i.test(e?.message ?? ""));
}

async function thumb(hit: ImageHit): Promise<string | null> {
  const src = hit.thumbnailUrl ?? hit.imageUrl;
  const got = await fetchPublicImage(src, { timeoutMs: 4000, maxBytes: 3 * 1024 * 1024 });
  if (!got) return null;
  try {
    const buf = await sharp(Buffer.from(got.body)).flatten({ background: "#ffffff" }).resize(256, 256, { fit: "inside" }).jpeg({ quality: 78 }).toBuffer();
    return buf.toString("base64");
  } catch {
    return null;
  }
}

export async function judgeCandidates(product: { name: string; brand: string | null; expect: string; generic: boolean }, hits: ImageHit[]): Promise<Verdict | null> {
  const client = anthropic();
  if (!client || hits.length === 0) return null;
  const thumbs = await Promise.all(hits.map(thumb));
  const shown = hits.map((h, i) => ({ i, data: thumbs[i] })).filter((x): x is { i: number; data: string } => !!x.data);
  if (shown.length === 0) return null;

  const content: Anthropic.ContentBlockParam[] = [];
  shown.forEach((s, k) => {
    content.push({ type: "text", text: `Foto ${k + 1}:` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: s.data } });
  });
  const alvo = `${promptSafe(product.name)}${product.brand ? ` (marca ${promptSafe(product.brand)})` : ""}. A foto certa mostra: ${promptSafe(product.expect)}.`;
  content.push({
    type: "text",
    text:
      `Produto da planilha de um supermercado: ${alvo}\n\n` +
      (product.generic
        ? "É um item sem embalagem: vale a foto do alimento em si, apetitosa, isolada ou em fundo claro. Rejeite fotos de prato pronto, receita, pessoas ou com texto por cima.\n"
        : "Escolha a foto da embalagem desse produto: mesma marca e mesma versão (sabor, tipo, light/zero). Tamanho ou quantidade diferente é aceitável se for a mesma marca e linha (ex.: ovos Ikeda de 12 ou de 30). Prefira foto de frente, em fundo branco ou limpo, só do produto. Rejeite: outra marca, outra versão, encarte, montagem com vários produtos, foto com pessoa, marca d'água, foto de prateleira, e imagem com faixa, selo ou texto da loja colado ao lado do produto.\n") +
      'Responda só com JSON: {"melhor": número da melhor foto ou 0 se nenhuma serve, "confianca": de 0 a 1, "ordem": [números das fotos que servem, da melhor para a pior]}',
  });

  try {
    const res = await client.messages.create({ model: IMAGE_SEARCH_MODEL, max_tokens: 200, messages: [{ role: "user", content }] });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const j = jsonFromText(text) as { melhor?: number; confianca?: number; ordem?: number[] } | null;
    if (!j) return null;
    const toHit = (n: unknown) => (typeof n === "number" && n >= 1 && n <= shown.length ? shown[n - 1].i : null);
    const best = toHit(j.melhor);
    const order = [...new Set([best, ...(Array.isArray(j.ordem) ? j.ordem.map(toHit) : [])].filter((x): x is number => x !== null))];
    const confidence = typeof j.confianca === "number" ? Math.max(0, Math.min(1, j.confianca)) : 0;
    return { order, best, confidence };
  } catch (err) {
    if (isAiUnavailable(err)) {
      console.error("[fotos] IA indisponível (crédito, chave ou sobrecarga)", (err as Error).message);
      throw new AiUnavailable();
    }
    console.error("[fotos] juiz", err);
    return null;
  }
}
