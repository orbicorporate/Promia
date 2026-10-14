import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { fundoArtePorId } from "./fundos-arte";

// Cabeçalho e rodapé do fundo de arte, de public/fundos/arte: do disco quando
// existe e por HTTPS do próprio site quando não (o Vercel não leva a pasta
// public para dentro da função). Só ids do catálogo são aceitos. Os recortes
// são WebP com transparência na emenda; o Satori só desenha PNG, então a
// conversão é feita aqui, uma vez por processo.

export type ArquivoArte = { src: string; w: number; h: number };
export type FundoArteImg = { id: string; topo: ArquivoArte; base: ArquivoArte; faixa: string };

const cache = new Map<string, Promise<FundoArteImg | null>>();

async function ler(rel: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", rel));
  } catch {
    // sem arquivo no disco: busca no próprio site
  }
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "promia.vercel.app";
  try {
    const res = await fetch(`https://${host}${rel}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function png(buf: Buffer): Promise<ArquivoArte> {
  const o = await sharp(buf).png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
  return { src: `data:image/png;base64,${o.data.toString("base64")}`, w: o.info.width, h: o.info.height };
}

async function carregar(id: string): Promise<FundoArteImg | null> {
  const meta = fundoArtePorId(id);
  if (!meta) return null;
  const [t, b] = await Promise.all([ler(`/fundos/arte/${meta.slug}-topo.webp`), ler(`/fundos/arte/${meta.slug}-base.webp`)]);
  if (!t || !b) return null;
  const [topo, base] = await Promise.all([png(t), png(b)]);
  // última linha do rodapé: esticada, estende a faixa de baixo para caber o endereço
  const linha = await sharp(b).extract({ left: 0, top: base.h - 2, width: base.w, height: 1 }).flatten({ background: "#000" }).png().toBuffer();
  return { id, topo, base, faixa: `data:image/png;base64,${linha.toString("base64")}` };
}

export function carregarFundoArte(id: string): Promise<FundoArteImg | null> {
  let p = cache.get(id);
  if (!p) {
    p = carregar(id).catch(() => null);
    cache.set(id, p);
    p.then((v) => {
      if (!v) cache.delete(id);
    });
  }
  return p;
}
