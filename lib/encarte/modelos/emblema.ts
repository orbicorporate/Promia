import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { emblemaPng, emblemaPorSlug, type Variante } from "@/lib/emblemas/catalog";

// Emblema de campanha dentro do encarte. O arquivo vem de public/emblemas:
// do disco quando existe (desenvolvimento e testes) e por HTTPS do próprio
// site quando não (o Vercel não leva a pasta public para dentro da função).
// Só slugs do catálogo são aceitos, então a busca nunca vai para um
// endereço escolhido por quem usa.
//
// Além da imagem (PNG reduzido, em data URI), sai a paleta do logo: o
// matiz dominante e o segundo matiz mais forte, que o modelo usa para
// pintar o fundo, as faixas e as etiquetas no mesmo clima do emblema.

export type EmblemaArquivo = { src: string; w: number; h: number };

export type CoresEmblema = {
  hue: number; // matiz principal (0 a 360), já sem o amarelo dourado das letras
  sat: number; // 0 a 1
  hue2: number; // segundo matiz
  neutro: boolean; // quase sem cor (preto e dourado, como a Black Friday)
  quente: boolean; // o matiz principal é laranja ou amarelo
  dourado: number; // fração de pixels coloridos em amarelo dourado
};

export type EmblemaImg = {
  slug: string;
  nome: string;
  ilustrado: EmblemaArquivo;
  horizontal: EmblemaArquivo | null;
  cores: CoresEmblema;
};

const MAX_W = 880;
const cache = new Map<string, Promise<EmblemaImg | null>>();

async function lerArquivo(slug: string, variante?: Variante): Promise<Buffer | null> {
  const rel = emblemaPng(slug, variante); // /emblemas/x.png
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

async function preparar(buf: Buffer): Promise<{ file: EmblemaArquivo; raw: Buffer; rw: number; rh: number }> {
  const out = await sharp(buf).resize({ width: MAX_W, withoutEnlargement: true }).png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
  // amostra pequena para a paleta
  const small = await sharp(out.data).resize({ width: 72 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { file: { src: `data:image/png;base64,${out.data.toString("base64")}`, w: out.info.width, h: out.info.height }, raw: small.data, rw: small.info.width, rh: small.info.height };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return [h, s, l];
}

export function coresDoEmblema(raw: Buffer): CoresEmblema {
  const bins = new Array<number>(36).fill(0); // 10 graus cada
  let opacos = 0;
  let coloridos = 0;
  let dourados = 0;
  for (let i = 0; i < raw.length; i += 4) {
    if (raw[i + 3] < 200) continue;
    opacos++;
    const [h, s, l] = rgbToHsl(raw[i], raw[i + 1], raw[i + 2]);
    if (s < 0.35 || l < 0.16 || l > 0.9) continue; // cinza, preto e branco não dão matiz
    coloridos++;
    const peso = s * (1 - Math.abs(2 * l - 1));
    const dour = h >= 36 && h <= 62;
    if (dour) dourados += 1;
    // o dourado das letras aparece em quase todo emblema e não deve decidir o fundo
    bins[Math.floor(h / 10) % 36] += peso * (dour ? 0.35 : 1);
  }
  const ordem = bins.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const total = bins.reduce((a, b) => a + b, 0) || 1;
  const principal = ordem[0];
  const centro = (idx: number) => idx * 10 + 5;
  const segundo = ordem.find((o) => o.v > 0 && Math.min(Math.abs(o.i - principal.i), 36 - Math.abs(o.i - principal.i)) >= 5) ?? principal;
  const neutro = coloridos < opacos * 0.12 || principal.v / total < 0.14;
  const hue = centro(principal.i);
  return {
    hue,
    sat: Math.min(1, principal.v / total + 0.5),
    hue2: centro(segundo.i),
    neutro,
    quente: hue >= 18 && hue <= 62,
    dourado: coloridos ? dourados / coloridos : 0,
  };
}

async function carregar(slug: string): Promise<EmblemaImg | null> {
  const e = emblemaPorSlug(slug);
  if (!e) return null;
  const base = await lerArquivo(slug);
  if (!base) return null;
  const p = await preparar(base);
  let horizontal: EmblemaArquivo | null = null;
  if (e.variantes?.includes("horizontal")) {
    const hb = await lerArquivo(slug, "horizontal");
    if (hb) horizontal = (await preparar(hb)).file;
  }
  return { slug, nome: e.nome, ilustrado: p.file, horizontal, cores: coresDoEmblema(p.raw) };
}

export function carregarEmblema(slug: string | null | undefined): Promise<EmblemaImg | null> {
  if (!slug) return Promise.resolve(null);
  let p = cache.get(slug);
  if (!p) {
    p = carregar(slug).catch(() => null);
    cache.set(slug, p);
    p.then((v) => {
      if (!v && cache.get(slug) === p) cache.delete(slug);
    });
    if (cache.size > 40) cache.delete(cache.keys().next().value as string);
  }
  return p;
}
