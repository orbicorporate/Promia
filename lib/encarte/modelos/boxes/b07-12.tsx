import type { ReactElement } from "react";
import { Antes, FONT_ALFA, FONT_ANTON, Forma, Nome, Ph, Preco, Shell, Txt, abs, pct, r, rrect, type BoxProps } from "./kit";

// 07 a 12: vinho e cobre, turquesa dobrado, roxo e lima, madeira de feira,
// coral e marinho, prata e azul.

const sh = (s: number, a = 0.25) => `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,${a})`;

function arch(x: number, y: number, w: number, h: number): string {
  const rad = w / 2;
  return `M${x} ${y + h} V${y + rad} A${rad} ${rad} 0 0 1 ${x + w} ${y + rad} V${y + h} Z`;
}

// ------------------------------------------------------------------ 07
export function Box07({ t, item, w, h, s }: BoxProps): ReactElement {
  const aw = w * 0.9;
  const ah = h * 0.56;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FBF1E2,#EEDDC2)", borderRadius: r(16 * s), border: `${r(2 * s)}px solid #C9946A`, boxShadow: sh(s) }}>
      <Forma x={w * 0.05} y={h * 0.03} w={aw} h={ah} d={arch(0, 0, aw, ah)} a="#8A4F2A" b="#2E1509" stroke="#B9794B" sw={3 * s} id="b07" />
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.09} w={w * 0.76} h={h * 0.48} shadow={0.5} />
      <div style={abs(w * 0.04, h * 0.6, w * 0.92, h * 0.13, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.082} color="#3B1B0F" lines={1} />
      </div>
      <div style={abs(w * 0.08, h * 0.75, w * 0.84, h * 0.2, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#9B2336,#4B0A16)", borderRadius: r(h), border: `${r(3 * s)}px solid #D9A06B`, alignItems: "center", justifyContent: "center", boxShadow: sh(s, 0.3) })}>
        <Preco item={item} maxW={w * 0.7} maxH={h * 0.13} color="#FFFFFF" accent="#FFE0B8" font={FONT_ALFA} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 08
export function Box08({ t, item, w, h, s }: BoxProps): ReactElement {
  const f = w * 0.2;
  const pw = w * 0.42;
  const ph = h * 0.34;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(12 * s), border: `${r(4 * s)}px solid #1FB2A6`, boxShadow: sh(s) }}>
      <Ph item={item} t={t} x={w * 0.08} y={h * 0.05} w={w * 0.84} h={h * 0.62} />
      <Forma x={w - f - 4 * s} y={-4 * s} w={f} h={f} d={`M0 0 H${f} V${f} Z`} a="#25C4B6" b="#128A80" id="b08f" />
      <div style={abs(w * 0.04, h * 0.66, w * 0.5, h * 0.27, { flexDirection: "column", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.5} size={h * 0.095} color="#0B2447" align="flex-start" lines={2} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}><Antes item={item} size={h * 0.04} color="#5A6A80" /></div>
      </div>
      <Forma x={w - pw - 4 * s} y={h - ph - 4 * s} w={pw} h={ph} d={rrect(0, 0, pw, ph, 14 * s)} a="#0F2A55" b="#071735" id="b08p" />
      <div style={abs(w - pw - 4 * s, h - ph - 4 * s, pw, ph, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={pw * 0.84} maxH={ph * 0.55} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 09
export function Box09({ t, item, w, h, s }: BoxProps): ReactElement {
  const c = w * 0.2;
  const bh = h * 0.34;
  const by = h - bh;
  const ban = `M0 0 H${w * 0.94} L${w} ${bh / 2} L${w * 0.94} ${bh} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(10 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <Forma w={c} h={c} d={`M0 0 H${c} L0 ${c} Z`} a="#6A2AC9" b="#3A0F8A" id="b09a" />
      <Forma x={w - c} w={c} h={c} d={`M0 0 H${c} V${c} Z`} a="#6A2AC9" b="#3A0F8A" id="b09b" />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.03} w={w * 0.8} h={h * 0.6} />
      <Forma y={by} w={w} h={bh} d={ban} a="#D6F52E" b="#A6D40B" id="b09" />
      <div style={abs(w * 0.05, by + bh * 0.04, w * 0.8, bh * 0.26, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.8} size={bh * 0.26} color="#2A0D6B" align="flex-start" lines={1} />
      </div>
      <div style={abs(w * 0.05, by + bh * 0.34, w * 0.86, bh * 0.62, { alignItems: "center" })}>
        <Preco item={item} maxW={w * 0.8} maxH={bh * 0.36} color="#2A0D6B" accent="#2A0D6B" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 10
export function Box10({ t, item, w, h, s }: BoxProps): ReactElement {
  const fr = 12 * s;
  const dots = [[fr * 0.7, fr * 0.7], [w - fr * 0.7, fr * 0.7], [fr * 0.7, h - fr * 0.7], [w - fr * 0.7, h - fr * 0.7]];
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#E2BE86,#C8975A)", borderRadius: r(6 * s), boxShadow: sh(s, 0.35) }}>
      <div style={abs(fr, fr, w - fr * 2, h - fr * 2, { backgroundImage: "radial-gradient(circle at 50% 35%, #FFF9EC, #F3E3C3)", borderRadius: r(4 * s), border: `${r(2 * s)}px solid #A87A42` })} />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.05} w={w * 0.8} h={h * 0.62} />
      <div style={abs(w * 0.07, h * 0.62, w * 0.86, h * 0.33, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#245C3D,#12341F)", borderRadius: r(14 * s), border: `${r(3 * s)}px solid #D8C89B`, boxShadow: sh(s, 0.4), flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.74} size={h * 0.07} color="#F3E7C4" lines={1} ls={2 * s} />
        <div style={{ display: "flex", marginTop: r(4 * s) }}>
          <Preco item={item} maxW={w * 0.7} maxH={h * 0.15} color="#F3E7C4" accent="#F3E7C4" />
        </div>
      </div>
      {dots.map(([x, y], i) => (
        <div key={i} style={abs(x - 5 * s, y - 5 * s, 10 * s, 10 * s, { borderRadius: 10 * s, backgroundColor: "#1B2A18", border: `${r(1.5 * s)}px solid #8A6A3A` })} />
      ))}
    </Shell>
  );
}

// ------------------------------------------------------------------ 11
export function Box11({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const by = h * 0.62;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(14 * s), border: `${r(3 * s)}px solid #FF5A52`, boxShadow: sh(s), overflow: "hidden" }}>
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.03} w={w * 0.76} h={h * 0.56} />
      <div style={abs(-3 * s, -3 * s, w * 0.2, w * 0.2, { backgroundColor: "#FF5A52", borderRadius: `0 0 ${r(w * 0.2)}px 0` })} />
      <div style={abs(-3 * s, by, w, h - by + 3 * s, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#14305E,#0A1B3D)" })} />
      <div style={abs(w * 0.06, by + h * 0.03, w * 0.88, h * 0.14, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.085} color="#FFFFFF" lines={1} />
      </div>
      <div style={abs(w * 0.12, by + h * 0.175, w * 0.76, h * 0.17, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#FF6E66,#E83C34)", borderRadius: r(h), alignItems: "center", justifyContent: "center", border: `${r(2 * s)}px solid #FFFFFF` })}>
        <Preco item={item} maxW={w * 0.66} maxH={h * 0.12} color="#FFFFFF" accent="#FFFFFF" />
      </div>
      {p ? <div style={abs(w * 0.76, h * 0.05, w * 0.2, h * 0.08, { backgroundColor: "#FFFFFF", borderRadius: r(h), border: `${r(2 * s)}px solid #FF5A52`, alignItems: "center", justifyContent: "center" })}><Txt text={`-${p}%`} size={h * 0.05} color="#E83C34" /></div> : null}
    </Shell>
  );
}

// ------------------------------------------------------------------ 12
export function Box12({ t, item, w, h, s }: BoxProps): ReactElement {
  const m = 10 * s;
  const bh = h * 0.28;
  const by = h - bh - m;
  const ban = `M${w * 0.06} 0 H${w - m * 2 - 0} V${bh} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(135deg,#F4F6F8,#9AA3AE 45%,#E9EDF1 60%,#8A939E)", borderRadius: r(10 * s), boxShadow: sh(s, 0.4) }}>
      <div style={abs(m, m, w - m * 2, h - m * 2, { backgroundColor: "#FFFFFF", borderRadius: r(4 * s), border: `${r(2 * s)}px solid #1F4FB8` })} />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.05} w={w * 0.8} h={h * 0.56} />
      <div style={abs(w * 0.32, by - h * 0.08, w * 0.6, h * 0.08, { alignItems: "center", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.6} size={h * 0.07} color="#12306E" align="flex-end" lines={1} />
      </div>
      <Forma x={m} y={by} w={w - m * 2} h={bh} d={ban} a="#2F68E0" b="#0B2F8F" id="b12" />
      <div style={abs(m, by + bh * 0.05, w - m * 2, bh * 0.9, { alignItems: "center", paddingLeft: r(w * 0.08) })}>
        <Preco item={item} maxW={w * 0.7} maxH={bh * 0.62} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

void FONT_ANTON;
