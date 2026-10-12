import type { ReactElement } from "react";
import { Antes, FONT_ALFA, FONT_ANTON, Forma, Nome, Ph, Preco, Shell, Txt, abs, pct, r, type BoxProps } from "./kit";

// 19 a 24: arco creme e terracota, verde em camadas, amarelo com fita,
// janelas pastel, verde-água e pêssego.

const sh = (s: number, a = 0.2) => `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,${a})`;

// ------------------------------------------------------------------ 19
export function Box19({ t, item, w, h, s }: BoxProps): ReactElement {
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FBF3E4,#F0E1C8)", borderRadius: `${r(w / 2)}px ${r(w / 2)}px ${r(14 * s)}px ${r(14 * s)}px`, border: `${r(2 * s)}px solid #D9B891`, boxShadow: sh(s) }}>
      <Ph item={item} t={t} x={w * 0.14} y={h * 0.08} w={w * 0.72} h={h * 0.5} />
      <div style={abs(w * 0.06, h * 0.6, w * 0.88, h * 0.1, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.065} color="#5A2E1A" lines={1} ls={1 * s} />
      </div>
      <div style={abs(w * 0.1, h * 0.73, w * 0.8, h * 0.2, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#D9714A,#B04A28)", borderRadius: r(h), alignItems: "center", justifyContent: "center", boxShadow: sh(s, 0.3) })}>
        <Preco item={item} maxW={w * 0.66} maxH={h * 0.13} color="#FFFFFF" accent="#FFE6D2" font={FONT_ALFA} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 20
export function Box20({ t, item, w, h, s }: BoxProps): ReactElement {
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#2F9A52,#126B33)", borderRadius: r(16 * s), boxShadow: sh(s, 0.3) }}>
      <div style={abs(w * 0.04, h * 0.04, w * 0.92, h * 0.92, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#46B86B,#1E8645)", borderRadius: r(12 * s) })} />
      <div style={abs(w * 0.08, h * 0.08, w * 0.84, h * 0.84, { backgroundImage: "linear-gradient(180deg,#F5FBF6,#D8EFDF)", borderRadius: r(10 * s) })} />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.1} w={w * 0.76} h={h * 0.5} />
      <div style={abs(w * 0.1, h * 0.6, w * 0.8, h * 0.1, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.78} size={h * 0.065} color="#0F5A2B" lines={1} />
      </div>
      <div style={abs(w * 0.18, h * 0.72, w * 0.64, h * 0.2, { backgroundColor: "#FFFFFF", borderRadius: `${r(h * 0.04)}px ${r(h * 0.04)}px ${r(14 * s)}px ${r(14 * s)}px`, border: `${r(3 * s)}px solid #1E8645`, alignItems: "center", justifyContent: "center", boxShadow: sh(s, 0.25) })}>
        <Preco item={item} maxW={w * 0.56} maxH={h * 0.13} color="#0F5A2B" accent="#0F5A2B" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 21
export function Box21({ t, item, w, h, s }: BoxProps): ReactElement {
  const arc = w * 0.66;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(14 * s), boxShadow: sh(s), overflow: "hidden", border: `${r(1.5 * s)}px solid #EFE6C8` }}>
      <div style={abs((w - arc) / 2, h * 0.08, arc, arc, { backgroundImage: "linear-gradient(180deg,#FFD84A,#FFB800)", borderRadius: r(arc) })} />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.06} w={w * 0.76} h={h * 0.52} />
      <Forma w={w * 0.4} h={h * 0.12} d={`M0 0 H${w * 0.4} L${w * 0.4 - h * 0.04} ${h * 0.06} L${w * 0.4} ${h * 0.12} H0 Z`} a="#E8262B" b="#B80F18" id="b21" />
      <div style={abs(0, 0, w * 0.36, h * 0.12, { alignItems: "center", justifyContent: "center" })}>
        <Txt text="OFERTA" size={h * 0.06} color="#FFFFFF" />
      </div>
      <div style={abs(w * 0.05, h * 0.62, w * 0.9, h * 0.1, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.065} color="#1D1D1D" lines={1} />
      </div>
      <div style={abs(w * 0.1, h * 0.73, w * 0.8, h * 0.2, { alignItems: "center", justifyContent: "center", flexDirection: "column" })}>
        <Preco item={item} maxW={w * 0.7} maxH={h * 0.15} color="#1D1D1D" accent="#E8262B" />
        <div style={{ display: "flex", width: r(w * 0.5), height: r(4 * s), backgroundColor: "#E8262B", borderRadius: r(4 * s) }} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 22
export function Box22({ t, item, w, h, s }: BoxProps): ReactElement {
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(16 * s), boxShadow: sh(s), border: `${r(1.5 * s)}px solid #EADFF5` }}>
      <div style={abs(w * 0.06, h * 0.05, w * 0.88, h * 0.56, { backgroundImage: "linear-gradient(180deg,#FFE9F1,#E8E0FF)", borderRadius: r(16 * s) })} />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.07} w={w * 0.76} h={h * 0.52} />
      <div style={abs(w * 0.07, h * 0.64, w * 0.7, h * 0.1, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.7} size={h * 0.065} color="#3A2A5C" align="flex-start" lines={1} />
      </div>
      <div style={abs(w * 0.07, h * 0.75, w * 0.8, h * 0.19, { alignItems: "center" })}>
        <Preco item={item} maxW={w * 0.7} maxH={h * 0.14} color="#3A2A5C" accent="#7A4DE0" />
      </div>
      <div style={abs(w * 0.82, h * 0.82, w * 0.1, w * 0.1, { backgroundImage: "linear-gradient(135deg,#FF8FB5,#7A4DE0)", borderRadius: r(6 * s) })} />
    </Shell>
  );
}

// ------------------------------------------------------------------ 23
export function Box23({ t, item, w, h, s }: BoxProps): ReactElement {
  const bw = 8 * s;
  const tw = w * 0.4;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(14 * s), boxShadow: sh(s), overflow: "hidden", border: `${r(1.5 * s)}px solid #D6EEEA` }}>
      <div style={abs(0, 0, bw, h, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#1FB5A5,#0E7F74)" })} />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.04} w={w * 0.8} h={h * 0.56} />
      <div style={abs(w * 0.07, h * 0.66, w * 0.5, h * 0.27, { flexDirection: "column", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.5} size={h * 0.075} color="#0C3F3A" align="flex-start" lines={2} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}><Antes item={item} size={h * 0.04} color="#5C7B77" /></div>
      </div>
      <div style={abs(w - tw - w * 0.04, h * 0.7, tw, h * 0.22, { backgroundImage: "linear-gradient(180deg,#DDF7F1,#A9E8DB)", borderRadius: `${r(h * 0.1)}px ${r(10 * s)}px ${r(10 * s)}px ${r(h * 0.1)}px`, border: `${r(2 * s)}px solid #1FB5A5`, alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={tw * 0.82} maxH={h * 0.14} color="#0C3F3A" accent="#0C3F3A" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 24
export function Box24({ t, item, w, h, s }: BoxProps): ReactElement {
  const n = 7;
  const bh = h * 0.2;
  const bw = w * 0.9;
  const rr = bh * 0.2;
  let d = `M0 0 H${bw} V${bh} H0 Z`;
  for (let i = 0; i < n; i++) {
    const cx = (bw / n) * (i + 0.5);
    d += ` M${cx - rr} ${bh} a${rr} ${rr} 0 0 1 ${rr * 2} 0 Z`;
  }
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(14 * s), boxShadow: sh(s), border: `${r(1.5 * s)}px solid #FBDCC8` }}>
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.04} w={w * 0.8} h={h * 0.56} />
      <div style={abs(w * 0.05, h * 0.62, w * 0.9, h * 0.1, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.065} color="#5A3320" lines={1} />
      </div>
      <Forma x={w * 0.05} y={h * 0.74} w={bw} h={bh + rr} d={d} a="#FFC9A3" b="#FFAA7A" id="b24" />
      <div style={abs(w * 0.05, h * 0.74, bw, bh, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={bw * 0.7} maxH={bh * 0.72} color="#5A2B12" accent="#5A2B12" />
      </div>
    </Shell>
  );
}

void Antes; void FONT_ANTON; void pct;
