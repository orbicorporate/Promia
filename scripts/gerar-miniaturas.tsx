// Gera as miniaturas do construtor (estilos e fundos) em public/miniaturas.
// Uso: npx tsx --tsconfig tsconfig.json scripts/gerar-miniaturas.tsx
// Usa frutas desenhadas em código no lugar de fotos reais.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { loadEncarteFonts } from "@/lib/encarte/fonts";
import { renderModelo } from "@/lib/encarte/modelos";
import { renderEncartePage } from "@/lib/encarte/render";
import { CENARIO_IDS } from "@/lib/encarte/modelos/cenarios";
import { ENCARTE_MODELOS } from "@/lib/encarte/types";
import type { EncarteData } from "@/lib/encarte/types";
import { frutaUri } from "./frutas";

const OUT = path.join(process.cwd(), "public", "miniaturas");
const FUNDOS_BASE = ["raios", "bokeh", "diagonal", "aros", "kraft", "madeira", "estudio", "vinheta", "xadrez", "feira"];

async function dados(modelo: string | null, fundo: string | null): Promise<EncarteData> {
  const keys = ["banana|Banana prata|6.99|8.99", "tomate|Tomate italiano|7.49|9.99", "maca|Maçã Fuji|8.99|11.9", "laranja|Laranja pera|2.99|4.49"];
  const items = [];
  for (const k of keys) {
    const [f, nm, p, o] = k.split("|");
    items.push({ name: nm, price: +p, oldPrice: +o, highlight: false, unit: "kg", imageUrl: await frutaUri(f) });
  }
  return {
    id: "mini",
    name: "Mini",
    headline: "Ofertas da semana",
    format: "quadrado",
    layout: "grade",
    modelo: modelo as EncarteData["modelo"],
    fundo: fundo as EncarteData["fundo"],
    themeKey: "hortifruti",
    validFrom: "2026-10-14",
    validUntil: "2026-10-14",
    market: { name: "Mercado Bom Preço", colorPrimary: "#15803d", whatsapp: "(15) 99999-0000", city: "Votorantim - SP", address: "Av. Central, 100", instagram: "bompreco" },
    items,
  } as EncarteData;
}

async function gerar(arquivo: string, d: EncarteData, fonts: Awaited<ReturnType<typeof loadEncarteFonts>>) {
  const page = (d.modelo ? renderModelo(d, 0) : null) ?? renderEncartePage(d, 0);
  if (!page) throw new Error(`sem página: ${arquivo}`);
  const png = new Uint8Array(await new ImageResponse(page.element, { width: page.width, height: page.height, fonts }).arrayBuffer());
  const webp = await sharp(png).resize(300).webp({ quality: 72, effort: 4 }).toBuffer();
  writeFileSync(path.join(OUT, arquivo), webp);
  console.log(arquivo, webp.length);
}

(async () => {
  mkdirSync(OUT, { recursive: true });
  const fonts = await loadEncarteFonts();
  await gerar("estilo-classico.webp", await dados(null, null), fonts);
  for (const m of ENCARTE_MODELOS) await gerar(`estilo-${m}.webp`, await dados(m, null), fonts);
  for (const f of [...FUNDOS_BASE, ...CENARIO_IDS]) await gerar(`fundo-${f}.webp`, await dados("vitrine", f), fonts);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
