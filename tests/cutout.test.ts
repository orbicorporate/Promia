import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { cutoutProductPhoto } from "@/lib/encarte/cutout";

// produto sintético: lata vermelha com rótulo branco no meio, sombra cinza embaixo, sobre fundo branco
async function canFoto(bg = "#ffffff") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${bg}"/>
  <ellipse cx="200" cy="350" rx="110" ry="14" fill="#d9d9d9"/>
  <rect x="120" y="60" width="160" height="280" rx="24" fill="#c8102e"/>
  <rect x="140" y="170" width="120" height="90" fill="#ffffff"/>
  <rect x="150" y="190" width="100" height="14" fill="#c8102e"/></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function alphaAt(png: Buffer, fx: number, fy: number) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const x = Math.min(info.width - 1, Math.round(info.width * fx));
  const y = Math.min(info.height - 1, Math.round(info.height * fy));
  return { a: data[(y * info.width + x) * 4 + 3], w: info.width, h: info.height };
}

describe("recorte de foto de produto", () => {
  it("tira o fundo branco, mantém o rótulo branco por dentro e corta a folga", async () => {
    const out = await cutoutProductPhoto(await canFoto());
    expect(out).not.toBeNull();
    const meta = await sharp(out!).metadata();
    expect(meta.hasAlpha).toBe(true);
    // a lata ocupa 160x280 de 400x400, então o recorte fica bem mais estreito que a foto
    expect(meta.width!).toBeLessThan(220);
    expect(meta.height!).toBeLessThan(320);
    expect((await alphaAt(out!, 0.01, 0.01)).a).toBe(0); // canto: fundo
    expect((await alphaAt(out!, 0.5, 0.15)).a).toBe(255); // corpo da lata
    expect((await alphaAt(out!, 0.5, 0.5)).a).toBe(255); // rótulo branco por dentro continua opaco
  });

  it("aceita fundo cinza claro", async () => {
    expect(await cutoutProductPhoto(await canFoto("#f1f1f1"))).not.toBeNull();
  });

  it("não recorta foto de ambiente com fundo colorido", async () => {
    expect(await cutoutProductPhoto(await canFoto("#2f7d32"))).toBeNull();
  });

  it("não quebra com bytes que não são imagem", async () => {
    expect(await cutoutProductPhoto(Buffer.from("isso não é uma imagem"))).toBeNull();
  });
});
