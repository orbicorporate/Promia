import type { ReactElement } from "react";
import type { ValidadeEstilo } from "../validade";
import { FONT_ANTON, FONT_BALOO } from "./tipografia";
import type { BT } from "./brilho";

// Desenho da validade ("VÁLIDO 14/10 a 20/10") em cada estilo. Só o elemento:
// a posição na página é decidida em brilho.tsx.

type Partes = { rotulo: string; datas: string };
const row = { display: "flex", flexDirection: "row" } as const;
const r = Math.round;

// altura aproximada de cada estilo, para reservar espaço na grade
export function alturaValidade(estilo: ValidadeEstilo, s: number): number {
  if (estilo === "selo") return r(168 * s);
  if (estilo === "etiqueta" || estilo === "texto") return r(54 * s);
  return r(58 * s);
}

export function ValidadeEl({ vp, estilo, t, s }: { vp: Partes; estilo: ValidadeEstilo; t: BT; s: number }): ReactElement {
  if (estilo === "selo") {
    const d = r(168 * s);
    const partes = vp.datas.split(" a ");
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: d, height: d, borderRadius: d, backgroundColor: t.gold, border: `${r(5 * s)}px solid ${t.ink}`, boxShadow: `0 ${r(10 * s)}px ${r(24 * s)}px rgba(0,0,0,0.4)`, color: t.ink }}>
        <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(19 * s), letterSpacing: 1.5 * s, whiteSpace: "nowrap" }}>{vp.rotulo}</div>
        <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r((partes.length > 1 ? 36 : 44) * s), lineHeight: 1.05, whiteSpace: "nowrap" }}>{partes[0]}</div>
        {partes[1] ? <div style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(26 * s), lineHeight: 1.05, whiteSpace: "nowrap" }}>{`a ${partes[1]}`}</div> : null}
      </div>
    );
  }
  if (estilo === "etiqueta") {
    return (
      <div style={{ ...row, alignItems: "center", height: r(54 * s), padding: `0 ${r(26 * s)}px`, borderRadius: r(10 * s), backgroundColor: t.gold, color: t.ink, borderBottom: `${r(5 * s)}px solid rgba(0,0,0,0.28)`, boxShadow: `0 ${r(8 * s)}px ${r(18 * s)}px rgba(0,0,0,0.3)`, whiteSpace: "nowrap" }}>
        <span style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(20 * s), letterSpacing: 1.5 * s, marginRight: r(12 * s) }}>{vp.rotulo}</span>
        <span style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(30 * s), letterSpacing: 1 * s }}>{vp.datas}</span>
      </div>
    );
  }
  if (estilo === "texto") {
    return (
      <div style={{ ...row, alignItems: "center", height: r(54 * s), whiteSpace: "nowrap", textShadow: `0 ${r(3 * s)}px ${r(12 * s)}px rgba(0,0,0,0.65)` }}>
        <span style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), letterSpacing: 2 * s, color: t.gold, marginRight: r(14 * s) }}>{vp.rotulo}</span>
        <span style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(38 * s), letterSpacing: 1 * s, color: "#fff" }}>{vp.datas}</span>
      </div>
    );
  }
  if (estilo === "claro") {
    return (
      <div style={{ ...row, alignItems: "stretch", height: r(58 * s), borderRadius: r(29 * s), overflow: "hidden", backgroundColor: "rgba(255,255,255,0.95)", boxShadow: `0 ${r(8 * s)}px ${r(20 * s)}px rgba(0,0,0,0.25)`, border: `${r(2.5 * s)}px solid ${t.gold}` }}>
        <div style={{ ...row, alignItems: "center", padding: `0 ${r(20 * s)}px`, backgroundColor: t.gold, color: t.ink, fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), letterSpacing: 1.5 * s, whiteSpace: "nowrap" }}>{vp.rotulo}</div>
        <div style={{ ...row, alignItems: "center", padding: `0 ${r(26 * s)}px`, color: "#1b2530", fontFamily: FONT_ANTON, fontSize: r(32 * s), letterSpacing: 1 * s, whiteSpace: "nowrap" }}>{vp.datas}</div>
      </div>
    );
  }
  // pílula escura (o desenho original)
  return (
    <div style={{ ...row, alignItems: "stretch", height: r(58 * s), borderRadius: r(14 * s), overflow: "hidden", boxShadow: `0 ${r(8 * s)}px ${r(20 * s)}px rgba(0,0,0,0.35)`, border: `${r(2.5 * s)}px solid ${t.gold}` }}>
      <div style={{ ...row, alignItems: "center", padding: `0 ${r(20 * s)}px`, backgroundColor: t.gold, color: t.ink, fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(22 * s), letterSpacing: 1.5 * s, whiteSpace: "nowrap" }}>{vp.rotulo}</div>
      <div style={{ ...row, alignItems: "center", padding: `0 ${r(26 * s)}px`, backgroundColor: "rgba(8,12,24,0.78)", color: "#fff", fontFamily: FONT_ANTON, fontSize: r(32 * s), letterSpacing: 1 * s, whiteSpace: "nowrap" }}>{vp.datas}</div>
    </div>
  );
}
