import { cenarioSvg } from "./cenarios";
import { fundoArtePorId, type FundoArteMeta } from "./fundos-arte";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { capacidadeGrade, specEscalada } from "../formats";
import { clampEscala } from "../emblema-escala";
import { resolverValidade } from "../validade";
import { alturaValidade, ValidadeEl } from "./validade-el";
import { getPage } from "../paginate";
import { discountPercent, effectiveOldPrice, formatBRL, priceParts, unitSuffix } from "../price";
import { marketInitials } from "../render";
import { getTheme } from "../themes";
import { measureText, validityLabel, validityParts, wrapMeasured } from "../text";
import type { EncarteData, EncarteFundo, EncarteItem, EncarteMarket } from "../types";
import type { CoresEmblema } from "./emblema";
import { Selo, fitFont } from "./formas";
import { tokensFor, type Tokens } from "./paleta";
import { estudio, kraft, madeira, sombraChao } from "./texturas";
import { FONT_ANTON, FONT_BALOO, FONT_LILITA } from "./tipografia";

// Kit dos modelos "brilhantes": fundo com degradê forte, luz e raios,
// cartões com sombra, etiquetas de preço com relevo e o emblema da campanha
// como título. As cores saem do emblema (paleta extraída do logo), então o
// mesmo desenho muda de clima conforme a campanha: verde de hortifrúti,
// vermelho de ofertão, azul de sábado, preto e laranja de Black Friday.

export const row: CSSProperties = { display: "flex", flexDirection: "row" };
export const col: CSSProperties = { display: "flex", flexDirection: "column" };
export const r = Math.round;

export type Pg = { element: ReactElement; width: number; height: number; pageIndex: number; pageCount: number };

// ---------------------------------------------------------------- cores

function hex2(n: number) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

