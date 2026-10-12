import type { ReactElement } from "react";
import { Antes, FONT_ALFA, FONT_ANTON, FONT_BALOO, Forma, Nome, Ph, Preco, Shell, Txt, abs, col, pct, r, row, rrect, uri, type BoxProps } from "./kit";

// 01 a 06: vermelho, verde e amarelo, vermelho com faixa 3D, preto e dourado,
// azul circular, laranja cupom.

const sh = (s: number, a = 0.25) => `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,${a})`;

// ------------------------------------------------------------------ 01
export function Box01({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const barH = h * 0.27;
  const barY = h - barH;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", border: `${r(3 * s)}px solid #D3111C`, borderRadius: r(14 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <Ph item={item} t={t} x={w * 0.08} y={h * 0.04} w={w * 0.84} h={h * 0.5} />
      <div style={abs(w * 0.04, h * 0.545, w * 0.92, h * 0.15, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.9} size={h * 0.098} color="#111111" lines={2} />
      </div>
      <div style={abs(-3 * s, barY - 3 * s, w, barH, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg, #E8232D, #AD0C16)", borderRadius: `${r(22 * s)}px 0 ${r(10 * s)}px ${r(10 * s)}px` })} />
      <div style={abs(-3 * s + 4 * s, barY - 3 * s + 3 * s, w - 8 * s, 3 * s, { backgroundColor: "rgba(255,255,255,0.55)", borderRadius: r(3 * s) })} />
      {p ? (
        <>
          <div style={abs(w * 0.05, barY + barH * 0.06, w * 0.3, barH * 0.22, { alignItems: "center" })}>
            <Antes item={item} size={barH * 0.2} color="#FFFFFF" />
          </div>
          <div style={abs(w * 0.64, barY - barH * 0.2, w * 0.3, barH * 0.34, { alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(180deg,#FFE45C,#F5B800)", borderRadius: r(20 * s), border: `${r(2 * s)}px solid #FFFFFF` })}>
            <Txt text={`-${p}%`} size={barH * 0.27} color="#C20D18" />
          </div>
        </>
      ) : null}
      <div style={abs(w * 0.04, barY + barH * (p ? 0.28 : 0.1), w * 0.92, barH * (p ? 0.68 : 0.82), { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.84} maxH={barH * (p ? 0.66 : 0.8)} color="#FFFFFF" accent="#FFFFFF" />
      </div>
      {p ? null : (
        <div style={abs(-6 * s, -6 * s, w * 0.34, h * 0.09, { alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(180deg,#FFE45C,#F5B800)", borderRadius: r(6 * s), transform: "rotate(-6deg)", boxShadow: sh(s, 0.3) })}>
          <Txt text="OFERTA" size={h * 0.055} color="#B80F18" font={FONT_ANTON} ls={1} />
        </div>
      )}
    </Shell>
  );
}

// ------------------------------------------------------------------ 02
export function Box02({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const bw = 7 * s;
  const topH = h * 0.17;
  const ix = bw;
  const iy = topH;
  const iw = w - bw * 2;
  const ih = h - topH - bw;
  const tw = w * 0.55;
  const th = h * 0.28;
  const tx = w - bw - tw + 2 * s;
  const ty = h - bw - th - 1 * s;
  const c = th * 0.3;
  const tab = `M${r(14 * s)} 0 H${r(tw - 6 * s)} Q${r(tw)} 0 ${r(tw)} ${r(6 * s)} V${r(th - c)} L${r(tw - c)} ${r(th)} H${r(14 * s)} Q0 ${r(th)} 0 ${r(th - 14 * s)} V${r(14 * s)} Q0 0 ${r(14 * s)} 0 Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#43C45F 0%,#1B9A3A 30%,#0B6A22 100%)", borderRadius: r(20 * s), boxShadow: `0 ${r(6 * s)}px ${r(16 * s)}px rgba(0,0,0,0.38)`, border: `${r(2 * s)}px solid #8CEB98` }}>
      <div style={abs(ix, iy, iw, ih, { borderRadius: `${r(12 * s)}px ${r(12 * s)}px ${r(14 * s)}px ${r(14 * s)}px`, backgroundImage: "linear-gradient(180deg,#F4F2C9 0%,#CFE08A 35%,#C9B070 70%,#86582D 100%)", overflow: "hidden" })} />
      <Ph item={item} t={t} x={ix + iw * 0.04} y={iy + ih * 0.04} w={iw * 0.92} h={ih * 0.86} />
      <div style={abs(ix, iy, iw, ih, { borderRadius: `${r(12 * s)}px ${r(12 * s)}px ${r(14 * s)}px ${r(14 * s)}px`, border: `${r(2 * s)}px solid rgba(0,0,0,0.35)` })} />
      <div style={abs(w * 0.27, h * 0.012, w * 0.71, topH * 0.92, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.69} size={h * 0.12} color="#FFFFFF" lines={1} shadow={`0 ${r(3 * s)}px 0 rgba(0,40,10,0.6)`} />
      </div>
      <Forma w={tw} h={th} d={tab} a="#FFF35C" b="#F2B000" stroke="#7A5200" sw={r(1.5 * s)} x={tx} y={ty} id="b02t" />
      <div style={abs(tx, ty, tw, th * 0.45, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))", borderRadius: `${r(14 * s)}px ${r(6 * s)}px 0 0` })} />
      <Forma w={c} h={c} d={`M0 0 L${r(c)} 0 L0 ${r(c)} Z`} a="#1FA043" b="#0B6A22" stroke="#06501A" sw={r(1 * s)} x={tx + tw - c} y={ty + th - c} id="b02f" />
      <div style={abs(tx + tw * 0.04, ty + th * 0.04, tw * 0.9, th * 0.92, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={tw * 0.84} maxH={th * 0.62} color="#111111" />
      </div>
      <div style={abs(0, 0, w * 0.27, w * 0.27, { overflow: "hidden", borderRadius: `${r(20 * s)}px 0 0 0` })}>
        <div style={abs(-w * 0.07, w * 0.065, w * 0.42, h * 0.075, { backgroundImage: "linear-gradient(180deg,#FFF35C,#F2B000)", transform: "rotate(-38deg)", alignItems: "center", justifyContent: "center", boxShadow: sh(s, 0.4) })}>
          <Txt text={p ? `-${p}%` : "OFERTA"} size={h * 0.05} color="#D3121D" />
        </div>
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 03
export function Box03({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const bd = 5 * s;
  const y0 = h * 0.745;
  const y1 = h * 0.635;
  const curve = `M0 ${r(y0)} C${r(w * 0.3)} ${r(y0 - h * 0.012)} ${r(w * 0.7)} ${r(y1 + h * 0.03)} ${r(w)} ${r(y1)}`;
  const bar = `${curve} V${r(h)} H0 Z`;
  const rib = `${curve} V${r(y1 + 9 * s)} C${r(w * 0.7)} ${r(y1 + h * 0.03 + 9 * s)} ${r(w * 0.3)} ${r(y0 - h * 0.012 + 9 * s)} 0 ${r(y0 + 9 * s)} Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#F0323B,#B80F1A)", border: "none", borderRadius: r(24 * s), boxShadow: `0 ${r(6 * s)}px ${r(16 * s)}px rgba(0,0,0,0.3)` }}>
      <div style={abs(bd, bd, w - bd * 2, h - bd * 2, { backgroundColor: "#FFFFFF", borderRadius: r(19 * s), overflow: "hidden" })} />
      <Ph item={item} t={t} x={w * 0.14} y={h * 0.03} w={w * 0.72} h={h * 0.5} />
      <div style={abs(w * 0.07, h * 0.5, w * 0.62, h * 0.17, { alignItems: "flex-end" })}>
        <Nome item={item} w={w * 0.62} size={h * 0.1} color="#111111" align="flex-start" lines={2} gap={0.96} />
      </div>
      {p ? (
        <div style={abs(w * 0.58, h * 0.03, w * 0.38, h * 0.2, { flexDirection: "column", alignItems: "flex-end" })}>
          <div style={{ display: "flex", backgroundImage: "linear-gradient(180deg,#FFE766,#F2B000)", borderRadius: r(12 * s), padding: `${r(2 * s)}px ${r(10 * s)}px`, boxShadow: sh(s, 0.3), transform: "rotate(-3deg)" }}>
            <Txt text={`-${p}%`} size={h * 0.1} color="#D3121D" />
          </div>
          <div style={{ display: "flex", marginTop: r(5 * s), marginRight: r(6 * s) }}><Antes item={item} size={h * 0.04} color="#222222" /></div>
        </div>
      ) : null}
      <div style={abs(bd, bd, w - bd * 2, h - bd * 2, { borderRadius: r(19 * s), overflow: "hidden" })}>
        <svg width={r(w - bd * 2)} height={r(h - bd * 2)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: r(-bd), top: r(-bd) }}>
          <defs>
            <linearGradient id="b03a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5333D" /><stop offset="0.55" stopColor="#CC1520" /><stop offset="1" stopColor="#9E0A14" /></linearGradient>
            <linearGradient id="b03b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF07A" /><stop offset="1" stopColor="#F0A800" /></linearGradient>
          </defs>
          <path d={rib} fill="url(#b03b)" transform={`translate(${r(-bd)} ${r(-bd)})`} />
          <path d={bar} fill="url(#b03a)" transform={`translate(${r(-bd)} ${r(7 * s - bd)})`} />
        </svg>
      </div>
      <div style={abs(w * 0.07, y0 + h * 0.03, w * 0.88, h * 0.205, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.84} maxH={h * 0.165} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 04
export function Box04({ t, item, w, h, s }: BoxProps): ReactElement {
  const c = 22 * s;
  const shape = `M${c} 0 H${w - c} L${w} ${c} V${h - c} L${w - c} ${h} H${c} L0 ${h - c} V${c} Z`;
  const g = 7 * s;
  const c2 = c - g * 0.4;
  const inner = `M${g + c2} ${g} H${w - g - c2} L${w - g} ${g + c2} V${h - g - c2} L${w - g - c2} ${h - g} H${g + c2} L${g} ${h - g - c2} V${g + c2} Z`;
  const circ = Math.min(w * 0.8, h * 0.68);
  const cx = w * 0.05;
  const cy = h * 0.05;
  const p = pct(item);
  const priceW = w * 0.55;
  const priceH = h * 0.27;
  const py = h - priceH - h * 0.06;
  const px = w - priceW - w * 0.05;
  const k = priceH * 0.28;
  const par = `M${k} 0 H${priceW - k * 0.4} L${priceW} ${k * 0.4} V${priceH} H0 V${k} Z`;
  return (
    <Shell w={w} h={h}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b04a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#26262C" /><stop offset="0.5" stopColor="#111115" /><stop offset="1" stopColor="#050507" /></linearGradient>
          <linearGradient id="b04g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFE9A0" /><stop offset="0.5" stopColor="#D9A22B" /><stop offset="1" stopColor="#8A5E0F" /></linearGradient>
        </defs>
        <path d={shape} fill="url(#b04g)" />
        <path d={`M${g * 0.5 + c} ${g * 0.5} H${w - g * 0.5 - c} L${w - g * 0.5} ${g * 0.5 + c} V${h - g * 0.5 - c} L${w - g * 0.5 - c} ${h - g * 0.5} H${g * 0.5 + c} L${g * 0.5} ${h - g * 0.5 - c} V${g * 0.5 + c} Z`} fill="#0A0A0C" />
        <path d={inner} fill="url(#b04a)" stroke="#E9BE55" strokeWidth={r(2 * s)} />
      </svg>
      <div style={abs(cx - 4 * s, cy - 4 * s, circ + 8 * s, circ + 8 * s, { borderRadius: circ, backgroundImage: "linear-gradient(135deg,#FFEFB0,#C9921F 55%,#8A5E0F)" })} />
      <div style={abs(cx, cy, circ, circ, { borderRadius: circ, backgroundImage: "radial-gradient(circle at 50% 38%, #FFFFFF 0%, #F4F4F4 55%, #D6D6D6 100%)" })} />
      <Ph item={item} t={t} x={cx + circ * 0.07} y={cy + circ * 0.07} w={circ * 0.86} h={circ * 0.86} />
      <div style={abs(w * 0.07, h * 0.72, w * 0.36, h * 0.2, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.34} size={h * 0.075} color="#FFFFFF" align="flex-start" lines={2} gap={0.98} />
      </div>
      <Forma x={px} y={py} w={priceW} h={priceH} d={par} a="#FFE9A0" b="#B97D12" stroke="#FFF3C4" sw={2 * s} id="b04p" />
      <Forma x={px + 4 * s} y={py + 4 * s} w={priceW - 8 * s} h={priceH - 8 * s} d={`M${k} 0 H${priceW - 8 * s - k * 0.4} L${priceW - 8 * s} ${k * 0.4} V${priceH - 8 * s} H0 V${k} Z`} a="#FFD65A" b="#E0A21A" stroke="#8A5E0F" sw={1.5 * s} id="b04q" />
      <div style={abs(px + k * 0.6, py, priceW - k * 0.6, priceH, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={priceW * 0.74} maxH={priceH * 0.58} color="#0B0B0D" accent="#0B0B0D" />
      </div>
      <div style={abs(-2 * s, h * 0.015, w * 0.46, h * 0.1, { alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(180deg,#FFE9A0,#D9A22B 55%,#9C6A12)", borderRadius: `${r(4 * s)}px ${r(18 * s)}px ${r(18 * s)}px ${r(4 * s)}px`, border: `${r(2 * s)}px solid #FFF3C4`, boxShadow: sh(s, 0.5) })}>
        <Txt text={p ? `-${p}%` : "OFERTA"} size={h * 0.068} color="#0B0B0D" ls={1} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 05
export function Box05({ t, item, w, h, s }: BoxProps): ReactElement {
  const swoosh = `M0 0 H${r(w * 0.15)} C${r(w * 0.03)} ${r(h * 0.2)} ${r(w * 0.06)} ${r(h * 0.5)} ${r(w * 0.4)} ${r(h * 0.6)} S${r(w * 0.82)} ${r(h * 0.62)} ${r(w)} ${r(h * 0.57)} V${r(h)} H0 Z`;
  const line = `M${r(w * 0.15)} 0 C${r(w * 0.03)} ${r(h * 0.2)} ${r(w * 0.06)} ${r(h * 0.5)} ${r(w * 0.4)} ${r(h * 0.6)} S${r(w * 0.82)} ${r(h * 0.62)} ${r(w)} ${r(h * 0.57)}`;
  const d = Math.min(w * 0.46, h * 0.43);
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg,#FFFFFF,#F1F4FA)", borderRadius: r(18 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b05" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stopColor="#1F63E8" /><stop offset="0.5" stopColor="#0E3FB5" /><stop offset="1" stopColor="#06236C" /></linearGradient>
        </defs>
        <path d={swoosh} fill="url(#b05)" />
        <path d={line} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={r(2 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.14} y={h * 0.03} w={w * 0.8} h={h * 0.58} />
      <div style={abs(w * 0.06, h * 0.66, w * 0.5, h * 0.3, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.48} size={h * 0.115} color="#FFFFFF" align="flex-start" lines={2} gap={0.96} shadow={`0 ${r(3 * s)}px 0 rgba(0,0,40,0.4)`} />
      </div>
      <div style={abs(w - d - w * 0.02, h - d - h * 0.02, d, d, { borderRadius: d, backgroundImage: "radial-gradient(circle at 40% 28%, #FFF48F, #FFDA2E 55%, #F2A900)", boxShadow: `0 ${r(5 * s)}px ${r(12 * s)}px rgba(0,0,0,0.4)`, border: `${r(3 * s)}px solid #FFFFFF`, alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={d * 0.84} maxH={d * 0.58} color="#0A2E8A" accent="#0A2E8A" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 06
export function Box06({ t, item, w, h, s }: BoxProps): ReactElement {
  const n = h * 0.035;
  const y1 = h * 0.5;
  const shape = `M${14 * s} 0 H${w - 14 * s} Q${w} 0 ${w} ${14 * s} V${y1 - n} A${n} ${n} 0 0 0 ${w} ${y1 + n} V${h - 14 * s} Q${w} ${h} ${w - 14 * s} ${h} H${14 * s} Q0 ${h} 0 ${h - 14 * s} V${y1 + n} A${n} ${n} 0 0 0 0 ${y1 - n} V${14 * s} Q0 0 ${14 * s} 0 Z`;
  const px = w * 0.045;
  const pw = w * 0.91;
  const py = h * 0.03;
  const ph = h * 0.57;
  const c = 12 * s;
  const panel = `M${r(px + c)} ${r(py)} H${r(px + pw - c)} Q${r(px + pw)} ${r(py)} ${r(px + pw)} ${r(py + c)} V${r(py + ph - h * 0.03)} Q${r(px + pw * 0.5)} ${r(py + ph + h * 0.02)} ${r(px)} ${r(py + ph - h * 0.03)} V${r(py + c)} Q${r(px)} ${r(py)} ${r(px + c)} ${r(py)} Z`;
  const edge = `M${r(px)} ${r(py + ph - h * 0.03)} Q${r(px + pw * 0.5)} ${r(py + ph + h * 0.02)} ${r(px + pw)} ${r(py + ph - h * 0.03)}`;
  return (
    <Shell w={w} h={h} style={{ boxShadow: `0 ${r(5 * s)}px ${r(14 * s)}px rgba(0,0,0,0.35)` }}>
      <svg width={r(w)} height={r(h)} viewBox={`0 0 ${r(w)} ${r(h)}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <linearGradient id="b06" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FF9A33" /><stop offset="0.5" stopColor="#F5680E" /><stop offset="1" stopColor="#D94A00" /></linearGradient>
          <linearGradient id="b06c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF8EA" /><stop offset="1" stopColor="#F6E4C4" /></linearGradient>
          <linearGradient id="b06p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#F3F0EA" /></linearGradient>
        </defs>
        <path d={shape} fill="url(#b06)" />
        <path d={shape} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={r(2 * s)} />
        <rect x={r(px)} y={r(h * 0.45)} width={r(pw)} height={r(h * 0.28)} rx={r(8 * s)} fill="url(#b06c)" />
        <path d={panel} fill="url(#b06p)" />
        <path d={edge} fill="none" stroke="#1B2F6B" strokeWidth={r(3 * s)} />
      </svg>
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.04} w={w * 0.8} h={h * 0.5} />
      <div style={abs(w * 0.05, h * 0.615, w * 0.9, h * 0.11, { alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.09} color="#1B2F6B" lines={1} />
      </div>
      <div style={abs(w * 0.055, h * 0.735, w * 0.89, h * 0.235, { backgroundImage: "linear-gradient(180deg,#FF8420 0%,#F2600A 45%,#D14400 100%)", borderRadius: r(14 * s), border: `${r(3 * s)}px solid #FFB36B`, alignItems: "center", justifyContent: "center", boxShadow: `0 ${r(3 * s)}px 0 rgba(120,30,0,0.55)` })}>
        <div style={abs(0, 0, w * 0.89 - 6 * s, h * 0.1, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.3), rgba(255,255,255,0))", borderRadius: `${r(11 * s)}px ${r(11 * s)}px 0 0` })} />
        <Preco item={item} maxW={w * 0.82} maxH={h * 0.165} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

void FONT_ALFA; void FONT_BALOO; void col; void row; void rrect; void uri; void Antes;
