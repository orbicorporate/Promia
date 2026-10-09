import { fetchPublicImage, type FetchedImage } from "@/lib/net";
import { cutoutProductPhoto } from "./cutout";
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
  cutout?: boolean; // recortar o fundo das fotos de produto (modelos de arte); padrão: quando o encarte tem modelo
  cache?: Map<string, Promise<string | null>>; // reaproveitar entre páginas (PDF)
};

export function createImageCache(): Map<string, Promise<string | null>> {
  return new Map();
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
  const run = limiter(Math.max(1, concurrency));
  const deadline = Date.now() + budgetMs;
  const doCutout = opts.cutout ?? !!data.modelo;

  const load = (raw: string | null | undefined, isProduct = false): Promise<string | null> => {
    const url = (raw ?? "").trim();
    if (!url) return Promise.resolve(null);
    const cached = cache.get(url);
    if (cached) return cached;
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
    cache.set(url, promise);
    return promise;
  };

  let wanted: Set<EncarteItem> | null = null;
  if (opts.pageIndex != null) {
    const page = getPage(data, opts.pageIndex);
    wanted = new Set(page ? [...(page.featured ? [page.featured] : []), ...page.items] : []);
  }

  const [logoUrl, ...images] = await Promise.all([
    load(data.market.logoUrl),
    ...data.items.map((item) => (wanted && !wanted.has(item) ? Promise.resolve(null) : load(item.imageUrl, true))),
  ]);

  return {
    ...data,
    market: { ...data.market, logoUrl },
    items: data.items.map((item, i) => ({ ...item, imageUrl: images[i] })),
  };
}
