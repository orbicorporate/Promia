import { describe, expect, it, vi } from "vitest";
import { resolveEncarteImages, sniffImageType, type ImageFetcher } from "@/lib/encarte/images";
import type { EncarteData } from "@/lib/encarte/types";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 16]);
const GIF = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const AVIF = new Uint8Array([0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]);

const buf = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

describe("sniffImageType", () => {
  it("reconhece png, jpeg e gif pelos bytes", () => {
    expect(sniffImageType(PNG)).toBe("image/png");
    expect(sniffImageType(JPEG)).toBe("image/jpeg");
    expect(sniffImageType(GIF)).toBe("image/gif");
  });
  it("recusa webp, avif e lixo", () => {
    expect(sniffImageType(WEBP)).toBeNull();
    expect(sniffImageType(AVIF)).toBeNull();
    expect(sniffImageType(new TextEncoder().encode("<html>erro</html>"))).toBeNull();
  });
});

function encarte(urls: (string | null)[], logo: string | null = null): EncarteData {
  return {
    id: "x",
    name: "Teste",
    format: "quadrado",
    layout: "grade",
    themeKey: "ofertas",
    market: { name: "Mercado", logoUrl: logo },
    items: urls.map((u, i) => ({ name: `P${i}`, price: 1 + i, highlight: false, imageUrl: u })),
  };
}

describe("resolveEncarteImages", () => {
  const bodies: Record<string, Uint8Array> = {
    "https://img.test/a.png": PNG,
    "https://img.test/b.jpg": JPEG,
    "https://img.test/c.webp": WEBP,
    "https://img.test/logo.gif": GIF,
  };
  const fetcher: ImageFetcher = vi.fn(async (url: string) => {
    const body = bodies[url];
    return body ? { contentType: "image/png", body: buf(body), finalUrl: url } : null;
  });

  it("troca URLs por data URI, descarta webp e o que falhou", async () => {
    const out = await resolveEncarteImages(
      encarte(["https://img.test/a.png", "https://img.test/b.jpg", "https://img.test/c.webp", "https://img.test/404.png", "http://img.test/a.png", null], "https://img.test/logo.gif"),
      { fetcher }
    );
    expect(out.items[0].imageUrl?.startsWith("data:image/png;base64,")).toBe(true);
    expect(out.items[1].imageUrl?.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(out.items[2].imageUrl).toBeNull(); // webp
    expect(out.items[3].imageUrl).toBeNull(); // falhou
    expect(out.items[4].imageUrl).toBeNull(); // http
    expect(out.items[5].imageUrl).toBeNull();
    expect(out.market.logoUrl?.startsWith("data:image/gif;base64,")).toBe(true);
  });

  it("busca cada URL uma vez só", async () => {
    const f = vi.fn(fetcher);
    await resolveEncarteImages(encarte(["https://img.test/a.png", "https://img.test/a.png", "https://img.test/a.png"]), { fetcher: f });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("respeita o limite de buscas simultâneas", async () => {
    let active = 0;
    let peak = 0;
    const slow: ImageFetcher = async (url) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { contentType: "image/png", body: buf(PNG), finalUrl: url };
    };
    const urls = Array.from({ length: 20 }, (_, i) => `https://img.test/${i}.png`);
    await resolveEncarteImages(encarte(urls), { fetcher: slow, concurrency: 3 });
    expect(peak).toBeLessThanOrEqual(3);
  });

  it("erro na busca vira placeholder, não derruba", async () => {
    const boom: ImageFetcher = async () => {
      throw new Error("rede");
    };
    const out = await resolveEncarteImages(encarte(["https://img.test/a.png"]), { fetcher: boom });
    expect(out.items[0].imageUrl).toBeNull();
  });

  it("com pageIndex só busca as fotos daquela página", async () => {
    const f = vi.fn(fetcher);
    const urls = Array.from({ length: 9 }, (_, i) => `https://img.test/a.png?${i}`);
    // quadrado grade = 4 por página; página 2 = itens 4..7
    const out = await resolveEncarteImages(encarte(urls), { fetcher: f, pageIndex: 1 });
    expect(f.mock.calls.map((c) => c[0])).toEqual(urls.slice(4, 8));
    expect(out.items[0].imageUrl).toBeNull();
  });

  it("aceita data URI de tipo suportado e recusa os outros", async () => {
    const png = `data:image/png;base64,${Buffer.from(PNG).toString("base64")}`;
    const fakePng = `data:image/png;base64,${Buffer.from(WEBP).toString("base64")}`;
    const svg = `data:image/svg+xml;base64,${Buffer.from("<svg/>").toString("base64")}`;
    const out = await resolveEncarteImages(encarte([png, fakePng, svg]), { fetcher });
    expect(out.items.map((i) => i.imageUrl)).toEqual([png, null, null]);
  });
});
