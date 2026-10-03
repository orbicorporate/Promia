// Gera PNGs de amostra do motor de encarte para revisão visual, sem rede e
// sem banco: produtos da planilha de teste, fotos de produto desenhadas
// aqui mesmo (embalagens estilizadas) e um logo fictício.
//
//   npx tsx scripts/amostras-encarte.tsx [pasta-de-saída]
//
// Saída padrão: ../amostras-encarte (ao lado do repositório).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { parseProductSpreadsheet, type ParsedProduct } from "../lib/products";
import { renderEncartePng } from "../lib/encarte/png";
import { loadEncarteFonts } from "../lib/encarte/fonts";
import { FONT_DISPLAY, FONT_TEXT } from "../lib/encarte/render";
import type { EncarteData, EncarteFormat, EncarteItem, EncarteLayout, EncarteMarket } from "../lib/encarte/types";

const OUT = path.resolve(process.argv[2] ?? path.join(process.cwd(), "..", "amostras-encarte"));

const CATEGORY_COLORS: Record<string, [string, string]> = {
  Mercearia: ["#C62828", "#FFE082"],
  "Laticínios": ["#1565C0", "#E3F2FD"],
  "Açougue": ["#B71C1C", "#FFCDD2"],
  Hortifruti: ["#2E7D32", "#C5E1A5"],
  Bebidas: ["#0D47A1", "#FFCA28"],
  Limpeza: ["#00838F", "#B2EBF2"],
  Higiene: ["#6A1B9A", "#E1BEE7"],
  Padaria: ["#8D6E63", "#FFE0B2"],
};

async function toDataUri(res: Response): Promise<string> {
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}

