import type { CSSProperties, ReactElement, ReactNode } from "react";
import { discountPercent, effectiveOldPrice, formatBRL } from "../../price";
import { measureText, wrapMeasured } from "../../text";
import type { EncarteItem } from "../../types";
import { Foto, PrecoTexto, col, r, row, type BT } from "../brilho";
import { FONT_ALFA, FONT_ANTON, FONT_BALOO } from "../tipografia";

// Peças comuns dos boxes de produto (24 modelos fiéis às referências).
// Cada box é desenhado com posições relativas ao tamanho do cartão (w, h),
// para funcionar em qualquer formato.

export type BoxProps = { t: BT; item: EncarteItem; w: number; h: number; s: number; wide: boolean; index: number };

export const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function abs(x: number, y: number, w: number, h: number, extra?: CSSProperties): CSSProperties {
  return { display: "flex", position: "absolute", left: r(x), top: r(y), width: r(w), height: r(h), ...extra };
}

// forma em SVG (caminho já em px do cartão) com degradê vertical opcional
export function Forma({ w, h, d, a, b, stroke, sw = 0, x = 0, y = 0, id }: { w: number; h: number; d: string; a: string; b?: string; stroke?: string; sw?: number; x?: number; y?: number; id: string }) {
  return (
    <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: r(x), top: r(y) }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b ?? a} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={stroke ?? "none"} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  );
}

export function rrect(x: number, y: number, w: number, h: number, rad: number): string {
  const q = Math.min(rad, w / 2, h / 2);
  return `M${x + q} ${y} H${x + w - q} Q${x + w} ${y} ${x + w} ${y + q} V${y + h - q} Q${x + w} ${y + h} ${x + w - q} ${y + h} H${x + q} Q${x} ${y + h} ${x} ${y + h - q} V${y + q} Q${x} ${y} ${x + q} ${y} Z`;
}

export function Txt({ text, size, color, font = FONT_ANTON, ls = 0, shadow, style }: { text: string; size: number; color: string; font?: string; ls?: number; shadow?: string; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", fontFamily: font, fontSize: r(size), color, letterSpacing: ls, lineHeight: 1, whiteSpace: "nowrap", ...(shadow ? { textShadow: shadow } : {}), ...style }}>
      {text}
    </div>
  );
}

// nome do produto em caixa alta, em até `lines` linhas, ajustado à largura
export function Nome({ item, w, size, color, align = "center", lines = 2, font = FONT_ANTON, variant = "anton400", ls = 0, shadow, gap = 1.02 }: { item: EncarteItem; w: number; size: number; color: string; align?: "center" | "flex-start" | "flex-end"; lines?: number; font?: string; variant?: "anton400" | "alfa400" | "baloo800"; ls?: number; shadow?: string; gap?: number }) {
  const text = item.name.toUpperCase();
  // reduz até caber em `lines` linhas inteiras
  let fs = size;
  let ls2 = wrapMeasured(text, w, variant, fs, lines, ls);
  while (ls2[ls2.length - 1]?.endsWith("…") && fs > size * 0.62) {
    fs *= 0.94;
    ls2 = wrapMeasured(text, w, variant, fs, lines, ls);
  }
  return (
    <div style={{ ...col, width: r(w), alignItems: align }}>
      {ls2.map((l, i) => (
        <div key={i} style={{ display: "flex", fontFamily: font, fontSize: r(fs), lineHeight: gap, color, letterSpacing: ls, whiteSpace: "nowrap", ...(shadow ? { textShadow: shadow } : {}) }}>
          {l}
        </div>
      ))}
    </div>
  );
}

export function Antes({ item, size, color, prefix = "De " }: { item: EncarteItem; size: number; color: string; prefix?: string }) {
  const old = effectiveOldPrice(item.price, item.oldPrice);
  if (!old) return null;
  return <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(size), color, lineHeight: 1, textDecoration: "line-through", whiteSpace: "nowrap" }}>{`${prefix}${formatBRL(old)}`}</div>;
}

export function pct(item: EncarteItem): number | null {
  const p = discountPercent(item.price, item.oldPrice);
  return p && p >= 5 ? p : null;
}

export function Preco({ item, maxW, maxH, color, accent, font }: { item: EncarteItem; maxW: number; maxH: number; color: string; accent?: string; font?: string }) {
  return <PrecoTexto price={item.price} unit={item.unit} maxW={maxW} maxH={maxH * 1.6} color={color} accent={accent} font={font} />;
}

// foto do produto (recorte) dentro de uma área
export function Ph({ item, t, x, y, w, h, shadow = 0.38 }: { item: EncarteItem; t: BT; x: number; y: number; w: number; h: number; shadow?: number }) {
  return <div style={abs(x, y, w, h)}>{Foto({ item, t, w, h, shadow })}</div>;
}

export function Shell({ w, h, children, style }: { w: number; h: number; children: ReactNode; style?: CSSProperties }): ReactElement {
  return <div style={{ display: "flex", position: "relative", width: r(w), height: r(h), ...style }}>{children}</div>;
}

export { col, row, r, measureText, FONT_ALFA, FONT_ANTON, FONT_BALOO };