// h 0-360, s e l 0-100
export function hsl(h: number, s: number, l: number): string {
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${hex2(f(0) * 255)}${hex2(f(8) * 255)}${hex2(f(4) * 255)}`;
}

function hueOf(hex: string): number {
  const v = hex.replace("#", "");
  const R = parseInt(v.slice(0, 2), 16) / 255;
  const G = parseInt(v.slice(2, 4), 16) / 255;
  const B = parseInt(v.slice(4, 6), 16) / 255;
  const max = Math.max(R, G, B);
  const d = max - Math.min(R, G, B);
  if (d === 0) return 120;
  let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

export type BT = {
  hue: number;
  neutro: boolean;
  bg0: string; // topo do fundo
  bg1: string;
  bg2: string; // base do fundo
  glow: string; // luz atrás do emblema
  card0: string;
  card1: string;
  cardInk: string;
  cardMuted: string;
  pillA: string; // etiqueta de preço
  pillB: string;
  pillEdge: string;
  pillInk: string;
  pillRing: string;
  sealA: string; // selo redondo escuro
  sealB: string;
  ring0: string;
  ring1: string;
  gold: string;
  hot0: string; // tag de desconto
  hot1: string;
  onBg: string;
  barA: string;
  barB: string;
  ink: string;
  market: string;
};

export function brilhoTokens(cores: CoresEmblema | null, market: Pick<EncarteMarket, "colorPrimary" | "colorSecondary">, themeKey: string | null | undefined): BT {
  const base = tokensFor(themeKey, market);
  // emblema amarelo dourado: o fundo usa o segundo matiz do logo quando ele
  // é de outra cor; sem ele, grafite com luz dourada (estilo Black Friday)
  const amarelo = !!cores && !cores.neutro && cores.hue >= 36 && cores.hue <= 62;
  const usa2 = amarelo && !!cores && (cores.hue2 < 30 || cores.hue2 > 70) && cores.hue2 !== cores.hue;
  const neutro = !!cores?.neutro || (amarelo && !usa2);
  const hue = cores ? (usa2 ? cores.hue2 : neutro ? 28 : cores.hue) : hueOf(base.main);
  const quente = !neutro && hue >= 18 && hue <= 62;
  const S = neutro ? 10 : 84;
  const dark = quente || neutro;
  return {
    hue,
    neutro,
    bg0: hsl(hue, neutro ? 3 : S - 4, neutro ? 17 : quente ? 34 : 40),
    bg1: hsl(hue, neutro ? 3 : S, neutro ? 9 : quente ? 22 : 27),
    bg2: hsl(hue, neutro ? 3 : S + 4, neutro ? 3 : quente ? 9 : 11),
    glow: neutro ? "#ff8a1f" : hsl(hue, 96, quente ? 56 : 62),
    card0: "#FFFFFF",
    card1: "#EDF2F7",
    cardInk: hsl(hue, 40, 12),
    cardMuted: hsl(hue, 12, 42),
    pillA: dark ? "#34343c" : "#FFE45C",
    pillB: dark ? "#050507" : "#FFB000",
    pillEdge: dark ? "#000000" : "#A85F00",
    pillInk: dark ? "#FFC531" : hsl(hue, 80, 9),
    pillRing: dark ? "#FFC531" : "#FFFFFF",
    sealA: hsl(hue, 70, 22),
    sealB: hsl(hue, 85, 8),
    ring0: "#FFF1A0",
    ring1: "#E39A00",
    gold: "#FFC928",
    hot0: "#FF4A4A",
    hot1: "#B80F1E",
    onBg: "#FFFFFF",
    barA: hsl(hue, neutro ? 10 : 70, 9),
    barB: hsl(hue, neutro ? 10 : 80, 4),
    ink: hsl(hue, 60, 6),
    market: base.market,
  };
}

// ---------------------------------------------------------------- fundo

const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type EstiloFundo = EncarteFundo;

// Degradê vertical + luz atrás do emblema + textura do estilo + vinheta +
// granulação fina. Tudo em SVG com filtro (o renderizador desenha).
export function fundoBrilho(W: number, H: number, t: BT, estilo: EstiloFundo, cx = 0.5, cy = 0.2, tk?: Tokens): string {
  // cenários desenhados em código (palco, papel, cortinas, festas, departamentos)
  const cen = cenarioSvg(W, H, estilo);
  if (cen) return uri(cen);
  // fundos de material: papel, madeira e estúdio claro
  if (estilo === "kraft") return kraft(W, H, tk?.paper ?? "#d9c3a0");
  if (estilo === "madeira") return madeira(W, H, "#a8743a", 1);
  if (estilo === "estudio") return estudio(W, H, t.bg0, 0.3);
  const rand = rng(Math.round(t.hue * 7 + W));
  const px = W * cx;
  const py = H * cy;
  const parts: string[] = [];
  if (estilo === "raios") {
    const n = 26;
    const R = Math.hypot(W, H);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      parts.push(`<path d="M${px} ${py} L${px + Math.cos(a0) * R} ${py + Math.sin(a0) * R} L${px + Math.cos(a1) * R} ${py + Math.sin(a1) * R} Z" fill="#fff" opacity="0.075"/>`);
    }
  } else if (estilo === "vinheta") {
    const n = 32;
    const R = Math.hypot(W, H);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      parts.push(`<path d="M${px} ${py} L${px + Math.cos(a0) * R} ${py + Math.sin(a0) * R} L${px + Math.cos(a1) * R} ${py + Math.sin(a1) * R} Z" fill="#fff" opacity="0.11"/>`);
    }
    parts.push(`<rect width="${W}" height="${H}" fill="url(#v)"/><rect width="${W}" height="${H}" fill="url(#v)"/>`);
  } else if (estilo === "xadrez") {
    const q = W / 9;
    for (let y = 0; y * q < H; y++) for (let x = 0; x < 9; x++) if ((x + y) % 2 === 0) parts.push(`<rect x="${x * q}" y="${y * q}" width="${q}" height="${q}" fill="#fff" opacity="0.07"/>`);
  } else if (estilo === "feira") {
    // toldo listrado no topo, com barra recortada em arcos
    const n = 12;
    const sw = W / n;
    const bh = H * 0.065;
    for (let i = 0; i < n; i++) {
      const c = i % 2 ? "#FFFFFF" : "#E5412B";
      parts.push(`<path d="M${i * sw} 0 H${(i + 1) * sw} V${bh} A${sw / 2} ${sw / 2} 0 0 1 ${i * sw} ${bh} Z" fill="${c}"/>`);
    }
    parts.push(`<rect width="${W}" height="${bh * 0.35}" fill="#000" opacity="0.12"/>`);
    for (let i = 0; i < 16; i++) parts.push(`<circle cx="${rand() * W}" cy="${bh + rand() * (H - bh)}" r="${(10 + rand() * 50) * (W / 1080)}" fill="#fff" opacity="${0.05 + rand() * 0.07}" filter="url(#b)"/>`);
  } else if (estilo === "bokeh") {
    for (let i = 0; i < 22; i++) {
      const rr = (18 + rand() * 80) * (W / 1080);
      parts.push(`<circle cx="${rand() * W}" cy="${rand() * H}" r="${rr}" fill="${rand() > 0.5 ? t.glow : "#fff"}" opacity="${0.07 + rand() * 0.11}" filter="url(#b)"/>`);
    }
  } else if (estilo === "diagonal") {
    const bw = W * 0.16;
    for (let i = -2; i < 9; i++) {
      const x = i * bw * 1.7;
      parts.push(`<polygon points="${x},${H} ${x + bw},${H} ${x + bw + H * 0.55},0 ${x + H * 0.55},0" fill="#fff" opacity="${i % 2 ? 0.045 : 0.025}"/>`);
    }
  } else {
    for (let i = 1; i <= 7; i++) {
      parts.push(`<circle cx="${px}" cy="${py}" r="${W * 0.14 * i}" fill="none" stroke="#fff" stroke-width="${W * 0.012}" opacity="${0.09 - i * 0.008}"/>`);
    }
  }
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.bg0}"/><stop offset="0.45" stop-color="${t.bg1}"/><stop offset="1" stop-color="${t.bg2}"/></linearGradient>
      <radialGradient id="l" cx="${cx}" cy="${cy}" r="0.62"><stop offset="0" stop-color="${t.glow}" stop-opacity="0.75"/><stop offset="0.5" stop-color="${t.glow}" stop-opacity="0.22"/><stop offset="1" stop-color="${t.glow}" stop-opacity="0"/></radialGradient>
      <radialGradient id="v" cx="0.5" cy="0.45" r="0.78"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
      <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${8 * (W / 1080)}"/></filter>
      <filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.07 0"/></filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <rect width="${W}" height="${H}" fill="url(#l)"/>
    ${parts.join("")}
    <rect width="${W}" height="${H}" fill="url(#v)"/>
    <rect width="${W}" height="${H}" filter="url(#n)"/>
  </svg>`
  );
}

// Corpo do fundo de arte: degradê vertical entre as cores medidas nas duas
// emendas (cabeçalho e rodapé), com as cores de cada ponto da largura nas
// emendas para a transição ficar invisível, e uma luz suave atrás da grade.
export function corpoArte(W: number, H: number, a: FundoArteMeta, topY: number, botY: number, luzCy: number, luzH: number): string {
  const media = (cs: string[]) => {
    const n = cs.map((c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
    return `#${[0, 1, 2].map((k) => Math.round(n.reduce((t, c) => t + c[k], 0) / n.length).toString(16).padStart(2, "0")).join("")}`;
  };
  const stops = (cs: string[]) => cs.map((c, i) => `<stop offset="${(i / (cs.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join("");
  const span = Math.max(1, botY - topY);
  const h1 = topY + span * 0.22;
  const h2 = botY - span * 0.22;
  const luz = a.radial ? 0 : a.claro ? 0.2 : 0.07;
  return uri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="v" gradientUnits="userSpaceOnUse" x1="0" y1="${topY}" x2="0" y2="${botY}"><stop offset="0" stop-color="${media(a.topo)}"/><stop offset="0.5" stop-color="${a.meio}"/><stop offset="1" stop-color="${media(a.base)}"/></linearGradient>
      <linearGradient id="ht" x1="0" y1="0" x2="1" y2="0">${stops(a.topo)}</linearGradient>
      <linearGradient id="hb" x1="0" y1="0" x2="1" y2="0">${stops(a.base)}</linearGradient>
      <linearGradient id="ft" gradientUnits="userSpaceOnUse" x1="0" y1="${topY}" x2="0" y2="${h1}"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
      <linearGradient id="fb" gradientUnits="userSpaceOnUse" x1="0" y1="${h2}" x2="0" y2="${botY}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="mt" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="0" width="${W}" height="${topY}" fill="#fff"/><rect x="0" y="${topY}" width="${W}" height="${h1 - topY}" fill="url(#ft)"/></mask>
      <mask id="mb" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="0" y="${h2}" width="${W}" height="${botY - h2}" fill="url(#fb)"/><rect x="0" y="${botY}" width="${W}" height="${H - botY}" fill="#fff"/></mask>
      ${a.radial ? `<radialGradient id="rd" gradientUnits="userSpaceOnUse" cx="${W / 2}" cy="${(topY + botY) / 2}" r="${W * 0.52}" gradientTransform="translate(${W / 2} ${(topY + botY) / 2}) scale(1 ${(span * 0.62) / (W * 0.52)}) translate(${-W / 2} ${-(topY + botY) / 2})"><stop offset="0" stop-color="${a.radial[0]}"/><stop offset="0.5" stop-color="${a.radial[1]}"/><stop offset="1" stop-color="${a.radial[2]}"/></radialGradient>` : ""}
      <radialGradient id="l" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff" stop-opacity="${luz}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#v)"/>
    ${a.radial ? `<rect width="${W}" height="${H}" fill="url(#rd)"/>` : ""}
    <rect width="${W}" height="${H}" fill="url(#ht)" mask="url(#mt)"/>
    <rect width="${W}" height="${H}" fill="url(#hb)" mask="url(#mb)"/>
    <ellipse cx="${W / 2}" cy="${luzCy}" rx="${W * 0.62}" ry="${Math.max(60, luzH * 0.72)}" fill="url(#l)"/>
  </svg>`
  );
}

