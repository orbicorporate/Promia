import type { ReactElement } from "react";
import { Antes, FONT_ALFA, FONT_ANTON, Forma, Nome, Ph, Preco, Shell, Txt, abs, pct, r, rrect, type BoxProps } from "./kit";

// 13 a 18: marfim e amarelo, verde sálvia, azul gelo, vinho e rosé,
// grafite e champanhe, cobalto e coral.

const sh = (s: number, a = 0.2) => `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,${a})`;

// ------------------------------------------------------------------ 13
export function Box13({ t, item, w, h, s }: BoxProps): ReactElement {
  const pw = w * 0.56;
  const ph = h * 0.26;
  const py = h - ph;
  const blk = `M${ph * 0.5} 0 H${pw} V${ph} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FFF9EC,#F4E8D2)", borderRadius: r(14 * s), border: `${r(1.5 * s)}px solid #E4D3B4`, boxShadow: sh(s), overflow: "hidden" }}>
      <div style={abs(w * 0.05, h * 0.04, 10 * s, 10 * s, { backgroundColor: "#FFC400" })} />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.04} w={w * 0.76} h={h * 0.6} />
      <div style={abs(w * 0.05, h * 0.68, w * 0.4, h * 0.26, { flexDirection: "column", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.4} size={h * 0.085} color="#1D1810" align="flex-start" lines={2} />
        <div style={{ display: "flex", marginTop: r(3 * s) }}><Antes item={item} size={h * 0.04} color="#6B6050" /></div>
      </div>
      <Forma x={w - pw} y={py} w={pw} h={ph} d={blk} a="#FFD21F" b="#F5B800" id="b13" />
      <div style={abs(w - pw + ph * 0.3, py, pw - ph * 0.3, ph, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={pw * 0.78} maxH={ph * 0.62} color="#111111" accent="#111111" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 14
export function Box14({ t, item, w, h, s }: BoxProps): ReactElement {
  const sw = w * 0.27;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(14 * s), boxShadow: sh(s), overflow: "hidden", border: `${r(1.5 * s)}px solid #E3E9E3` }}>
      <div style={abs(0, 0, sw, h * 0.7, { backgroundImage: "linear-gradient(180deg,#5A8760,#4A7A52)" })} />
      <div style={abs(sw * 0.1, h * 0.06, sw * 0.82, h * 0.34, { flexDirection: "column", alignItems: "center" })}>
        <Nome item={item} w={sw * 0.84} size={h * 0.062} color="#FFFFFF" lines={3} />
      </div>
      <div style={abs(sw * 0.2, h * 0.52, sw * 0.6, h * 0.075, { border: `${r(1.5 * s)}px solid #FFFFFF`, borderRadius: r(h), alignItems: "center", justifyContent: "center" })}>
        <Txt text={(item.unit || "un").toLowerCase()} size={h * 0.045} color="#FFFFFF" font={FONT_ANTON} />
      </div>
      <Ph item={item} t={t} x={sw + w * 0.02} y={h * 0.03} w={w - sw - w * 0.04} h={h * 0.62} />
      <div style={abs(sw + w * 0.04, h * 0.74, w - sw - w * 0.08, 2 * s, { backgroundColor: "#3E6A45" })} />
      <div style={abs(sw, h * 0.76, w - sw, h * 0.2, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={(w - sw) * 0.9} maxH={h * 0.185} color="#12361E" accent="#12361E" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 15
export function Box15({ t, item, w, h, s }: BoxProps): ReactElement {
  const c = 20 * s;
  const ch = (x: number, y: number, ww: number, hh: number, k: number) => `M${r(x + k)} ${r(y)} H${r(x + ww - k)} L${r(x + ww)} ${r(y + k)} V${r(y + hh - k)} L${r(x + ww - k)} ${r(y + hh)} H${r(x + k)} L${r(x)} ${r(y + hh - k)} V${r(y + k)} Z`;
  const px = w * 0.035;
  const py = h * 0.715;
  const pw = w * 0.93;
  const ph = h * 0.25;
  return (
    <Shell w={w} h={h}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b15p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F2FAFF" /><stop offset="0.45" stopColor="#A9D5F5" /><stop offset="0.5" stopColor="#8DC3EC" /><stop offset="1" stopColor="#CBE8FB" /></linearGradient>
        </defs>
        <path d={ch(0, 0, w, h, c)} fill="#FFFFFF" stroke="#12306E" strokeWidth={r(5 * s)} strokeLinejoin="round" />
        <path d={ch(8 * s, 8 * s, w - 16 * s, h - 16 * s, c * 0.7)} fill="none" stroke="#2B58B8" strokeWidth={r(1.5 * s)} />
        <path d={ch(px, py, pw, ph, 12 * s)} fill="url(#b15p)" stroke="#12306E" strokeWidth={r(3 * s)} strokeLinejoin="round" />
        <path d={ch(px + 5 * s, py + 5 * s, pw - 10 * s, ph - 10 * s, 9 * s)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={r(1.5 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.04} w={w * 0.76} h={h * 0.52} />
      <div style={abs(w * 0.04, h * 0.565, w * 0.92, h * 0.14, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.078} color="#12306E" lines={1} />
      </div>
      <div style={abs(px, py, pw, ph, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.8} maxH={h * 0.165} color="#0B1F4A" accent="#0B1F4A" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 16
export function Box16({ t, item, w, h, s }: BoxProps): ReactElement {
  const pink = `M0 ${r(h * 0.66)} Q${r(w * 0.5)} ${r(h * 0.62)} ${r(w)} ${r(h * 0.6)} V${r(h)} H0 Z`;
  const wine = `M0 ${r(h * 0.55)} C${r(w * 0.2)} ${r(h * 0.6)} ${r(w * 0.42)} ${r(h * 0.66)} ${r(w * 0.52)} ${r(h * 0.73)} C${r(w * 0.6)} ${r(h * 0.8)} ${r(w * 0.55)} ${r(h * 0.9)} ${r(w * 0.6)} ${r(h)} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FCF6EE,#F4E6DB)", borderRadius: r(20 * s), border: `${r(1.5 * s)}px solid #D9B3A8`, boxShadow: sh(s, 0.25), overflow: "hidden" }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: r(-1.5 * s), top: r(-1.5 * s) }}>
        <defs>
          <linearGradient id="b16p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FBE3DE" /><stop offset="1" stopColor="#F2C6C2" /></linearGradient>
          <linearGradient id="b16w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7A1228" /><stop offset="1" stopColor="#4A0716" /></linearGradient>
        </defs>
        <path d={pink} fill="url(#b16p)" />
        <path d={wine} fill="url(#b16w)" />
      </svg>
      <Ph item={item} t={t} x={w * 0.08} y={h * 0.03} w={w * 0.84} h={h * 0.58} />
      <div style={abs(w * 0.04, h * 0.72, w * 0.52, h * 0.25, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.5} maxH={h * 0.16} color="#FFFFFF" accent="#FFFFFF" />
      </div>
      <div style={abs(w * 0.6, h * 0.72, w * 0.36, h * 0.22, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.34} size={h * 0.07} color="#5A0F20" align="flex-start" lines={2} gap={0.98} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 17
export function Box17({ t, item, w, h, s }: BoxProps): ReactElement {
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#26262A,#0E0E10)", borderRadius: r(6 * s), border: `${r(2 * s)}px solid #C9AE7A`, boxShadow: sh(s, 0.4) }}>
      <div style={abs(w * 0.05, h * 0.045, w * 0.9, h * 0.62, { backgroundImage: "radial-gradient(circle at 50% 40%, #FFFFFF, #E9E2D2)", border: `${r(2 * s)}px solid #D8BF8C`, borderRadius: r(3 * s) })} />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.06} w={w * 0.76} h={h * 0.6} />
      <div style={abs(w * 0.07, h * 0.7, w * 0.86, h * 0.09, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.052} color="#F1E6CC" align="flex-start" lines={1} ls={1.5 * s} />
      </div>
      <div style={abs(w * 0.07, h * 0.78, w * 0.86, h * 0.2, { alignItems: "center" })}>
        <Preco item={item} maxW={w * 0.8} maxH={h * 0.14} color="#E6CF9A" accent="#E6CF9A" font={FONT_ALFA} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 18
export function Box18({ t, item, w, h, s }: BoxProps): ReactElement {
  const hh = h * 0.15;
  const pw = w * 0.6;
  const ph = h * 0.26;
  const blk = `M0 0 H${pw - ph * 0.45} L${pw} ${ph} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(12 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <div style={abs(0, 0, w, hh, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#1E55D6,#0B2E8C)", alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.9} size={hh * 0.62} color="#FFFFFF" lines={1} />
      </div>
      <Ph item={item} t={t} x={w * 0.12} y={hh + h * 0.01} w={w * 0.76} h={h * 0.58} />
      <Forma y={h - ph} w={pw} h={ph} d={blk} a="#EF3B3B" b="#C00F1C" id="b18" />
      <div style={abs(0, h - ph, pw - ph * 0.3, ph, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={pw * 0.78} maxH={ph * 0.5} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

void Antes; void rrect; void pct;
