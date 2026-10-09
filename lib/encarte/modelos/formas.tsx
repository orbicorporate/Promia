import type { CSSProperties, ReactElement, ReactNode } from "react";
import { measureText } from "../text";
import type { FontVariant } from "../fontMetrics";

// Formas de selo e de etiqueta, desenhadas em SVG (o motor rasteriza o SVG
// inteiro, então formas orgânicas saem nítidas). Cada forma devolve só o
// caminho; a sombra dura deslocada e o contorno branco de "adesivo" são
// montados em <Forma/>.

export type FormaKind = "explosao" | "festonado" | "circulo" | "etiqueta" | "arco" | "faixa" | "escudo" | "pilula" | "placa" | "quadrado";

const f = (n: number) => Math.round(n * 100) / 100;

function polar(cx: number, cy: number, rx: number, ry: number, a: number) {
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as const;
}

function explosao(w: number, h: number, spikes = 20, inner = 0.84) {
  const cx = w / 2;
  const cy = h / 2;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const k = i % 2 === 0 ? 1 : inner;
    const [x, y] = polar(cx, cy, (w / 2) * k, (h / 2) * k, (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2);
    pts.push(`${f(x)} ${f(y)}`);
  }
  return `M${pts.join(" L")} Z`;
}

// borda de arcos (selo "festonado", tipo carimbo de padaria)
function festonado(w: number, h: number, bumps = 16) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w / 2) * 0.94;
  const ry = (h / 2) * 0.94;
  const pts: [number, number][] = [];
  for (let i = 0; i < bumps; i++) pts.push([...polar(cx, cy, rx, ry, (i / bumps) * Math.PI * 2 - Math.PI / 2)] as [number, number]);
  const chord = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const r = f(chord * 0.56);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i <= bumps; i++) {
    const [x, y] = pts[i % bumps];
    d += ` A${r} ${r} 0 0 1 ${f(x)} ${f(y)}`;
  }
  return `${d} Z`;
}

function rounded(w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  return `M${k} 0 H${w - k} Q${w} 0 ${w} ${k} V${h - k} Q${w} ${h} ${w - k} ${h} H${k} Q0 ${h} 0 ${h - k} V${k} Q0 0 ${k} 0 Z`;
}

export function formaPath(kind: FormaKind, w: number, h: number): string {
  switch (kind) {
    case "explosao":
      return explosao(w, h);
    case "festonado":
      return festonado(w, h);
    case "circulo":
      return `M0 ${h / 2} A${w / 2} ${h / 2} 0 1 1 ${w} ${h / 2} A${w / 2} ${h / 2} 0 1 1 0 ${h / 2} Z`;
    case "etiqueta": {
      const ph = h * 0.42;
      const r = h * 0.12;
      const hole = h * 0.085;
      const hx = ph * 0.78;
      return `M${f(ph)} 0 H${f(w - r)} Q${w} 0 ${w} ${f(r)} V${f(h - r)} Q${w} ${h} ${f(w - r)} ${h} H${f(ph)} L0 ${f(h / 2)} Z M${f(hx - hole)} ${f(h / 2)} a${f(hole)} ${f(hole)} 0 1 0 ${f(hole * 2)} 0 a${f(hole)} ${f(hole)} 0 1 0 ${f(-hole * 2)} 0 Z`;
    }
    case "arco": {
      const r = w / 2;
      return `M0 ${h} V${f(Math.min(r, h * 0.7))} A${f(r)} ${f(Math.min(r, h * 0.7))} 0 0 1 ${w} ${f(Math.min(r, h * 0.7))} V${h} Z`;
    }
    case "faixa": {
      const n = Math.min(h * 0.38, w * 0.18);
      return `M0 0 H${w} L${f(w - n)} ${f(h / 2)} L${w} ${h} H0 L${f(n)} ${f(h / 2)} Z`;
    }
    case "escudo":
      return `M0 0 H${w} V${f(h * 0.52)} Q${w} ${f(h * 0.86)} ${f(w / 2)} ${h} Q0 ${f(h * 0.86)} 0 ${f(h * 0.52)} Z`;
    case "pilula":
      return rounded(w, h, h / 2);
    case "placa":
      return rounded(w, h, h * 0.16);
    case "quadrado":
      return rounded(w, h, Math.min(w, h) * 0.24);
  }
}