// cerca de madeira (rodapé do modelo Cerca)
export function cercaUri(w: number, h: number): string {
  const n = Math.max(8, Math.round(w / 70));
  const pw = w / n;
  const pk = Array.from({ length: n }, (_, i) => {
    const x = i * pw + pw * 0.06;
    const ww = pw * 0.88;
    return `<path d="M${x} ${h} V${h * 0.2} L${x + ww / 2} 0 L${x + ww} ${h * 0.2} V${h} Z" fill="url(#w)" stroke="#5a3410" stroke-opacity="0.55" stroke-width="2"/>`;
  }).join("");
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c98d49"/><stop offset="0.5" stop-color="#e0a35e"/><stop offset="1" stop-color="#b57a3a"/></linearGradient></defs>${pk}<rect x="0" y="${h * 0.42}" width="${w}" height="${h * 0.14}" fill="#9a6226"/></svg>`);
}

// ---------------------------------------------------------------- peças

export function Img({ src, w, h, style }: { src: string; w: number; h: number; style?: CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={r(w)} height={r(h)} alt="" style={{ width: r(w), height: r(h), ...style }} />;
}

// foto recortada com sombra no chão; sem foto, a inicial num círculo
export function Foto({ item, t, w, h, shadow = 0.42 }: { item: EncarteItem; t: BT; w: number; h: number; shadow?: number }) {
  return (
    <div style={{ display: "flex", position: "relative", width: r(w), height: r(h) }}>
      <Img src={sombraChao(r(w), r(h * 0.22), shadow)} w={w * 0.86} h={h * 0.22} style={{ position: "absolute", left: w * 0.07, top: h * 0.8 }} />
      {item.imageUrl ? (
        <Img src={item.imageUrl} w={w} h={h * 0.94} style={{ position: "absolute", left: 0, top: 0, objectFit: "contain" }} />
      ) : (
        <div style={{ ...col, position: "absolute", left: w * 0.2, top: h * 0.08, width: w * 0.6, height: h * 0.74, alignItems: "center", justifyContent: "center", borderRadius: w, backgroundColor: "rgba(0,0,0,0.07)", border: "3px dashed rgba(0,0,0,0.18)", fontFamily: FONT_LILITA, fontSize: r(h * 0.36), color: "rgba(0,0,0,0.28)" }}>
          <div style={{ display: "flex" }}>{item.name.normalize("NFD").replace(/[^A-Za-z]/g, "")[0]?.toUpperCase() ?? "?"}</div>
        </div>
      )}
    </div>
  );
  void t;
}

// Texto do preço: R$ pequeno + inteiro grande + centavos e unidade.
export function PrecoTexto({ price, unit, maxW, maxH, color, accent, font = FONT_ANTON, variant = "anton400" }: { price: number; unit: string | null | undefined; maxW: number; maxH: number; color: string; accent?: string; font?: string; variant?: "anton400" | "lilita400" }) {
  const p = priceParts(price);
  const u = unitSuffix(unit);
  const hasUnit = !!u;
  // largura relativa ao tamanho do inteiro: cifrão 0,3, centavos 0,46
  const w1 = measureText(p.integer, variant, 1, 0) + measureText(p.cents, variant, 0.46, 0) + measureText(p.currency, variant, 0.3, 0) + 0.1;
  const size = Math.max(10, Math.floor(Math.min(maxH / (hasUnit ? 1.02 : 0.98), maxW / w1)));
  const cents = r(size * 0.46);
  const cifra = r(size * 0.3);
  return (
    <div style={{ ...row, alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: font, fontSize: cifra, color: accent ?? color, marginTop: r(size * 0.1), marginRight: r(size * 0.04), lineHeight: 1 }}>{p.currency}</div>
      <div style={{ display: "flex", fontFamily: font, fontSize: size, color, lineHeight: 1, letterSpacing: -size * 0.01 }}>{p.integer}</div>
      <div style={{ ...col, marginTop: r(size * 0.07), marginLeft: r(size * 0.03), alignItems: "flex-start" }}>
        <div style={{ display: "flex", fontFamily: font, fontSize: cents, color, lineHeight: 1 }}>{p.cents}</div>
        {hasUnit ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.2), color: accent ?? color, lineHeight: 1, marginTop: r(size * 0.04) }}>{u}</div> : null}
      </div>
    </div>
  );
}