// "foto" de produto: embalagem estilizada em fundo branco, como as fotos
// de catálogo que o Promia encontra na busca
async function productPhoto(p: ParsedProduct, fonts: Awaited<ReturnType<typeof loadEncarteFonts>>): Promise<string> {
  const [main, light] = CATEGORY_COLORS[p.category ?? ""] ?? ["#455A64", "#CFD8DC"];
  const short = p.name.split(" ").slice(0, 2).join(" ");
  const isFresh = p.category === "Hortifruti" || p.category === "Açougue" || p.unit === "kg";
  const isBottle = p.category === "Bebidas" || /shampoo|amaciante|detergente|sanit|óleo|leite integral/i.test(p.name);
  const el = isFresh ? (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", width: 300, height: 220, borderRadius: 140, background: `radial-gradient(circle at 35% 35%, ${light}, ${main})`, alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 40 }}>
        {short.split(" ")[0]}
      </div>
    </div>
  ) : isBottle ? (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", width: 60, height: 50, background: main, borderRadius: 10 }} />
      <div style={{ display: "flex", flexDirection: "column", width: 170, height: 300, background: main, borderRadius: 40, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", width: 170, height: 110, background: light, alignItems: "center", justifyContent: "center", color: main, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 30, textAlign: "center" }}>{p.brand ?? short}</div>
      </div>
    </div>
  ) : (
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", width: 250, height: 320, background: main, borderRadius: 18, alignItems: "center", justifyContent: "space-between", padding: 20 }}>
        <div style={{ display: "flex", color: "#FFFFFF", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 38 }}>{p.brand ?? "Marca"}</div>
        <div style={{ display: "flex", width: 210, height: 120, background: light, borderRadius: 60, alignItems: "center", justifyContent: "center", color: main, fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 26, textAlign: "center" }}>{short}</div>
      </div>
    </div>
  );
  return toDataUri(new ImageResponse(el, { width: 400, height: 400, fonts }));
}

async function logo(fonts: Awaited<ReturnType<typeof loadEncarteFonts>>): Promise<string> {
  return toDataUri(
    new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", width: 120, height: 120, borderRadius: 60, background: "#E53935", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 70 }}>B</div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 16 }}>
          <div style={{ display: "flex", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 52, color: "#1B5E20", lineHeight: 1 }}>BOM</div>
          <div style={{ display: "flex", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 52, color: "#E53935", lineHeight: 1 }}>PREÇO</div>
        </div>
      </div>,
      { width: 360, height: 150, fonts }
    )
  );
}

function round90(n: number) {
  return Math.floor(n) + 0.9;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const fonts = await loadEncarteFonts();
  const buf = await readFile(path.join(process.cwd(), "tests", "fixtures", "produtos-teste-promia.xlsx"));
  const parsed = await parseProductSpreadsheet(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, "produtos.xlsx");
  const products = parsed.products;

  const photos = await Promise.all(products.map((p) => productPhoto(p, fonts)));
  const items: (EncarteItem & { category: string | null })[] = products.map((p, i) => {
    const regular = p.price ?? 9.9;
    const promo = i % 3 === 0 ? Math.max(0.99, round90(regular * 0.8) - 1) : regular;
    return {
      name: p.name,
      brand: p.brand,
      unit: p.unit,
      // um em cada 7 sem foto, para ver o placeholder
      imageUrl: i % 7 === 5 ? null : photos[i],
      price: Math.round(promo * 100) / 100,
      oldPrice: i % 3 === 0 ? regular : null,
      highlight: p.name.startsWith("Contrafilé") || p.name.startsWith("Café"),
      limitQty: i % 5 === 1 ? 3 : null,
      label: i === 26 ? "Leve 3 pague 2" : i === 8 ? "Só hoje" : null,
      category: p.category,
    };
  });

  const marketLogo = await logo(fonts);
  const baseMarket: EncarteMarket = {
    name: "Supermercado Bom Preço",
    logoUrl: marketLogo,
    colorPrimary: "#1B5E20",
    colorSecondary: "#E53935",
    tagline: "O melhor preço da região",
    address: "Av. São Paulo, 1234 - Centro",
    city: "Sorocaba/SP",
    whatsapp: "(15) 99876-5432",
    instagram: "@bompreco.soro",
    openingHours: "Seg a sáb 7h às 22h · Dom 7h às 13h",
  };

  // casos difíceis: nome enorme, preço de milhar, unidade longa, tudo junto
  const stress: EncarteItem[] = [
    { name: "Café Torrado e Moído Extraforte Embalagem Econômica Família 1kg", brand: "Pilão Tradicional", imageUrl: photos[4], price: 1299.9, oldPrice: 1599.9, highlight: true, limitQty: 2, label: "Leve 3 pague 2" },
    { name: "Banana Prata", unit: "bdj", imageUrl: null, price: 6.99, oldPrice: 8.99, highlight: false, label: "Só hoje" },
    { name: "Óleo", brand: "Soya", unit: "un", imageUrl: photos[5], price: 0.99, highlight: false, limitQty: 12 },
    { name: "Papel Higiênico Folha Dupla Neutro Leve 12 Pague 11 rolos 30m", brand: "Neve", imageUrl: photos[34], price: 24.9, oldPrice: 24.95, highlight: false },
    { name: "Picanha Bovina Maturada Angus Peça Inteira Resfriada", brand: "Friboi 1953", unit: "kg", imageUrl: photos[15], price: 109.9, oldPrice: 139.9, highlight: false },
    { name: "Água", unit: "fd", imageUrl: photos[29], price: 12.5, highlight: false },
    { name: "Refrigerante Guaraná", brand: "Guaraná Antarctica", imageUrl: photos[26], price: 8.99, oldPrice: 10.99, highlight: false, limitQty: 6 },
  ];

  const byCat = (...cats: string[]) => items.filter((i) => cats.includes(i.category ?? ""));
  const enc = (o: Partial<EncarteData> & { format: EncarteFormat; layout: EncarteLayout }): EncarteData => ({
    id: "amostra",
    name: "Amostra",
    themeKey: "ofertas",
    validFrom: "2026-10-03",
    validUntil: "2026-10-09",
    market: baseMarket,
    items,
    ...o,
  });

  const samples: [string, EncarteData, number?][] = [
    ["feed-grade", enc({ format: "feed", layout: "grade" })],
    ["feed-grade-pagina-7", enc({ format: "feed", layout: "grade" }), 6],
    ["feed-destaque", enc({ format: "feed", layout: "destaque" })],
    ["feed-lista", enc({ format: "feed", layout: "lista", themeKey: "fim-de-semana", market: { ...baseMarket, colorPrimary: null, logoUrl: null } })],
    ["story-grade", enc({ format: "story", layout: "grade", themeKey: "bebidas", items: byCat("Bebidas", "Mercearia") })],
    ["story-destaque", enc({ format: "story", layout: "destaque", themeKey: "acougue", items: byCat("Açougue") })],
    ["quadrado-destaque", enc({ format: "quadrado", layout: "destaque", themeKey: "padaria", items: byCat("Padaria", "Laticínios"), market: { ...baseMarket, colorPrimary: "#FFD600" } })],
    ["quadrado-grade", enc({ format: "quadrado", layout: "grade", themeKey: "limpeza", items: byCat("Limpeza", "Higiene") })],
    ["a4-grade", enc({ format: "a4", layout: "grade" })],
    ["a4-lista", enc({ format: "a4", layout: "lista", themeKey: "natal" })],
    ["tema-hortifruti", enc({ format: "feed", layout: "grade", themeKey: "hortifruti", headline: null, items: byCat("Hortifruti").map((i, k) => ({ ...i, oldPrice: k % 2 ? null : i.price * 1.3 })), validFrom: "2026-10-07", validUntil: "2026-10-07" })],
    ["tema-acougue", enc({ format: "feed", layout: "destaque", themeKey: "acougue", items: byCat("Açougue"), market: { ...baseMarket, colorPrimary: "#7B1F1F", logoUrl: null } })],
    ["tema-dia-das-criancas", enc({ format: "story", layout: "grade", themeKey: "dia-das-criancas", items: byCat("Mercearia", "Laticínios"), validFrom: null })],
    ["tema-black-friday", enc({ format: "feed", layout: "destaque", themeKey: "black-friday", market: { ...baseMarket, colorPrimary: "#000000" }, items: items.map((i) => ({ ...i, oldPrice: i.oldPrice ?? Math.round(i.price * 140) / 100 })) })],
    ["tema-festa-junina", enc({ format: "quadrado", layout: "lista", themeKey: "festa-junina", items: byCat("Mercearia") })],
    ["tema-dia-das-maes", enc({ format: "feed", layout: "grade", themeKey: "dia-das-maes", headline: "Mãe merece o melhor", subheadline: "Ofertas especiais até domingo", items: byCat("Higiene", "Padaria", "Laticínios") })],
    ["tema-pascoa", enc({ format: "feed", layout: "grade", themeKey: "pascoa", items: byCat("Mercearia").slice(3) })],
    ["vazio", enc({ format: "feed", layout: "grade", items: [] })],
    ["estresse-feed-grade", enc({ format: "feed", layout: "grade", items: stress })],
    ["estresse-a4-destaque", enc({ format: "a4", layout: "destaque", items: stress, market: { ...baseMarket, name: "Mercadinho São Judas Tadeu de Votorantim", logoUrl: null, colorPrimary: "#FFFFFF", tagline: null } })],
    ["estresse-story-lista", enc({ format: "story", layout: "lista", themeKey: "aniversario", items: stress, headline: "Aniversário de 25 anos com preços inacreditáveis em toda a loja", subheadline: "" })],
  ];

  // AMOSTRAS=feed-grade,a4-lista gera só essas
  const only = process.env.AMOSTRAS?.split(",").map((s) => s.trim()).filter(Boolean);
  for (const [name, data, pageIndex = 0] of samples) {
    if (only?.length && !only.includes(name)) continue;
    const t = Date.now();
    const out = await renderEncartePng(data, pageIndex);
    if (!out) throw new Error(`${name}: página ${pageIndex + 1} não existe`);
    await writeFile(path.join(OUT, `${name}.png`), out.png);
    console.log(`${name}.png  ${out.width}x${out.height}  página ${out.pageIndex + 1}/${out.pageCount}  ${Math.round(out.png.byteLength / 1024)} KB  ${Date.now() - t} ms`);
  }
  console.log(`amostras em ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
