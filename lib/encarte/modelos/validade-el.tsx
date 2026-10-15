import type { ReactElement } from "react";
import { tintaSobre, VALIDADE_COR_HEX, type ValidadeCor, type ValidadeEstilo } from "../validade";
import { FONT_ANTON, FONT_BALOO } from "./tipografia";

// Desenho da validade ("VÁLIDO 14/10 a 20/10"): três estilos, uma cor à escolha.
// Só o elemento: a posição na página é decidida em brilho.tsx.

type Partes = { rotulo: string; datas: string };
const r = Math.round;

export function alturaValidade(estilo: ValidadeEstilo, s: number): number {
  return r((estilo === "texto" ? 46 : 52) * s);
}

export function ValidadeEl({ vp, estilo, cor, s }: { vp: Partes; estilo: ValidadeEstilo; cor: ValidadeCor; s: number }): ReactElement {
  const hex = VALIDADE_COR_HEX[cor];
  const escuro = cor === "preto";
  const base = { display: "flex", flexDirection: "row", alignItems: "center", height: alturaValidade(estilo, s), whiteSpace: "nowrap" } as const;
  const rotulo = (color: string) => (
    <span style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(19 * s), letterSpacing: 2 * s, color, marginRight: r(12 * s) }}>{vp.rotulo}</span>
  );
  const datas = (color: string, size: number) => (
    <span style={{ display: "flex", fontFamily: FONT_ANTON, fontSize: r(size * s), letterSpacing: 1 * s, color }}>{vp.datas}</span>
  );

  if (estilo === "contorno") {
    return (
      <div style={{ ...base, padding: `0 ${r(26 * s)}px`, borderRadius: r(26 * s), border: `${r(3 * s)}px solid ${hex}`, backgroundColor: escuro ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.32)" }}>
        {rotulo(hex)}
        {datas(hex, 30)}
      </div>
    );
  }
  if (estilo === "texto") {
    return (
      <div style={{ ...base, textShadow: escuro ? `0 0 ${r(10 * s)}px rgba(255,255,255,0.9)` : `0 ${r(3 * s)}px ${r(12 * s)}px rgba(0,0,0,0.6)` }}>
        {rotulo(hex)}
        {datas(hex, 36)}
      </div>
    );
  }
  const tinta = tintaSobre(cor);
  return (
    <div style={{ ...base, padding: `0 ${r(28 * s)}px`, borderRadius: r(26 * s), backgroundColor: hex, boxShadow: `0 ${r(8 * s)}px ${r(20 * s)}px rgba(0,0,0,0.3)` }}>
      {rotulo(tinta)}
      {datas(tinta, 30)}
    </div>
  );
}