// Etiqueta de preço com relevo (degradê, brilho no topo e sombra dura)
export function Pilula({ t, price, unit, w, h, s, radius }: { t: BT; price: number; unit: string | null | undefined; w: number; h: number; s: number; radius?: number }) {
  const rad = radius ?? h / 2;
  return (
    <div style={{ display: "flex", position: "relative", width: r(w), height: r(h), alignItems: "center", justifyContent: "center", borderRadius: rad, backgroundImage: `linear-gradient(180deg, ${t.pillA}, ${t.pillB})`, border: `${r(3 * s)}px solid ${t.pillRing}`, boxShadow: `0 ${r(6 * s)}px 0 ${t.pillEdge}, 0 ${r(14 * s)}px ${r(22 * s)}px rgba(0,0,0,0.38)` }}>
      <div style={{ display: "flex", position: "absolute", left: r(h * 0.12), top: r(2 * s), width: r(w - h * 0.24), height: r(h * 0.36), borderRadius: h, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))" }} />
      <PrecoTexto price={price} unit={unit} maxW={w * 0.86} maxH={h * 0.74} color={t.pillInk} />
    </div>
  );
}

// Selo redondo escuro com aro dourado (preço sobre o canto do cartão)
export function SeloPreco({ t, price, unit, d, s }: { t: BT; price: number; unit: string | null | undefined; d: number; s: number }) {
  const ring = r(d * 0.055);
  return (
    <div style={{ display: "flex", position: "relative", width: r(d), height: r(d), alignItems: "center", justifyContent: "center", borderRadius: d, backgroundImage: `linear-gradient(145deg, ${t.ring0}, ${t.ring1})`, boxShadow: `0 ${r(8 * s)}px ${r(18 * s)}px rgba(0,0,0,0.45)` }}>
      <div style={{ display: "flex", width: r(d - ring * 2), height: r(d - ring * 2), borderRadius: d, alignItems: "center", justifyContent: "center", backgroundImage: `radial-gradient(circle at 35% 25%, ${t.sealA}, ${t.sealB})` }}>
        <PrecoTexto price={price} unit={unit} maxW={d * 0.78} maxH={d * 0.56} color="#FFFFFF" accent={t.gold} />
      </div>
    </div>
  );
}

