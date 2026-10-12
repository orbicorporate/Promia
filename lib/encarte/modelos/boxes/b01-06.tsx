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
  const bw = 6 * s;
  return (
    <Shell w={w} h={h} style={{ backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#25A844,#0B6A22)", borderRadius: r(18 * s), boxShadow: sh(s, 0.35), border: `${r(2 * s)}px solid #7FE08E` }}>
      <div style={abs(bw, bw, w - bw * 2, h - bw * 2, { borderRadius: r(13 * s), backgroundImage: "radial-gradient(circle at 50% 40%, #FFFBE3, #F3DE8A 70%, #E3C25B)", overflow: "hidden" })} />
      <Ph item={item} t={t} x={w * 0.06} y={h * 0.16} w={w * 0.88} h={h * 0.6} />
      <div style={abs(bw, bw, w - bw * 2, h * 0.17, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#2FB04D,#127A2B)", borderRadius: `${r(13 * s)}px ${r(13 * s)}px 0 0`, alignItems: "center", justifyContent: "center" })}>
        <Nome item={item} w={w * 0.86} size={h * 0.095} color="#FFFFFF" lines={1} shadow={`0 ${r(2 * s)}px 0 rgba(0,0,0,0.45)`} />
      </div>
      <div style={abs(w * 0.34, h * 0.69, w * 0.62, h * 0.27, { backgroundImage: "linear-gradient(180deg,#FFE95E,#F5B500)", borderRadius: r(16 * s), border: `${r(3 * s)}px solid #FFFFFF`, boxShadow: sh(s, 0.35), alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.54} maxH={h * 0.2} color="#111111" />
      </div>
      <div style={abs(w * 0.04, h * 0.2, w * 0.3, h * 0.07, { backgroundImage: "linear-gradient(180deg,#FFE95E,#F5B500)", borderRadius: r(6 * s), transform: "rotate(-8deg)", alignItems: "center", justifyContent: "center", boxShadow: sh(s, 0.3) })}>
        <Txt text={p ? `-${p}%` : "OFERTA"} size={h * 0.05} color="#0B6A22" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 03
export function Box03({ t, item, w, h, s }: BoxProps): ReactElement {
  const p = pct(item);
  const barH = h * 0.3;
  const barY = h - barH - 4 * s;
  const d = `M0 ${barH * 0.3} Q0 ${barH * 0.02} ${w * 0.1} ${barH * 0.04} L${w} ${barH * 0.0} L${w} ${barH} L0 ${barH} Z`;
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", border: `${r(4 * s)}px solid #D91A24`, borderRadius: r(22 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <Ph item={item} t={t} x={w * 0.2} y={h * 0.02} w={w * 0.62} h={h * 0.46} />
      <div style={abs(w * 0.05, h * 0.45, w * 0.6, h * 0.14, { alignItems: "flex-end" })}>
        <Nome item={item} w={w * 0.6} size={h * 0.095} color="#111111" align="flex-start" lines={2} />
      </div>
      {p ? (
        <div style={abs(w * 0.62, h * 0.04, w * 0.34, h * 0.2, { flexDirection: "column", alignItems: "flex-end" })}>
          <Txt text={`-${p}%`} size={h * 0.12} color="#D91A24" font={FONT_ANTON} style={{ transform: "rotate(-4deg)" }} />
          <div style={{ display: "flex", marginTop: r(4 * s) }}><Antes item={item} size={h * 0.045} color="#222222" /></div>
        </div>
      ) : null}
      <Forma x={-4 * s} y={barY} w={w} h={barH} d={d} a="#EE2B35" b="#B30E19" id="b03" />
      <div style={abs(w * 0.1, barY + barH * 0.08, w * 0.8, 3 * s, { backgroundColor: "rgba(255,255,255,0.5)", borderRadius: r(2 * s) })} />
      <div style={abs(w * 0.04, barY + barH * 0.14, w * 0.92, barH * 0.8, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={w * 0.84} maxH={barH * 0.72} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 04
export function Box04({ t, item, w, h, s }: BoxProps): ReactElement {
  const c = 20 * s;
  const shape = `M${c} 0 H${w - c} L${w} ${c} V${h - c} L${w - c} ${h} H${c} L0 ${h - c} V${c} Z`;
  const circ = Math.min(w * 0.74, h * 0.64);
  const p = pct(item);
  const priceW = w * 0.58;
  const priceH = h * 0.26;
  const py = h - priceH - h * 0.045;
  const px = w - priceW - w * 0.04;
  const skew = priceH * 0.3;
  const par = `M${skew} 0 H${priceW} V${priceH} H0 Z`;
  return (
    <Shell w={w} h={h} style={{ boxShadow: sh(s, 0.4) }}>
      <Forma w={w} h={h} d={shape} a="#1C1C21" b="#050506" stroke="#D9A83B" sw={3 * s} id="b04" />
      <div style={abs(w * 0.04, h * 0.04, circ, circ, { borderRadius: circ, backgroundImage: "radial-gradient(circle at 50% 40%, #FFFFFF, #E4E4E4)", boxShadow: "0 0 0 " + r(3 * s) + "px #D9A83B" })} />
      <Ph item={item} t={t} x={w * 0.04 + circ * 0.08} y={h * 0.04 + circ * 0.08} w={circ * 0.84} h={circ * 0.84} />
      <div style={abs(w * 0.05, h * 0.69, w * 0.4, h * 0.2, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.38} size={h * 0.07} color="#FFFFFF" align="flex-start" lines={2} />
      </div>
      <Forma x={px} y={py} w={priceW} h={priceH} d={par} a="#FFE58A" b="#C8921A" stroke="#7A5200" sw={2 * s} id="b04p" />
      <div style={abs(px + skew * 0.5, py, priceW - skew * 0.5, priceH, { alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={priceW * 0.7} maxH={priceH * 0.56} color="#0B0B0D" accent="#0B0B0D" />
      </div>
      <div style={abs(w * 0.02, h * 0.02, w * 0.36, h * 0.075, { alignItems: "center", justifyContent: "center", backgroundImage: "linear-gradient(180deg,#FFE58A,#C8921A)", borderRadius: `${r(4 * s)}px ${r(14 * s)}px ${r(14 * s)}px ${r(4 * s)}px` })}>
        <Txt text={p ? `-${p}%` : "OFERTA"} size={h * 0.052} color="#0B0B0D" ls={1} />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 05
export function Box05({ t, item, w, h, s }: BoxProps): ReactElement {
  const swoosh = `M0 ${h * 0.42} Q${w * 0.35} ${h * 0.5} ${w * 0.62} ${h * 0.7} Q${w * 0.78} ${h * 0.82} ${w * 0.9} ${h} L0 ${h} Z`;
  const d = Math.min(w * 0.48, h * 0.42);
  return (
    <Shell w={w} h={h} style={{ backgroundColor: "#FFFFFF", borderRadius: r(16 * s), boxShadow: sh(s), overflow: "hidden" }}>
      <Ph item={item} t={t} x={w * 0.14} y={h * 0.03} w={w * 0.8} h={h * 0.6} />
      <Forma w={w} h={h} d={swoosh} a="#1148C8" b="#05256F" id="b05" />
      <div style={abs(w * 0.05, h * 0.64, w * 0.5, h * 0.3, { alignItems: "center" })}>
        <Nome item={item} w={w * 0.5} size={h * 0.105} color="#FFFFFF" align="flex-start" lines={2} shadow={`0 ${r(3 * s)}px 0 rgba(0,0,0,0.35)`} />
      </div>
      <div style={abs(w - d - w * 0.03, h - d - h * 0.03, d, d, { borderRadius: d, backgroundImage: "radial-gradient(circle at 40% 30%, #FFF08A, #FFD21F 60%, #F0A800)", boxShadow: sh(s, 0.4), border: `${r(3 * s)}px solid #FFFFFF`, alignItems: "center", justifyContent: "center" })}>
        <Preco item={item} maxW={d * 0.82} maxH={d * 0.58} color="#0A2E8A" accent="#0A2E8A" />
      </div>
    </Shell>
  );
}

// ------------------------------------------------------------------ 06
export function Box06({ t, item, w, h, s }: BoxProps): ReactElement {
  const n = h * 0.035;
  const y1 = h * 0.5;
  const shape = `M${12 * s} 0 H${w - 12 * s} Q${w} 0 ${w} ${12 * s} V${y1 - n} A${n} ${n} 0 0 0 ${w} ${y1 + n} V${h - 12 * s} Q${w} ${h} ${w - 12 * s} ${h} H${12 * s} Q0 ${h} 0 ${h - 12 * s} V${y1 + n} A${n} ${n} 0 0 0 0 ${y1 - n} V${12 * s} Q0 0 ${12 * s} 0 Z`;
  return (
    <Shell w={w} h={h} style={{ boxShadow: sh(s, 0.35) }}>
      <Forma w={w} h={h} d={shape} a="#FF8B24" b="#E8530A" id="b06" />
      <div style={abs(w * 0.04, h * 0.03, w * 0.92, h * 0.5, { backgroundColor: "#FFFFFF", borderRadius: r(10 * s), overflow: "hidden", backgroundImage: "linear-gradient(180deg,#FFFFFF,#FFF4E4)" })} />
      <Ph item={item} t={t} x={w * 0.1} y={h * 0.04} w={w * 0.8} h={h * 0.47} />
      <div style={abs(w * 0.04, h * 0.5, w * 0.92, h * 0.15, { backgroundColor: "#FFF6E6", alignItems: "center", justifyContent: "center", borderBottom: `${r(3 * s)}px solid #1B2F6B` })}>
        <Nome item={item} w={w * 0.86} size={h * 0.08} color="#1B2F6B" lines={1} />
      </div>
      <div style={abs(w * 0.06, h * 0.69, w * 0.88, h * 0.23, { backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 46%, rgba(255,255,255,0) 52%), linear-gradient(180deg,#FF7A1A,#E04C00)", borderRadius: r(12 * s), border: `${r(2.5 * s)}px solid #FFB067`, alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 0 transparent" })}>
        <Preco item={item} maxW={w * 0.78} maxH={h * 0.18} color="#FFFFFF" accent="#FFFFFF" />
      </div>
    </Shell>
  );
}

void FONT_ALFA; void FONT_BALOO; void col; void row; void rrect; void uri; void Antes;
