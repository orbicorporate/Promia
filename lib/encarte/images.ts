import sharp from "sharp";
import { fetchPublicImage, type FetchedImage } from "@/lib/net";
import { cutoutProductPhoto } from "./cutout";
import { ilustracaoUri } from "./ilustra";
import { carregarEmblema } from "./modelos/emblema";
import { carregarFundoArte } from "./modelos/fundo-arte";
import { fundoArtePorId } from "./modelos/fundos-arte";
import { getPage } from "./paginate";
import type { EncarteData, EncarteItem } from "./types";

// Antes de desenhar, logo e fotos viram data URI (base64): o renderizador
// do next/og só busca imagem sozinho por URL sem nenhuma proteção, então
// a busca é feita aqui, por fetchPublicImage (só https, nunca endereço
// interno, tamanho e tempo limitados).
//
// O Satori desenha PNG, JPEG e GIF (e SVG, que o fetchPublicImage já
// recusa). WebP e AVIF fazem a renderização inteira falhar, então essas
// imagens são descartadas (o cartão mostra o placeholder com a inicial).
// O tipo é decidido pelos bytes, não pelo content-type do servidor.

export type SupportedImageType = "image/png" | "image/jpeg" | "image/gif";

export function sniffImageType(bytes: Uint8Array): SupportedImageType | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  return null; // webp, avif, svg, html de erro etc.
}

const DATA_URI_RE = /^data:(image\/(?:png|jpeg|gif));base64,([A-Za-z0-9+/=]+)$/;
const MAX_DATA_URI_LENGTH = 7_000_000; // ~5 MB de imagem

// data URI já pronto (amostras, testes): aceito se os bytes baterem com
// um tipo suportado
function checkDataUri(uri: string): string | null {
  if (uri.length > MAX_DATA_URI_LENGTH) return null;
  const m = DATA_URI_RE.exec(uri);
  if (!m) return null;
  const head = Buffer.from(m[2].slice(0, 24), "base64");
  const type = sniffImageType(new Uint8Array(head));
  return type ? `data:${type};base64,${m[2]}` : null;
}

export type ImageFetcher = (url: string, opts: { maxBytes: number; timeoutMs: number }) => Promise<FetchedImage | null>;

export type ResolveImagesOptions = {
  concurrency?: number; // buscas simultâneas
  timeoutMs?: number; // por imagem
  maxBytes?: number; // por imagem
  budgetMs?: number; // tempo total: depois disso, o que faltar vira placeholder
  pageIndex?: number; // só as imagens dessa página (0-based)
  fetcher?: ImageFetcher; // para testes
  ilustrar?: boolean; // sem foto, usar a ilustração do tipo do produto (padrão: não)
  cutout?: boolean; // recortar o fundo das fotos de produto (modelos de arte); padrão: quando o encarte tem modelo
  cache?: Map<string, Promise<string | null>>; // reaproveitar entre páginas (PDF)
  maxLado?: number; // prévia: encolhe as fotos de produto para no máximo esse lado (px); o arquivo final usa o tamanho real
};

// Encolhe um data URI de imagem (mantém PNG com transparência; o resto vira JPEG).
async function encolher(uri: string | null, lado: number): Promise<string | null> {
  if (!uri) return uri;
  const m = DATA_URI_RE.exec(uri);
  if (!m) return uri;
  try {
    const input = Buffer.from(m[2], "base64");
    const meta = await sharp(input, { failOn: "none" }).metadata();
    if (!meta.width || !meta.height || Math.max(meta.width, meta.height) <= lado) return uri;
    const img = sharp(input, { failOn: "none" }).resize({ width: lado, height: lado, fit: "inside" });
    if (m[1] === "image/png") return `data:image/png;base64,${(await img.png({ compressionLevel: 3 }).toBuffer()).toString("base64")}`;
    return `data:image/jpeg;base64,${(await img.jpeg({ quality: 80 }).toBuffer()).toString("base64")}`;
  } catch {
    return uri;
  }
}

export function createImageCache(): Map<string, Promise<string | null>> {
  return new Map();
}

// Cache do processo: a prévia ao vivo pede o mesmo encarte dezenas de vezes
// enquanto a pessoa monta. Buscar e recortar cada foto de novo era o maior
// custo de cada atualização. Guarda só o que deu certo, com teto de memória
// (as fotos mais antigas saem primeiro) e validade curta.
const GLOBAL_TTL_MS = 10 * 60 * 1000;
const GLOBAL_MAX_BYTES = 60 * 1024 * 1024;
const globalImages = new Map<string, { promise: Promise<string | null>; at: number; size: number }>();
let globalBytes = 0;

function globalGet(key: string): Promise<string | null> | null {
  const hit = globalImages.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > GLOBAL_TTL_MS) {
    globalImages.delete(key);
    globalBytes -= hit.size;
    return null;
  }
  // reinsere para virar o mais recente
  globalImages.delete(key);
  globalImages.set(key, hit);
  return hit.promise;
}