// Tag de desconto em seta (vermelha, com brilho)
export function TagDesconto({ t, pct, w, s }: { t: BT; pct: number; w: number; s: number }) {
  const h = w * 1.15;
  const id = `h${pct}`;
  return (
    <div style={{ display: "flex", position: "relative", width: r(w), height: r(h), alignItems: "center", justifyContent: "center", filter: "none" }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.hot0} />
            <stop offset="1" stopColor={t.hot1} />
          </linearGradient>
        </defs>
        <path d={`M${w * 0.08} 0 H${w * 0.92} Q${w} 0 ${w} ${w * 0.08} V${h * 0.74} L${w / 2} ${h} L0 ${h * 0.74} V${w * 0.08} Q0 0 ${w * 0.08} 0 Z`} fill={`url(#${id})`} stroke="#ffffff" strokeWidth={3 * s} strokeLinejoin="round" />
      </svg>
      <div style={{ ...col, alignItems: "center", marginTop: -h * 0.1 }}>
        <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(w * 0.44), color: "#fff", lineHeight: 1 }}>{`${pct}%`}</div>
        <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(w * 0.2), color: "#fff", lineHeight: 1 }}>OFF</div>
      </div>
    </div>
  );
}

// Nome do produto e preço antigo, ajustados à largura
export function NomeProduto({ item, w, size, color, muted, align = "center", maxLines = 2 }: { item: EncarteItem; w: number; size: number; color: string; muted: string; align?: "center" | "flex-start"; maxLines?: number }) {
  const lines = wrapMeasured(item.name, w, "baloo800", size, maxLines);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  return (
    <div style={{ ...col, width: r(w), alignItems: align }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: size, lineHeight: 1.04, color, whiteSpace: "nowrap" }}>
          {l}
        </div>
      ))}
      {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.72), lineHeight: 1.1, color: muted, textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
    </div>
  );
}

// Título de reserva quando o encarte não tem emblema: letras grossas com
// camadas de profundidade e brilho dourado.
export function Titulo3D({ text, w, h, s, t }: { text: string; w: number; h: number; s: number; t: BT }) {
  const up = text.toUpperCase();
  const fs = fitFont(up, "anton400", w, h * 0.8, 2 * s, h * 0.9);
  const depth = Math.max(3, r(fs * 0.07));
  const layer = (dx: number, dy: number, color: string, k: number): ReactNode => (
    <div key={k} style={{ display: "flex", position: "absolute", left: dx, top: dy, fontFamily: FONT_ANTON, fontSize: fs, color, letterSpacing: 2 * s, lineHeight: 1, whiteSpace: "nowrap" }}>
      {up}
    </div>
  );
  const layers: ReactNode[] = [];
  for (let i = depth; i >= 1; i--) layers.push(layer(i, i * 1.1, i === depth ? "#000000" : t.bg2, i));
  const tw = measureText(up, "anton400", fs, 2 * s);
  return (
    <div style={{ display: "flex", position: "relative", width: r(tw + depth * 2), height: r(fs * 1.1) }}>
      {layers}
      <div style={{ display: "flex", position: "absolute", left: 0, top: 0, fontFamily: FONT_ANTON, fontSize: fs, color: "#FFE45C", letterSpacing: 2 * s, lineHeight: 1, whiteSpace: "nowrap", textShadow: `0 ${r(2 * s)}px 0 #F59E0B` }}>{up}</div>
    </div>
  );
}

// ---------------------------------------------------------------- página

export type CardProps = { t: BT; tk: Tokens; item: EncarteItem; w: number; h: number; s: number; wide: boolean; index: number; claro?: boolean };

export type ConfigModelo = {
  estilo: EstiloFundo;
  Card: (p: CardProps) => ReactElement;
  gap?: number; // entre cartões, em px de 1080
  aspect?: number; // proporção (largura/altura) da caixa: as caixas ficam coladas, com o mesmo respiro dos dois lados
  padX?: number;
  cardMaxRatio?: number; // altura máxima do cartão em relação à altura nominal
  heroScale?: number; // fração da altura da página para o emblema
  cols?: (format: EncarteData["format"]) => number | undefined; // colunas no lugar das do formato
  rodape?: "escuro" | "cerca"; // rodapé: barra escura ou cerca de madeira com barra branca
  overlap?: number; // quanto a grade sobe sobre o cabeçalho (px de 1080)
};

