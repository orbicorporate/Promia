import { lookup } from "node:dns/promises";
import net from "node:net";

// Busca de imagem de terceiros pelo servidor, com proteção contra SSRF:
// só https, nunca endereço interno (rede local, metadados da nuvem,
// localhost), redirecionamentos conferidos um a um, tamanho e tempo
// limitados, e só aceita o que o servidor diz ser imagem.

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe8") || v6.startsWith("fe9") || v6.startsWith("fea") || v6.startsWith("feb");
}

export async function isSafePublicUrl(raw: string): Promise<URL | null> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (net.isIP(host)) return isPrivateIp(host) ? null : url;
  try {
    const addresses = await lookup(host, { all: true });
    if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) return null;
  } catch {
    return null;
  }
  return url;
}

export type FetchedImage = { contentType: string; body: ArrayBuffer; finalUrl: string };

export async function fetchPublicImage(
  raw: string,
  { maxBytes = 5 * 1024 * 1024, timeoutMs = 8000, headOnly = false } = {}
): Promise<FetchedImage | null> {
  let current = raw;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop < 4; hop++) {
      const url = await isSafePublicUrl(current);
      if (!url) return null;
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "PromiaBot/1.0 (+https://promia.vercel.app)", accept: "image/*", ...(headOnly ? { range: "bytes=0-2047" } : {}) },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;
        current = new URL(location, url).toString();
        continue;
      }
      if (!res.ok && res.status !== 206) return null;
      const contentType = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      if (!contentType.startsWith("image/") || contentType === "image/svg+xml") return null;
      const length = Number(res.headers.get("content-length") ?? 0);
      if (!headOnly && length > maxBytes) return null;
      if (headOnly) {
        await res.body?.cancel();
        return { contentType, body: new ArrayBuffer(0), finalUrl: url.toString() };
      }
      const body = await res.arrayBuffer();
      if (body.byteLength > maxBytes) return null;
      return { contentType, body, finalUrl: url.toString() };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Baixa o HTML de uma página pública (mesma proteção contra endereço
// interno das imagens). Só o começo da página: as metatags ficam no <head>.
export async function fetchPublicHtml(raw: string, { maxBytes = 600_000, timeoutMs = 6000 } = {}): Promise<{ html: string; finalUrl: string } | null> {
  let current = raw;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let hop = 0; hop < 4; hop++) {
      const url = await isSafePublicUrl(current);
      if (!url) return null;
      const res = await fetch(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "user-agent": "Mozilla/5.0 (compatible; PromiaBot/1.0; +https://promia.vercel.app)", accept: "text/html,application/xhtml+xml" },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;
        current = new URL(location, url).toString();
        continue;
      }
      if (!res.ok || !res.body) return null;
      const type = (res.headers.get("content-type") ?? "").toLowerCase();
      if (type && !type.includes("html")) {
        await res.body.cancel();
        return null;
      }
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (size < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.byteLength;
      }
      await reader.cancel().catch(() => {});
      const html = new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
      return { html, finalUrl: url.toString() };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const IMG_NOISE = /logo|favicon|sprite|banner|placeholder|avatar|icon[-_.]|selo|bandeira|app-?store|google-?play/i;

function decodeEntities(s: string) {
  return s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x2F;/gi, "/").replace(/&#39;/g, "'");
}

// Fotos que a própria página declara como principais: dados de produto
// (JSON-LD), Open Graph e Twitter. Lojas online preenchem isso com a foto
// da embalagem, então é a fonte mais confiável depois do código de barras.
export function extractPageImages(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const push = (raw: unknown) => {
    if (typeof raw !== "string") return;
    try {
      const u = new URL(decodeEntities(raw.trim()), baseUrl);
      if (u.protocol !== "https:" || IMG_NOISE.test(u.pathname)) return;
      const s = u.toString();
      if (!out.includes(s)) out.push(s);
    } catch {
      /* endereço quebrado */
    }
  };

  // JSON-LD de produto primeiro
  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim());
      const nodes: unknown[] = Array.isArray(data) ? data : data?.["@graph"] ? data["@graph"] : [data];
      for (const n of nodes) {
        if (!n || typeof n !== "object") continue;
        const node = n as Record<string, unknown>;
        const type = String(node["@type"] ?? "");
        if (!/product/i.test(type)) continue;
        const img = node.image;
        if (Array.isArray(img)) img.forEach((i) => push(typeof i === "object" && i ? (i as Record<string, unknown>).url : i));
        else if (img && typeof img === "object") push((img as Record<string, unknown>).url);
        else push(img);
      }
    } catch {
      /* JSON-LD inválido é comum; segue */
    }
  }

  const meta = (prop: string) => {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i");
    return html.match(re1)?.[1] ?? html.match(re2)?.[1];
  };
  push(meta("og:image:secure_url"));
  push(meta("og:image"));
  push(meta("twitter:image"));
  push(html.match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)?.[1]);
  return out.slice(0, 4);
}
