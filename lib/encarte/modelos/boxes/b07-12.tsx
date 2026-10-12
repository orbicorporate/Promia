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
  const ax = w * 0.045;
  const ay = h * 0.03;
  const aw = w * 0.91;
  const ah = h * 0.57;
  const fw = 7 * s;
  const wood = ah * 0.74;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FBF3E4,#EBD9BC)", borderRadius: r(16 * s), border: `${r(2 * s)}px solid #D2A47A`, boxShadow: sh(s) }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: r(-2 * s), top: r(-2 * s) }}>
        <defs>
          <linearGradient id="b07c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F7C79B" /><stop offset="0.35" stopColor="#B5683A" /><stop offset="0.7" stopColor="#F0B286" /><stop offset="1" stopColor="#8A4A28" /></linearGradient>
          <radialGradient id="b07w" cx="0.5" cy="0.35" r="0.8"><stop offset="0" stopColor="#7E1F2C" /><stop offset="1" stopColor="#2C0A10" /></radialGradient>
          <linearGradient id="b07b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8A5A30" /><stop offset="1" stopColor="#3A1E0D" /></linearGradient>
          <clipPath id="b07k"><path d={arch(ax + fw, ay + fw, aw - fw * 2, ah - fw)} /></clipPath>
        </defs>
        <path d={arch(ax, ay, aw, ah)} fill="url(#b07c)" />
        <path d={arch(ax + fw, ay + fw, aw - fw * 2, ah - fw)} fill="url(#b07w)" />
        <g clipPath="url(#b07k)">
          <rect x={ax} y={ay + wood} width={aw} height={ah - wood} fill="url(#b07b)" />
          <rect x={ax} y={ay + wood} width={aw} height={r(2 * s)} fill="rgba(255,210,150,0.35)" />
        </g>
        <path d={arch(ax + fw, ay + fw, aw - fw * 2, ah - fw)} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth={r(2 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.08} w={w * 0.8} h={h * 0.5} shadow={0.55} />
      <div style={abs(w * 0.04, h * 0.61, w * 0.92, h * 0.12, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.88} size={h * 0.085} color="#2C140A" lines={1} />
      </div>
      <div style={abs(w * 0.06, h * 0.745, w * 0.88, h * 0.215, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#A12A3E,#4A0A16 80%,#3A0710)", borderRadius: r(h), border: `${r(4 * s)}px solid #D7985F`, alignItems: "center", justifyContent: "center", boxShadow: `0 ${r(4 * s)}px ${r(8 * s)}px rgba(0,0,0,0.4)` })}>
        <Preco item={item} maxW={w * 0.72} maxH={h * 0.14} color="#FFFFFF" accent="#FFFFFF" font={FONT_ALFA} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 08
export function Box08({ t, item, w, h, s }: BoxProps): ReactElement {
  const o = 7 * s;
  const cw = w - o;
  const ch = h - o;
  const f = w * 0.2;
  const pw = w * 0.43;
  const ph = h * 0.36;
  const px = w - pw;
  const py = h - ph;
  const card = `M${r(14 * s)} 0 H${r(cw - f)} L${r(cw)} ${r(f)} V${r(ch - 14 * s)} Q${r(cw)} ${r(ch)} ${r(cw - 14 * s)} ${r(ch)} H${r(14 * s)} Q0 ${r(ch)} 0 ${r(ch - 14 * s)} V${r(14 * s)} Q0 0 ${r(14 * s)} 0 Z`;
  const pay = `M${r(22 * s)} 0 H${r(pw - 14 * s)} Q${r(pw)} 0 ${r(pw)} ${r(14 * s)} V${r(ph)} H0 V${r(26 * s)} Q0 0 ${r(22 * s)} 0 Z`;
  return (
    <Shell w={w} h={h}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b08t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2CCFC0" /><stop offset="1" stopColor="#0E8A83" /></linearGradient>
          <linearGradient id="b08f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7BE9DF" /><stop offset="0.5" stopColor="#19B5A8" /><stop offset="1" stopColor="#0C7F78" /></linearGradient>
          <linearGradient id="b08w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F0F3F6" /></linearGradient>
          <linearGradient id="b08n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#173A74" /><stop offset="1" stopColor="#081B3F" /></linearGradient>
        </defs>
        <path d={rrect(0, 0, w - o, h - o, 16 * s)} fill="url(#b08t)" transform={`translate(${r(o)} ${r(o)})`} opacity="0.95" />
        <path d={card} fill="url(#b08w)" />
        <path d={card} fill="none" stroke="#19B5A8" strokeWidth={r(3 * s)} />
        <path d={`M${r(cw - f)} 0 L${r(cw)} ${r(f)} L${r(cw - f * 0.18)} ${r(f * 0.82)} Q${r(cw - f * 0.8)} ${r(f * 0.7)} ${r(cw - f)} 0 Z`} fill="url(#b08f)" />
      </svg>
      <Ph item={item} t={t} x={w * 0.07} y={h * 0.04} w={w * 0.82} h={h * 0.62} />
      <div style={abs(w * 0.05, h * 0.64, w * 0.5, h * 0.3, { flexDirection: "column", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.5} size={h * 0.105} color="#0B2447" align="flex-start" lines={2} gap={0.96} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}><Antes item={item} size={h * 0.04} color="#5A6A80" /></div>
      </div>
      <svg width={r(pw)} height={r(ph)} viewBox={`0 0 ${r(pw)} ${r(ph)}`} style={{ position: "absolute", left: r(px - o), top: r(py - o) }}>
        <defs>
          <linearGradient id="b08q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#183C78" /><stop offset="1" stopColor="#071A3D" /></linearGradient>
        </defs>
        <path d={pay} fill="url(#b08q)" />
        <path d={pay} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={r(1.5 * s)} />
      </svg>
      <div style={abs(px - o, py - o, pw, ph, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={pw * 0.84} maxH={ph * 0.52} color="#FFFFFF" accent="#FFFFFF" />
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
  const fr = 13 * s;
  const bx = w * 0.07;
  const by = h * 0.6;
  const bw = w * 0.86;
  const bh = h * 0.355;
  const sign = rrect(0, 0, bw, bh, 20 * s);
  const corner = (x: number, y: number, fx: number, fy: number) => `M${x} ${y} h${fx * 30 * s} a${30 * s} ${30 * s} 0 0 ${fx * fy > 0 ? 1 : 0} ${-fx * 30 * s} ${fy * 30 * s} Z`;
  void corner;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(135deg,#F1D6A0,#D3A867 50%,#EBCB92)", borderRadius: r(8 * s), boxShadow: sh(s, 0.4), border: `${r(1.5 * s)}px solid #9A7438` }}>
      <div style={abs(fr, fr, w - fr * 2, h - fr * 2, { backgroundImage: "linear-gradient(180deg,#FFFDF6,#F1E4C8)", borderRadius: r(5 * s), border: `${r(2 * s)}px solid #8E6B35` })} />
      <Ph item={item} t={t} x={w * 0.08} y={h * 0.045} w={w * 0.84} h={h * 0.56} />
      <svg width={r(bw)} height={r(bh)} viewBox={`0 0 ${r(bw)} ${r(bh)}`} style={{ position: "absolute", left: r(bx), top: r(by) }}>
        <defs>
          <linearGradient id="b10s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F6B49" /><stop offset="0.5" stopColor="#1F5236" /><stop offset="1" stopColor="#0F3220" /></linearGradient>
        </defs>
        <path d={sign} fill="url(#b10s)" stroke="#C7A66A" strokeWidth={r(3 * s)} />
        <path d={rrect(7 * s, 7 * s, bw - 14 * s, bh - 14 * s, 14 * s)} fill="none" stroke="rgba(243,231,196,0.55)" strokeWidth={r(1.5 * s)} />
      </svg>
      <div style={abs(bx + bw * 0.14, by - h * 0.035, 3 * s, h * 0.05, { backgroundColor: "#7A5A2A" })} />
      <div style={abs(bx + bw * 0.86, by - h * 0.035, 3 * s, h * 0.05, { backgroundColor: "#7A5A2A" })} />
      <div style={abs(bx, by, bw, bh, { flexDirection: "column", alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={bw * 0.8} size={h * 0.075} color="#F6EBCB" lines={1} ls={3 * s} />
        <div style={{ display: "flex", marginTop: r(2 * s) }}>
          <Preco item={item} maxW={bw * 0.78} maxH={h * 0.16} color="#F6EBCB" accent="#F6EBCB" />
        </div>
      </div>
      {[[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]].map(([x, y, fx, fy], i) => (
        <div key={i} style={abs(x === 0 ? 0 : w - fr * 2.2, y === 0 ? 0 : h - fr * 2.2, fr * 2.2, fr * 2.2, { backgroundImage: "linear-gradient(135deg,#2F6B49,#0F3220)", borderRadius: r(4 * s) })}>
          <div style={abs(fr * 0.8 + (fx > 0 ? 0 : 0), fr * 0.8, 6 * s, 6 * s, { borderRadius: 6 * s, backgroundImage: "linear-gradient(135deg,#F2D687,#9A7418)" })} />
        </div>
      ))}
    </Shell>
  );
}

// ------------------------------------------------------------------ 11
export function Box11({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const o = 7 * s;
  const cw = w - o;
  const ch = h - o;
  const by = ch * 0.6;
  return (
    <Shell w={w} h={h}>
      <div style={abs(o, o, cw, ch, { backgroundImage: "linear-gradient(180deg,#1A3A6E,#081A3C)", borderRadius: r(20 * s) })} />
      <div style={abs(0, 0, cw, ch, { backgroundImage: "linear-gradient(180deg,#FF6E66,#E5372F)", borderRadius: r(20 * s), boxShadow: sh(s, 0.3) })} />
      <div style={abs(4 * s, 4 * s, cw - 8 * s, ch - 8 * s, { backgroundImage: "linear-gradient(180deg,#183767,#0A1D40)", borderRadius: r(17 * s) })} />
      <div style={abs(4 * s, 4 * s, cw - 8 * s, by, { backgroundImage: "linear-gradient(180deg,#FFFFFF,#F4F6FA)", borderRadius: `${r(17 * s)}px ${r(17 * s)}px ${r(26 * s)}px ${r(26 * s)}px`, overflow: "hidden" })}>
        <div style={abs(0, 0, w * 0.2, w * 0.2, { backgroundImage: "linear-gradient(135deg,#FF7A72,#E5372F)", borderRadius: `0 0 ${r(w * 0.2)}px 0` })} />
      </div>
      <Ph item={item} t={t} x={w * 0.12} y={h * 0.03} w={w * 0.76} h={h * 0.55} />
      <div style={abs(w * 0.06, by + h * 0.03, w * 0.88, h * 0.12, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.84} size={h * 0.085} color="#FFFFFF" lines={1} />
      </div>
      <div style={abs(w * 0.08, by + h * 0.165, w * 0.82, h * 0.18, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#FF7A72,#E5372F)", borderRadius: r(h), alignItems: "center", justifyContent: "center", border: `${r(3 * s)}px solid #FFF4E0`, boxShadow: `0 ${r(3 * s)}px 0 rgba(0,0,0,0.3)` })}>
        <Preco item={item} maxW={w * 0.7} maxH={h * 0.125} color="#FFF4DA" accent="#FFF4DA" />
      </div>
      {p ? <div style={abs(w * 0.74, h * 0.05, w * 0.2, h * 0.08, { backgroundColor: "#FFFFFF", borderRadius: r(h), border: `${r(2 * s)}px solid #E5372F`, alignItems: "center", justifyContent: "center" })}><Txt text={`-${p}%`} size={h * 0.05} color="#E5372F" /></div> : null}
    </Shell>
  );
}

// ------------------------------------------------------------------ 12
export function Box12({ t, item, w, h, s }: BoxProps): ReactElement {
  const m = 12 * s;
  const iw = w - m * 2;
  const ih = h - m * 2;
  const bh = h * 0.27;
  const by = h - m - bh;
  const sl = w * 0.07;
  const strip = `M${r(w * 0.05)} 0 H${r(iw)} V${r(ih * 0.13)} H0 Z`;
  const ban = `M${r(sl)} 0 H${r(iw)} V${r(bh)} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(135deg,#FAFBFC,#A3ABB6 30%,#EDF0F3 50%,#8B949F 75%,#D9DEE3)", borderRadius: r(14 * s), boxShadow: sh(s, 0.45), border: `${r(1.5 * s)}px solid #6F7884` }}>
      <div style={abs(m, m, iw, ih, { backgroundImage: "linear-gradient(180deg,#FFFFFF,#F2F5F8)", borderRadius: r(6 * s), border: `${r(3 * s)}px solid #1F4FB8`, overflow: "hidden" })} />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.05} w={w * 0.8} h={h * 0.56} />
      <Forma x={m} y={by - ih * 0.13} w={iw} h={ih * 0.13} d={strip} a="#F7F9FB" b="#98A1AC" stroke="#7B8591" sw={r(1.5 * s)} id="b12s" />
      <div style={abs(w * 0.3, by - ih * 0.125, w * 0.6, ih * 0.12, { alignItems: "center", justifyContent: "flex-end" })}>
        <Nome item={item} w={w * 0.58} size={h * 0.075} color="#12306E" align="flex-end" lines={1} />
      </div>
      <Forma x={m} y={by} w={iw} h={bh} d={ban} a="#3A78F0" b="#0A2C8C" stroke="#BFC7D1" sw={r(2.5 * s)} id="b12" />
      <div style={abs(m, by, iw, bh * 0.4, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0))" })} />
      <div style={abs(m, by + bh * 0.04, iw, bh * 0.92, { alignItems: "center", paddingLeft: r(w * 0.07) })}>
        <Preco item={item} maxW={w * 0.72} maxH={bh * 0.62} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

void FONT_ANTON;
