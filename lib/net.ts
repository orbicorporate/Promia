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