export function compor(data: EncarteData, pageIndex: number, cfg: ConfigModelo): Pg | null {
  const page = getPage(data, pageIndex);
  if (!page) return null;
  const spec = specEscalada(data.format, data.escalaPrevia);
  const W = spec.width;
  const H = spec.height;
  const s = W / 1080;
  const cap = capacidadeGrade(data.format, !!data.modelo);
  const cols = cfg.cols?.(data.format) ?? cap.columns;
  const capRows = Math.ceil(cap.perPage / cols);
  const items = page.items.slice(0, cap.perPage);
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const tk = tokensFor(data.themeKey, data.market);
  const t = brilhoTokens(data.emblemaImg?.cores ?? null, data.market, data.themeKey);
  const theme = getTheme(data.themeKey);
  const headline = (data.headline && data.headline.trim()) || theme.headline;
  const validity = validityLabel(data.validFrom, data.validUntil);
  const vp = validityParts(data.validFrom, data.validUntil);

  const padX = r((cfg.padX ?? 36) * s);
  const tight = !!cfg.aspect;
  const gap = r((tight ? 14 : (cfg.gap ?? 24)) * s);
  // fundo de arte: o cabeçalho e o rodapé são imagens, o corpo é degradê
  const arte = data.fundoArte ? fundoArtePorId(data.fundoArte.id) : null;
  const ak = arte ? W / arte.w : 1;
  const fino = arte?.modo === "fino";
  const cutPx = arte ? r(arte.cut * ak) : 0;
  const cropTop = arte ? (fino ? Math.max(0, cutPx - r(H * 0.19)) : data.format === "quadrado" ? r(cutPx * 0.16) : 0) : 0;
  const embH = fino ? r(Math.min(H * 0.15, W * 0.2)) : 0;
  const rodapeFino = fino ? r(H * 0.115) : 0;
  const faixaH = fino ? 0 : r(76 * s) + (spec.safeBottom ? Math.max(0, spec.safeBottom - r(60 * s)) : 0);
  const footerH = arte ? (fino ? rodapeFino : r((arte.baseH - arte.fade * 0.8) * ak) + faixaH) : r((data.format === "story" ? 140 : 124) * s) + (spec.safeBottom ? Math.max(0, spec.safeBottom - r(60 * s)) : 0);
  const heroFrac = cfg.heroScale ?? (data.format === "quadrado" ? 0.3 : data.format === "story" ? 0.24 : data.format === "a4" ? 0.27 : 0.285);
  const heroH = arte ? cutPx - cropTop + (fino ? r(embH * 0.5) : 0) : r(H * heroFrac) + spec.safeTop;
  // validade: posição, alinhamento, estilo e cor escolhidos (padrão: cheia e branca, na emenda do cabeçalho)
  const val = resolverValidade(data.validade);
  const vEstilo = val.estilo;
  const vPos = val.posicao;
  const vShow = !!vp && validity !== "" && vPos !== "oculto";
  const vh = alturaValidade(vEstilo, s);
  const validH = !vShow ? 0 : vPos === "abaixo" ? vh + r(26 * s) : vPos === "sobre" ? r(vh / 2) : 0;
  const baseExtra = vShow && vPos === "base" ? vh + r(10 * s) : 0;
  const areaTop = heroH + validH + r(10 * s) - r((cfg.overlap ?? 0) * s);
  const areaH = H - areaTop - footerH - r(14 * s) - baseExtra - (cfg.rodape === "cerca" ? r(52 * s) : 0);
  const cellW = r((W - padX * 2 - gap * (cols - 1)) / cols);
  const nominalH = (areaH - gap * (capRows - 1)) / capRows;
  const cardH = tight ? r(Math.min(nominalH, cellW / cfg.aspect!)) : r(Math.min(nominalH * (cfg.cardMaxRatio ?? 1.2), (areaH - gap * (rows - 1)) / rows));
  const cardW = tight ? r(cardH * cfg.aspect!) : cellW;
  const wide = cardW / cardH > 1.15;

  // emblema: escolhe a versão que fica maior na área do cabeçalho
  const em = data.emblemaImg;
  const boxW = arte ? (fino ? W * 0.66 : W * 0.46) : W * 0.9;
  const boxH = arte ? (fino ? embH : (heroH - spec.safeTop) * 0.84) : heroH - spec.safeTop - r(12 * s);
  let emblema: { src: string; w: number; h: number } | null = null;
  if (em) {
    const fit = (a: { w: number; h: number }) => Math.min(boxW / a.w, boxH / a.h);
    const a = em.ilustrado;
    const b = em.horizontal;
    const useB = b && fit(b) * fit(b) * b.w * b.h > fit(a) * fit(a) * a.w * a.h * 1.1;
    const pick = useB && b ? b : a;
    // a proporção do desenho nunca muda: só um fator único para largura e altura
    // (o ajuste do usuário, de 60% a 160%), com teto para não passar da página nem do cabeçalho
    const escala = clampEscala(data.emblemaEscala);
    const teto = Math.min((W * 0.94) / pick.w, (boxH * 1.4) / pick.h);
    const k = Math.min(fit(pick) * escala, teto);
    emblema = { src: pick.src, w: pick.w * k, h: pick.h * k };
  }

  const cx = 0.5;
  const cy = (spec.safeTop + (heroH - spec.safeTop) / 2) / H;

  const grid: ReactElement[] = [];
  for (let rIdx = 0; rIdx < rows; rIdx++) {
    const slice = items.slice(rIdx * cols, rIdx * cols + cols);
    if (!slice.length) break;
    grid.push(
      <div key={rIdx} style={{ ...row, justifyContent: tight || slice.length < cols ? "center" : "space-between", marginTop: rIdx === 0 ? 0 : gap }}>
        {slice.map((it, i) => (
          <div key={i} style={{ display: "flex", marginLeft: (tight || slice.length < cols) && i > 0 ? gap : 0 }}>
            {cfg.Card({ t, tk, item: it, w: cardW, h: cardH, s, wide, index: rIdx * cols + i, claro: arte?.claro })}
          </div>
        ))}
      </div>
    );
  }

  const addr = [data.market.address, data.market.city].filter(Boolean).join(" - ");
  const contact = [data.market.whatsapp ? `WhatsApp ${data.market.whatsapp}` : null, data.market.phone && !data.market.whatsapp ? data.market.phone : null, data.market.instagram ? `@${data.market.instagram.replace(/^@/, "")}` : null].filter(Boolean).join("   ");
  const d = r(84 * s);

  const element = (
    <div style={{ ...col, position: "relative", width: W, height: H, backgroundColor: t.bg1, fontFamily: FONT_BALOO }}>
      {arte && data.fundoArte ? (
        <>
          <Img src={corpoArte(W, H, arte, r(arte.topoH * ak) - cropTop, fino ? H - rodapeFino - r(arte.fade * ak * 0.8) : H - faixaH - r(data.fundoArte.base.h * ak), areaTop + areaH / 2, rows * cardH + gap * (rows - 1))} w={W} h={H} style={{ position: "absolute", left: 0, top: 0 }} />
          <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: W, height: r(arte.topoH * ak) - cropTop, overflow: "hidden" }}>
            <Img src={data.fundoArte.topo.src} w={W} h={r(arte.topoH * ak)} style={{ position: "absolute", left: 0, top: -cropTop }} />
          </div>
          {fino ? (
            <div style={{ display: "flex", position: "absolute", left: 0, top: H - rodapeFino - r(arte.fade * ak * 0.8), width: W, height: rodapeFino + r(arte.fade * ak * 0.8), overflow: "hidden" }}>
              <Img src={data.fundoArte.base.src} w={W} h={r(data.fundoArte.base.h * ak)} style={{ position: "absolute", left: 0, top: 0 }} />
            </div>
          ) : (
            <>
              <Img src={data.fundoArte.base.src} w={W} h={r(data.fundoArte.base.h * ak)} style={{ position: "absolute", left: 0, top: H - faixaH - r(data.fundoArte.base.h * ak) }} />
              <Img src={data.fundoArte.faixa} w={W} h={faixaH} style={{ position: "absolute", left: 0, top: H - faixaH }} />
            </>
          )}
        </>
      ) : (
        <Img src={fundoBrilho(W, H, t, data.fundo ?? cfg.estilo, cx, cy, tk)} w={W} h={H} style={{ position: "absolute", left: 0, top: 0 }} />
      )}

      {/* título: emblema da campanha ou texto em 3D */}
      <div style={{ ...row, position: "absolute", left: 0, top: fino ? cutPx - cropTop - r(embH * 0.5) : spec.safeTop + r(6 * s), width: W, height: fino ? embH : heroH - spec.safeTop, alignItems: "center", justifyContent: "center" }}>
        {emblema ? <Img src={emblema.src} w={emblema.w} h={emblema.h} /> : <Titulo3D text={headline} w={W * 0.86} h={heroH * 0.7} s={s} t={t} />}
      </div>

      {/* validade */}
      {vShow && vp ? (
        <div
          style={{
            ...row,
            position: "absolute",
            left: padX,
            width: W - padX * 2,
            top: vPos === "abaixo" ? heroH + r(8 * s) : vPos === "sobre" ? heroH - r(vh / 2) : H - footerH - r(14 * s) - baseExtra + r(6 * s),
            justifyContent: val.alinhamento === "esquerda" ? "flex-start" : val.alinhamento === "direita" ? "flex-end" : "center",
          }}
        >
          <ValidadeEl vp={vp} estilo={vEstilo} cor={val.cor} s={s} />
        </div>
      ) : null}

      {/* produtos */}
      <div style={{ ...col, position: "absolute", left: padX, top: areaTop, width: W - padX * 2, height: areaH, justifyContent: "center" }}>
        {items.length === 0 ? <div style={{ display: "flex", justifyContent: "center", fontFamily: FONT_BALOO, fontSize: r(34 * s), color: arte?.claro ? "#1b2a22" : "#fff" }}>Adicione produtos para ver o encarte</div> : grid}
      </div>

      {/* rodapé */}
      {arte && fino ? (
        <div style={{ ...row, position: "absolute", left: 0, top: H - (spec.safeBottom ? r(spec.safeBottom * 0.6) : 0) - r(16 * s) - r(68 * s), width: W, height: r(68 * s), alignItems: "center", justifyContent: "center" }}>
          <div style={{ ...row, alignItems: "center", height: r(68 * s), padding: `0 ${r(24 * s)}px 0 ${r(10 * s)}px`, borderRadius: r(34 * s), backgroundColor: "rgba(10,14,22,0.8)", border: `${r(2.5 * s)}px solid ${t.gold}`, boxShadow: `0 ${r(6 * s)}px ${r(16 * s)}px rgba(0,0,0,0.35)` }}>
            {data.market.logoUrl ? (
              <div style={{ ...row, width: r(48 * s), height: r(48 * s), borderRadius: r(48 * s), backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Img src={data.market.logoUrl} w={r(48 * s) * 0.82} h={r(48 * s) * 0.82} style={{ objectFit: "contain" }} />
              </div>
            ) : (
              <Selo kind="festonado" w={r(48 * s)} h={r(48 * s)} fill={t.gold} edge="#ffffff" edgeW={2 * s} lines={[{ text: marketInitials(data.market.name), variant: "lilita400", font: FONT_LILITA, color: t.ink }]} />
            )}
            <div style={{ ...col, marginLeft: r(14 * s) }}>
              <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(26 * s), color: "#fff", letterSpacing: 1 * s, whiteSpace: "nowrap", lineHeight: 1.1 }}>{data.market.name.toUpperCase()}</div>
              {contact || addr ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(18 * s), color: t.gold, whiteSpace: "nowrap", lineHeight: 1.1 }}>{contact || addr}</div> : null}
            </div>
          </div>
        </div>
      ) : arte ? (
        <div style={{ ...row, position: "absolute", left: 0, top: H - faixaH, width: W, height: faixaH - (spec.safeBottom ? r(spec.safeBottom * 0.55) : 0), alignItems: "center", padding: `0 ${padX}px` }}>
          {data.market.logoUrl ? (
            <div style={{ ...row, width: r(60 * s), height: r(60 * s), borderRadius: r(60 * s), backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `${r(3 * s)}px solid ${t.gold}` }}>
              <Img src={data.market.logoUrl} w={r(60 * s) * 0.82} h={r(60 * s) * 0.82} style={{ objectFit: "contain" }} />
            </div>
          ) : (
            <Selo kind="festonado" w={r(60 * s)} h={r(60 * s)} fill={t.gold} edge="#ffffff" edgeW={2.5 * s} lines={[{ text: marketInitials(data.market.name), variant: "lilita400", font: FONT_LILITA, color: t.ink }]} />
          )}
          <div style={{ ...col, marginLeft: r(18 * s), flex: 1 }}>
            <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(32 * s), color: arte.faixaClara ? "#1b2a22" : "#fff", letterSpacing: 1 * s, whiteSpace: "nowrap", lineHeight: 1.1 }}>{data.market.name.toUpperCase()}</div>
            {contact || addr ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), color: arte.faixaClara ? "#1b2a22" : t.gold, whiteSpace: "nowrap", lineHeight: 1.15 }}>{contact || addr}</div> : null}
          </div>
        </div>
      ) : cfg.rodape === "cerca" ? (
        <>
          <Img src={cercaUri(W, r(70 * s))} w={W} h={r(70 * s)} style={{ position: "absolute", left: 0, top: H - footerH - r(60 * s) }} />
          <div style={{ ...row, position: "absolute", left: 0, top: H - footerH + r(10 * s), width: W, height: footerH - r(10 * s), backgroundColor: "#FFFFFF", alignItems: "center", padding: `0 ${padX}px`, paddingBottom: spec.safeBottom ? r(spec.safeBottom * 0.55) : 0 }}>
            {data.market.logoUrl ? (
              <div style={{ ...row, width: d, height: d, borderRadius: d, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `${r(3 * s)}px solid ${t.bg1}` }}>
                <Img src={data.market.logoUrl} w={d * 0.82} h={d * 0.82} style={{ objectFit: "contain" }} />
              </div>
            ) : (
              <Selo kind="festonado" w={d} h={d} fill={t.bg1} edge={t.gold} edgeW={3 * s} lines={[{ text: marketInitials(data.market.name), variant: "lilita400", font: FONT_LILITA, color: "#FFFFFF" }]} />
            )}
            <div style={{ ...col, marginLeft: r(20 * s), flex: 1 }}>
              <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(34 * s), color: t.bg1, letterSpacing: 1 * s, whiteSpace: "nowrap", lineHeight: 1.1 }}>{data.market.name.toUpperCase()}</div>
              {addr ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), color: t.cardMuted, whiteSpace: "nowrap", lineHeight: 1.15 }}>{addr}</div> : null}
              {contact ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(26 * s), color: t.bg0, whiteSpace: "nowrap", lineHeight: 1.15 }}>{contact}</div> : null}
            </div>
          </div>
        </>
      ) : (
        <div style={{ ...row, position: "absolute", left: 0, top: H - footerH, width: W, height: footerH, backgroundImage: `linear-gradient(180deg, ${t.barA}, ${t.barB})`, borderTop: `${r(5 * s)}px solid ${t.gold}`, alignItems: "center", padding: `0 ${padX}px`, paddingBottom: spec.safeBottom ? r(spec.safeBottom * 0.55) : 0 }}>
        {data.market.logoUrl ? (
          <div style={{ ...row, width: d, height: d, borderRadius: d, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden", border: `${r(3 * s)}px solid ${t.gold}` }}>
            <Img src={data.market.logoUrl} w={d * 0.82} h={d * 0.82} style={{ objectFit: "contain" }} />
          </div>
        ) : (
          <Selo kind="festonado" w={d} h={d} fill={t.gold} edge="#ffffff" edgeW={3 * s} lines={[{ text: marketInitials(data.market.name), variant: "lilita400", font: FONT_LILITA, color: t.ink }]} />
        )}
        <div style={{ ...col, marginLeft: r(20 * s), flex: 1 }}>
          <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(34 * s), color: "#fff", letterSpacing: 1 * s, whiteSpace: "nowrap", lineHeight: 1.1 }}>{data.market.name.toUpperCase()}</div>
          {addr ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), color: "rgba(255,255,255,0.78)", whiteSpace: "nowrap", lineHeight: 1.15 }}>{addr}</div> : null}
          {contact ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(26 * s), color: t.gold, whiteSpace: "nowrap", lineHeight: 1.15 }}>{contact}</div> : null}
        </div>
      </div>
      )}
    </div>
  );
  return { element, width: W, height: H, pageIndex: page.index, pageCount: page.total };
}

export { discountPercent };
