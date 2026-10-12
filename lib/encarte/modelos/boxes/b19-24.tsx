import type { ReactElement } from "react";
import { Antes, FONT_ALFA, FONT_ANTON, Nome, Ph, Preco, Shell, Txt, abs, pct, r, type BoxProps } from "./kit";

// 19 a 24: arco creme e terracota, verde em camadas, amarelo com fita,
// janelas pastel, verde-água e pêssego.

const sh = (s: number, a = 0.2) => `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,${a})`;

// ------------------------------------------------------------------ 19
export function Box19({ t, item, w, h, s }: BoxProps): ReactElement {
  const m = 5 * s;
  const aw = w - m * 2;
  const ah = h * 0.6;
  const rad = aw / 2;
  const win = `M0 ${r(ah - 14 * s)} V${r(rad)} A${r(rad)} ${r(rad)} 0 0 1 ${r(aw)} ${r(rad)} V${r(ah - 14 * s)} Q${r(aw * 0.5)} ${r(ah + 8 * s)} 0 ${r(ah - 14 * s)} Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#F7EBDA,#EBD9BF)", borderRadius: r(18 * s), border: `${r(2 * s)}px solid #B5502A`, boxShadow: sh(s, 0.25) }}>
      <svg width={r(aw)} height={r(ah + 10 * s)} viewBox={`0 0 ${r(aw)} ${r(ah + 10 * s)}`} style={{ position: "absolute", left: r(m - 2 * s), top: r(m - 2 * s) }}>
        <defs>
          <linearGradient id="b19w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E8D8C0" /><stop offset="1" stopColor="#F7EEDF" /></linearGradient>
        </defs>
        <path d={win} fill="url(#b19w)" stroke="#B5502A" strokeWidth={r(2 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.1} w={w * 0.8} h={h * 0.5} />
      <div style={abs(w * 0.04, h * 0.6, w * 0.92, h * 0.13, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.075} color="#5A1F0E" lines={1} />
      </div>
      <div style={abs(w * 0.08, h * 0.745, w * 0.84, h * 0.2, { backgroundImage: "linear-gradient(180deg,#C96A3C,#A4401C 60%,#8E3414)", borderRadius: r(h), border: `${r(2 * s)}px solid #D88F66`, alignItems: "center", justifyContent: "center", boxShadow: `0 ${r(4 * s)}px ${r(8 * s)}px rgba(90,31,14,0.4)` })}>
        <Preco item={item} maxW={w * 0.7} maxH={h * 0.135} color="#FFF3E0" accent="#FFF3E0" font={FONT_ALFA} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 20
export function Box20({ t, item, w, h, s }: BoxProps): ReactElement {
  const o = w * 0.06;
  const cw = w - o;
  const ch = h - o * 0.9;
  const pw = w * 0.5;
  const ph = h * 0.28;
  const px = w - pw;
  const py = h - ph;
  const k = ph * 0.3;
  const tab = `M${r(k)} 0 H${r(pw - 12 * s)} Q${r(pw)} 0 ${r(pw)} ${r(12 * s)} V${r(ph - 12 * s)} Q${r(pw)} ${r(ph)} ${r(pw - 12 * s)} ${r(ph)} H${r(12 * s)} Q0 ${r(ph)} 0 ${r(ph - 12 * s)} V${r(k)} Z`;
  return (
    <Shell w={w} h={h}>
      <div style={abs(0, o * 0.9, cw * 0.97, ch, { backgroundImage: "linear-gradient(180deg,#0F7A4C,#0A5A38)", borderRadius: r(14 * s), boxShadow: sh(s, 0.3) })} />
      <div style={abs(o, 0, cw, ch, { backgroundImage: "linear-gradient(180deg,#FFFFFF,#EEF1EF)", borderRadius: r(14 * s), boxShadow: sh(s, 0.25) })} />
      <Ph item={item} t={t} x={o + cw * 0.05} y={h * 0.02} w={cw * 0.9} h={h * 0.6} />
      <svg width={r(pw)} height={r(ph)} viewBox={`0 0 ${r(pw)} ${r(ph)}`} style={{ position: "absolute", left: r(px), top: r(py) }}>
        <defs>
          <linearGradient id="b20t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#E6EBE8" /></linearGradient>
        </defs>
        <path d={tab} fill="url(#b20t)" stroke="#CAD3CE" strokeWidth={r(1.5 * s)} />
      </svg>
      <div style={abs(px + pw - 16 * s, py + 8 * s, 8 * s, 8 * s, { backgroundColor: "#FFC400", borderRadius: r(2 * s) })} />
      <div style={abs(px + k * 0.5, py + ph * 0.1, pw - k * 0.5, ph * 0.88, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={pw * 0.86} maxH={ph * 0.62} color="#0B5B36" accent="#0B5B36" />
      </div>
      <div style={abs(o + w * 0.04, h * 0.68, w * 0.4, h * 0.22, { flexDirection: "column", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.4} size={h * 0.075} color="#0B5B36" align="flex-start" lines={2} gap={0.98} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 21
export function Box21({ t, item, w, h, s }: BoxProps): ReactElement {
  const ex = w * 0.62;
  const ey = h * 0.27;
  const disc = `M${r(w * 0.3)} ${r(h * 0.06)} A${r(ex)} ${r(ey)} 0 0 1 ${r(w * 0.3)} ${r(h * 0.56)} Z`;
  const rib = `M0 0 H${r(w * 0.3)} V${r(h * 0.1)} L${r(w * 0.3 - 10 * s)} ${r(h * 0.1)} L${r(w * 0.15)} ${r(h * 0.15)} L${r(10 * s)} ${r(h * 0.1)} Z`;
  void rib;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FFFFFF,#F7F7F7)", borderRadius: r(20 * s), boxShadow: sh(s, 0.25), overflow: "hidden" }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b21y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE24A" /><stop offset="1" stopColor="#FFC800" /></linearGradient>
        </defs>
        <path d={disc} fill="url(#b21y)" />
      </svg>
      <Ph item={item} t={t} x={w * 0.06} y={h * 0.05} w={w * 0.88} h={h * 0.56} />
      <div style={abs(w * 0.04, h * 0.62, w * 0.92, h * 0.13, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.082} color="#151515" lines={1} />
      </div>
      <div style={abs(w * 0.05, h * 0.745, w * 0.9, h * 0.2, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.8} maxH={h * 0.14} color="#151515" accent="#E3141C" />
      </div>
      <div style={abs(w * 0.33, h * 0.935, w * 0.34, 3 * s, { backgroundColor: "#E3141C", borderRadius: r(2 * s) })} />
      <div style={abs(w * 0.04, 0, w * 0.27, h * 0.15, { backgroundImage: "linear-gradient(180deg,#F0242C,#B80F18)", alignItems: "flex-start", justifyContent: "center", paddingTop: r(h * 0.035), boxShadow: sh(s, 0.3) })}>
        <Txt text="OFERTA" size={h * 0.05} color="#FFFFFF" />
      </div>
      <div style={abs(w * 0.04, h * 0.15, w * 0.27, h * 0.045, { backgroundColor: "#FFFFFF", transform: "none" })} />
    </Shell>
  );
}

// ------------------------------------------------------------------ 22
const PASTEL = ["#FFD6C2", "#FDBDC4", "#FFE59B", "#C8E8B0", "#CFE2FF", "#E4D2FF"];
export function Box22({ t, item, w, h, s, index }: BoxProps): ReactElement {
  const pc = PASTEL[((index % PASTEL.length) + PASTEL.length) % PASTEL.length];
  const m = 12 * s;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FFFFFF,#FBF6EF)", borderRadius: r(28 * s), boxShadow: `0 ${r(6 * s)}px ${r(16 * s)}px rgba(120,80,40,0.22)`, border: `${r(1.5 * s)}px solid #F3E6D6` }}>
      <div style={abs(m, m, w - m * 2, h * 0.66, { backgroundColor: pc, borderRadius: r(22 * s), backgroundImage: `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.45), rgba(255,255,255,0) 70%)` })} />
      <Ph item={item} t={t} x={w * 0.06} y={h * 0.04} w={w * 0.88} h={h * 0.6} />
      <div style={abs(w * 0.07, h * 0.7, w * 0.8, h * 0.25, { flexDirection: "column", justifyContent: "center", alignItems: "flex-start" })}>
        <Nome item={item} w={w * 0.8} size={h * 0.075} color="#141414" align="flex-start" lines={1} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}>
          <Preco item={item} maxW={w * 0.8} maxH={h * 0.17} color="#141414" accent="#141414" />
        </div>
      </div>
      <div style={abs(w - m - 24 * s, h - m - 24 * s, 24 * s, 24 * s, { backgroundColor: pc, borderRadius: r(6 * s) })} />
    </Shell>
  );
}

// ------------------------------------------------------------------ 23
export function Box23({ t, item, w, h, s }: BoxProps): ReactElement {
  const o = 7 * s;
  const cw = w - o;
  const ch = h - o;
  const tw = w * 0.5;
  const th = h * 0.27;
  const tx = cw - tw - 6 * s;
  const ty = ch - th - 8 * s;
  const k = 14 * s;
  const tag = `M${r(k)} 0 H${r(tw - 10 * s)} Q${r(tw)} 0 ${r(tw)} ${r(10 * s)} V${r(th - 12 * s)} Q${r(tw)} ${r(th)} ${r(tw - 12 * s)} ${r(th)} H${r(14 * s)} Q0 ${r(th)} 0 ${r(th - 14 * s)} V${r(k)} Z`;
  return (
    <Shell w={w} h={h}>
      <div style={abs(0, o, cw, ch, { backgroundImage: "linear-gradient(180deg,#0E6B6E,#0A4C52)", borderRadius: r(18 * s) })} />
      <div style={abs(o, 0, cw, ch, { backgroundImage: "linear-gradient(180deg,#FFFFFF,#F6F8F8)", borderRadius: r(18 * s), boxShadow: sh(s, 0.22) })} />
      <Ph item={item} t={t} x={o + cw * 0.04} y={h * 0.02} w={cw * 0.92} h={h * 0.64} />
      <div style={abs(o + w * 0.05, h * 0.68, w * 0.42, h * 0.22, { flexDirection: "column", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.42} size={h * 0.075} color="#0B4A50" align="flex-start" lines={2} gap={0.98} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}><Antes item={item} size={h * 0.035} color="#5A7478" /></div>
      </div>
      <svg width={r(tw)} height={r(th)} viewBox={`0 0 ${r(tw)} ${r(th)}`} style={{ position: "absolute", left: r(o + tx), top: r(ty) }}>
        <defs>
          <linearGradient id="b23t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E6F6EE" /><stop offset="1" stopColor="#BFE3D4" /></linearGradient>
        </defs>
        <path d={tag} fill="url(#b23t)" stroke="#A9D2C3" strokeWidth={r(1.5 * s)} />
        <circle cx={r(tw - 12 * s)} cy={r(12 * s)} r={r(3.5 * s)} fill="#FFFFFF" stroke="#A9D2C3" strokeWidth={r(1 * s)} />
      </svg>
      <div style={abs(o + tx + k * 0.3, ty + th * 0.08, tw - k * 0.3, th * 0.88, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={tw * 0.86} maxH={th * 0.6} color="#0B4A50" accent="#0B4A50" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 24
export function Box24({ t, item, w, h, s }: BoxProps): ReactElement {
  const y0 = h * 0.7;
  const n = 9 * s;
  const rad = 14 * s;
  const sc = 11 * s;
  let bottom = "";
  const count = Math.max(4, Math.round(w / (sc * 2)));
  const step = (w - rad * 2) / count;
  for (let a = 0; a < count; a++) bottom += ` Q${r(w - rad - step * (a + 0.5))} ${r(h + 5 * s)} ${r(w - rad - step * (a + 1))} ${r(h - 2 * s)}`;
  const top = `M${r(rad)} 0 H${r(w - rad)} Q${r(w)} 0 ${r(w)} ${r(rad)} V${r(y0 - n)} A${r(n)} ${r(n)} 0 0 0 ${r(w)} ${r(y0 + n)} V${r(h - 2 * s)}`;
  const shape = `${top}${bottom} V${r(y0 + n)} A${r(n)} ${r(n)} 0 0 0 0 ${r(y0 - n)} V${r(rad)} Q0 0 ${r(rad)} 0 Z`;
  return (
    <Shell w={w} h={h}>
      <svg width={r(w)} height={r(h + 8 * s)} viewBox={`0 0 ${r(w)} ${r(h + 8 * s)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b24p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD3B5" /><stop offset="1" stopColor="#FFC4A0" /></linearGradient>
          <clipPath id="b24c"><path d={shape} /></clipPath>
        </defs>
        <path d={shape} fill="#FFFFFF" stroke="#2A1A12" strokeWidth={r(1.5 * s)} />
        <g clipPath="url(#b24c)"><rect x="0" y={r(y0)} width={r(w)} height={r(h)} fill="url(#b24p)" /></g>
        <line x1={r(n + 4 * s)} y1={r(y0)} x2={r(w - n - 4 * s)} y2={r(y0)} stroke="#C2765A" strokeWidth={r(1.5 * s)} strokeDasharray={`${r(2 * s)} ${r(4 * s)}`} />
        <path d={shape} fill="none" stroke="#2A1A12" strokeWidth={r(1.5 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.06} y={h * 0.1} w={w * 0.88} h={h * 0.58} />
      <div style={abs(w * 0.06, h * 0.03, w * 0.88, h * 0.1, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.065} color="#141414" align="flex-start" lines={1} />
      </div>
      <div style={abs(w * 0.05, y0 + h * 0.02, w * 0.9, h * 0.26, { alignItems: "center", justifyContent: "flex-start" })}>
        <Preco item={item} maxW={w * 0.88} maxH={h * 0.2} color="#141414" accent="#141414" />
      </div>
    </Shell>
  );
}

void Antes; void FONT_ANTON; void pct;