function globalPut(key: string, promise: Promise<string | null>) {
  const entry = { promise, at: Date.now(), size: 0 };
  globalImages.set(key, entry);
  promise.then(
    (v) => {
      if (!v) {
        if (globalImages.get(key) === entry) globalImages.delete(key);
        return;
      }
      entry.size = v.length;
      globalBytes += v.length;
      while (globalBytes > GLOBAL_MAX_BYTES) {
        const oldest = globalImages.keys().next().value;
        if (oldest === undefined) break;
        const o = globalImages.get(oldest)!;
        globalImages.delete(oldest);
        globalBytes -= o.size;
      }
    },
    () => {
      if (globalImages.get(key) === entry) globalImages.delete(key);
    }
  );
}

// Fila com limite de concorrência
function limiter(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active >= concurrency) await new Promise<void>((resolve) => queue.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      next();
    }
  };
}

// Devolve uma cópia do encarte com logo e fotos em data URI (ou null).
// Com pageIndex, só busca as fotos da página pedida; as das outras páginas
// ficam null (não são desenhadas mesmo).
export async function resolveEncarteImages(data: EncarteData, opts: ResolveImagesOptions = {}): Promise<EncarteData> {
  const { concurrency = 6, timeoutMs = 4000, maxBytes = 4 * 1024 * 1024, budgetMs = 9000, fetcher = fetchPublicImage } = opts;
  const cache = opts.cache ?? createImageCache();
  // cache do processo só no caminho real (com o fetcher de verdade)
  const useGlobal = !opts.cache && !opts.fetcher;
  const run = limiter(Math.max(1, concurrency));
  const deadline = Date.now() + budgetMs;
  const doCutout = opts.cutout ?? !!data.modelo;

  const load = (raw: string | null | undefined, isProduct = false): Promise<string | null> => {
    const url = (raw ?? "").trim();
    if (!url) return Promise.resolve(null);
    const cached = cache.get(url);
    if (cached) return cached;
    const gkey = `${doCutout && isProduct ? "c" : "r"}${isProduct && opts.maxLado ? `m${opts.maxLado}` : ""}|${url}`;
    if (useGlobal && url.startsWith("https://")) {
      const g = globalGet(gkey);
      if (g) {
        cache.set(url, g);
        return g;
      }
    }
    let promise: Promise<string | null>;
    if (url.startsWith("data:")) {
      promise = Promise.resolve(checkDataUri(url));
    } else if (!url.startsWith("https://")) {
      promise = Promise.resolve(null);
    } else {
      promise = run(async () => {
        const remaining = deadline - Date.now();
        if (remaining <= 200) return null;
        try {
          const img = await fetcher(url, { maxBytes, timeoutMs: Math.min(timeoutMs, remaining) });
          if (!img || img.body.byteLength === 0) return null;
          const bytes = new Uint8Array(img.body);
          if (doCutout && isProduct) {
            // foto de produto sem fundo (PNG com transparência); se o fundo
            // não for liso, segue a foto como veio
            const cut = await cutoutProductPhoto(Buffer.from(bytes)).catch(() => null);
            if (cut) return `data:image/png;base64,${cut.toString("base64")}`;
          }
          const type = sniffImageType(bytes);
          return type ? `data:${type};base64,${Buffer.from(bytes).toString("base64")}` : null;
        } catch {
          return null;
        }
      });
    }
    if (isProduct && opts.maxLado) {
      const lado = opts.maxLado;
      promise = promise.then((v) => encolher(v, lado));
    }
    cache.set(url, promise);
    if (useGlobal && url.startsWith("https://")) globalPut(gkey, promise);
    return promise;
  };

  let wanted: Set<EncarteItem> | null = null;
  if (opts.pageIndex != null) {
    const page = getPage(data, opts.pageIndex);
    wanted = new Set(page ? [...(page.featured ? [page.featured] : []), ...page.items] : []);
  }

  const [logoUrl, emblemaImg, fundoArte, ...images] = await Promise.all([
    load(data.market.logoUrl),
    data.emblema ? carregarEmblema(data.emblema) : Promise.resolve(null),
    data.fundo && fundoArtePorId(data.fundo) ? carregarFundoArte(data.fundo) : Promise.resolve(null),
    ...data.items.map((item) => (wanted && !wanted.has(item) ? Promise.resolve(null) : load(item.imageUrl, true))),
  ]);

  // sem foto (ou foto que não abriu): ilustração do tipo do produto, para o
  // cartão nunca ficar só com uma letra. Só nas fotos da página pedida.
  const finais = await Promise.all(
    data.items.map(async (item, i) => {
      if (!opts.ilustrar || images[i] || (wanted && !wanted.has(item))) return images[i];
      const ilu = await ilustracaoUri(item.name).catch(() => null);
      return opts.maxLado ? encolher(ilu, opts.maxLado) : ilu;
    })
  );

  return {
    ...data,
    market: { ...data.market, logoUrl },
    emblemaImg,
    fundoArte,
    items: data.items.map((item, i) => ({ ...item, imageUrl: finais[i] })),
  };
}