// área útil de texto dentro de cada forma, em frações [esquerda, topo, direita, base]
export const INSET: Record<FormaKind, [number, number, number, number]> = {
  explosao: [0.17, 0.2, 0.17, 0.2],
  festonado: [0.15, 0.17, 0.15, 0.17],
  circulo: [0.12, 0.2, 0.12, 0.2],
  etiqueta: [0.5, 0.12, 0.07, 0.12],
  arco: [0.08, 0.24, 0.08, 0.08],
  faixa: [0.2, 0.1, 0.2, 0.1],
  escudo: [0.1, 0.1, 0.1, 0.28],
  pilula: [0.14, 0.08, 0.14, 0.08],
  placa: [0.06, 0.08, 0.06, 0.08],
  quadrado: [0.08, 0.1, 0.08, 0.1],
};

export type FormaProps = {
  kind: FormaKind;
  w: number;
  h: number;
  fill: string;
  edge?: string | null; // contorno (adesivo)
  edgeW?: number;
  shadow?: string | null; // sombra dura deslocada
  shadowDx?: number;
  shadowDy?: number;
};

// o SVG precisa de folga para a sombra e o contorno, então a caixa total é maior que a forma
export function Forma({ kind, w, h, fill, edge, edgeW = 0, shadow, shadowDx = 0, shadowDy = 0 }: FormaProps): ReactElement {
  const d = formaPath(kind, w, h);
  const padL = Math.max(0, edgeW / 2 + Math.max(0, -shadowDx));
  const padT = Math.max(0, edgeW / 2 + Math.max(0, -shadowDy));
  const padR = Math.max(0, edgeW / 2 + Math.max(0, shadowDx));
  const padB = Math.max(0, edgeW / 2 + Math.max(0, shadowDy));
  const vw = w + padL + padR;
  const vh = h + padT + padB;
  return (
    <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`} style={{ position: "absolute", left: -padL, top: -padT }}>
      {shadow ? <path d={d} fill={shadow} stroke={shadow} strokeWidth={edgeW} strokeLinejoin="round" transform={`translate(${padL + shadowDx} ${padT + shadowDy})`} fillRule="evenodd" /> : null}
      <path d={d} fill={fill} stroke={edge ?? "none"} strokeWidth={edge ? edgeW : 0} strokeLinejoin="round" transform={`translate(${padL} ${padT})`} fillRule="evenodd" />
    </svg>
  );
}

// maior tamanho de fonte em que o texto cabe na largura e na altura
export function fitFont(text: string, variant: FontVariant, maxW: number, maxH: number, letterSpacing = 0, maxSize = 999): number {
  const w1 = measureText(text, variant, 1, 0) || 1;
  const bySize = (maxW - letterSpacing * Math.max(0, text.length - 1)) / w1;
  return Math.max(6, Math.floor(Math.min(maxSize, maxH, bySize)));
}

export const centered: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" };

export type SeloLinha = { text: string; variant?: FontVariant; font: string; weight?: 400 | 800; color: string; scale?: number; tracking?: number };

// Selo completo: forma + linhas de texto ajustadas à área útil
export function Selo({
  kind,
  w,
  h,
  fill,
  edge,
  edgeW,
  shadow,
  shadowDx,
  shadowDy,
  lines,
  rotate = 0,
  style,
  children,
}: FormaProps & { lines?: SeloLinha[]; rotate?: number; style?: CSSProperties; children?: ReactNode }): ReactElement {
  const [il, it, ir, ib] = INSET[kind];
  const boxW = w * (1 - il - ir);
  const boxH = h * (1 - it - ib);
  const weights = (lines ?? []).map((l) => l.scale ?? 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  return (
    <div style={{ display: "flex", position: "relative", width: w, height: h, ...(rotate ? { transform: `rotate(${rotate}deg)` } : {}), ...style }}>
      <Forma kind={kind} w={w} h={h} fill={fill} edge={edge} edgeW={edgeW} shadow={shadow} shadowDx={shadowDx} shadowDy={shadowDy} />
      <div style={{ ...centered, position: "absolute", left: w * il, top: h * it, width: boxW, height: boxH }}>
        {(lines ?? []).map((l, i) => {
          const share = ((l.scale ?? 1) / totalWeight) * boxH;
          const fs = fitFont(l.text, l.variant ?? "lilita400", boxW, share * 1.02, l.tracking ?? 0);
          return (
            <div key={i} style={{ display: "flex", fontFamily: l.font, fontWeight: l.weight ?? 400, fontSize: fs, lineHeight: 1, color: l.color, letterSpacing: l.tracking ?? 0, whiteSpace: "nowrap" }}>
              {l.text}
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}
