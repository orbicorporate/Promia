// Gera as miniaturas do construtor em public/miniaturas.
//   estilo-<id>   a caixa (ou os cartões do estilo) em destaque, 4:3
//   fundo-<id>    só o fundo, sem título nem produtos, 4:3
//   pronto-<slug> a arte completa de cada visual pronto, quadrada
// Uso: npx tsx --tsconfig tsconfig.json scripts/gerar-miniaturas.tsx [prontos]
// As frutas são desenhos em código no lugar de fotos reais.
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ImageResponse } from "next/og";
import { loadEncarteFonts } from "@/lib/encarte/fonts";
import { renderModelo } from "@/lib/encarte/modelos";
import { renderEncartePage } from "@/lib/encarte/render";
import { FUNDOS_ARTE } from "@/lib/encarte/modelos/fundos-arte";
import { carregarFundoArte } from "@/lib/encarte/modelos/fundo-arte";
import { CENARIO_IDS } from "@/lib/encarte/modelos/cenarios";
import { BOXES } from "@/lib/encarte/modelos/boxes";
import { brilhoTokens, fundoBrilho, Img } from "@/lib/encarte/modelos/brilho";
import { carregarEmblema } from "@/lib/encarte/modelos/emblema";
import { VISUAIS_PRONTOS } from "@/lib/encarte/prontos";
import { ENCARTE_MODELOS } from "@/lib/encarte/types";
import type { EncarteData, EncarteFundo, EncarteItem } from "@/lib/encarte/types";
import { frutaUri } from "./frutas";

const OUT = path.join(process.cwd(), "public", "miniaturas");
const FUNDOS_BASE = ["raios", "bokeh", "diagonal", "aros", "kraft", "madeira", "estudio", "vinheta", "xadrez", "feira"];
const MARKET = { name: "Mercado Bom Preço", colorPrimary: "#15803d", whatsapp: "(15) 99999-0000", city: "Votorantim - SP", address: "Av. Central, 100", instagram: "bompreco" };

type Fonts = Awaited<ReturnType<typeof loadEncarteFonts>>;

async function itens(): Promise<EncarteItem[]> {
  const keys = ["banana|Banana prata|6.99|8.99", "tomate|Tomate italiano|7.49|9.99", "maca|Maçã Fuji|8.99|11.9", "laranja|Laranja pera|2.99|4.49"];
  const out: EncarteItem[] = [];
  for (const k of keys) {
    const [f, nm, p, o] = k.split("|");
    out.push({ name: nm, price: +p, oldPrice: +o, highlight: false, unit: "kg", imageUrl: await frutaUri(f) });
  }
  return out;
}

async function dados(modelo: string | null, fundo: string | null, emblema: string | null, themeKey: string): Promise<EncarteData> {
  return {
    id: "mini",
    name: "Mini",
    headline: "Ofertas da semana",
    format: "quadrado",
    layout: "grade",
    modelo: modelo as EncarteData["modelo"],
    fundo: fundo as EncarteData["fundo"],
    emblema,
    emblemaImg: emblema ? await carregarEmblema(emblema) : null,
    fundoArte: fundo && fundo.startsWith("ar") ? await carregarFundoArte(fundo) : null,
    themeKey,
    validFrom: "2026-10-14",
    validUntil: "2026-10-14",
    market: MARKET,
    items: await itens(),
  } as EncarteData;
}

async function png(element: React.ReactElement, w: number, h: number, fonts: Fonts) {
  return new Uint8Array(await new ImageResponse(element, { width: w, height: h, fonts }).arrayBuffer());
}

async function salvar(arquivo: string, bruto: Uint8Array | Buffer, largura: number, crop?: { left: number; top: number; width: number; height: number }) {
  let img = sharp(bruto);
  if (crop) img = img.extract(crop);
  const webp = await img.resize(largura).webp({ quality: 78, effort: 4 }).toBuffer();
  writeFileSync(path.join(OUT, arquivo), webp);
  console.log(arquivo, webp.length);
}

async function pagina(d: EncarteData, fonts: Fonts) {
  const page = (d.modelo ? renderModelo(d, 0) : null) ?? renderEncartePage(d, 0);
  if (!page) throw new Error("sem página");
  return png(page.element, page.width, page.height, fonts);
}

(async () => {
  // "prontos" gera só as combinações prontas e deixa o resto como está
  const soProntos = process.argv.includes("prontos");
  if (soProntos) {
    mkdirSync(OUT, { recursive: true });
    for (const f of readdirSync(OUT)) if (f.startsWith("pronto-")) rmSync(path.join(OUT, f));
  } else {
    rmSync(OUT, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
  }
  const fonts = await loadEncarteFonts();
  const its = await itens();
  const t = brilhoTokens(null, MARKET, "ofertas");

  if (!soProntos) {
  // caixas: as duas caixas lado a lado sobre um fundo neutro, bem grandes
  for (const b of BOXES) {
    const bw = 196;
    const bh = Math.round(bw / b.aspect);
    const el = (
      <div style={{ display: "flex", width: 440, height: 330, alignItems: "center", justifyContent: "center", gap: 16, background: "linear-gradient(160deg,#f3f1ec,#dcd8cf)" }}>
        {[its[0], its[2]].map((item, i) => (
          <div key={i} style={{ display: "flex", width: bw, height: bh }}>
            {b.render({ t, item, w: bw, h: bh, s: Math.max(0.5, Math.min(1.6, bw / 300)), wide: false, index: i })}
          </div>
        ))}
      </div>
    );
    await salvar(`estilo-${b.id}.webp`, await png(el, 440, 330, fonts), 440);
  }

  // outros estilos: recorte da área dos produtos na página
  const recorte = { left: 30, top: 300, width: 1020, height: 765 };
  await salvar("estilo-classico.webp", await pagina(await dados(null, null, null, "ofertas"), fonts), 440, recorte);
  for (const m of ENCARTE_MODELOS) {
    if (m.startsWith("cx")) continue;
    await salvar(`estilo-${m}.webp`, await pagina(await dados(m, null, null, "ofertas"), fonts), 440, recorte);
  }

  // fundos: só o fundo
  for (const f of [...FUNDOS_BASE, ...CENARIO_IDS]) {
    const el = (
      <div style={{ display: "flex", width: 440, height: 330 }}>
        <Img src={fundoBrilho(440, 330, t, f as EncarteFundo, 0.5, 0.35)} w={440} h={330} />
      </div>
    );
    await salvar(`fundo-${f}.webp`, await png(el, 440, 330, fonts), 440);
  }

  }

  // fundos de arte: o cabeçalho sobre a cor do corpo
  for (const a of FUNDOS_ARTE) {
    const topo = await sharp(path.join(process.cwd(), "public", "fundos", "arte", `${a.slug}-topo.webp`)).resize({ width: 440 }).png().toBuffer();
    const img = await sharp({ create: { width: 440, height: 330, channels: 3, background: a.meio } }).composite([{ input: topo, top: 0, left: 0 }]).webp({ quality: 82 }).toBuffer();
    writeFileSync(path.join(OUT, `fundo-${a.id}.webp`), img);
  }

  // visuais prontos: a arte completa
  for (const v of VISUAIS_PRONTOS) {
    await salvar(`pronto-${v.slug}.webp`, await pagina(await dados(v.modelo, v.fundo, v.emblema, v.themeKey), fonts), 360);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
