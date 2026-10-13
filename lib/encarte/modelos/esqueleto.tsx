import type { ReactElement } from "react";
import type { EncarteData, EncarteItem } from "../types";
import { compor, type CardProps, type Pg } from "./brilho";
import { PRODUTOS_POR_ENCARTE } from "../formats";

// Esqueleto do encarte: fundo, logo e título já no lugar, e cada caixa de
// produto só marcada em linhas tracejadas e sombra, com o número da posição.
// É a prévia dos passos "Objetivo" e "Fundo": o dono vê onde cada uma das 12
// caixas vai ficar antes de escolher o estilo delas.

const VAZIO: EncarteItem = { name: "", price: 0, highlight: false };

function CardEsqueleto({ w, h, s, index }: CardProps): ReactElement {
  const bw = Math.round(Math.min(w, h * 0.9));
  const bh = Math.round(bw / 0.9);
  const linha = Math.max(2, Math.round(3.5 * s));
  const raio = Math.round(bw * 0.07);
  const n = Math.round(Math.min(bw * 0.2, 56 * s));
  const inner = Math.round(bw * 0.09);
  return (
    <div style={{ display: "flex", width: w, height: h, alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: bw,
          height: bh,
          borderRadius: raio,
          border: `${linha}px dashed rgba(255,255,255,0.92)`,
          backgroundColor: "rgba(255,255,255,0.14)",
          boxShadow: `0 ${Math.round(10 * s)}px ${Math.round(26 * s)}px rgba(0,0,0,0.38)`,
          padding: inner,
        }}
      >
        {/* foto */}
        <div style={{ display: "flex", flex: 1, borderRadius: Math.round(raio * 0.6), border: `${Math.max(1, Math.round(2.5 * s))}px dashed rgba(255,255,255,0.55)`, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: n, height: n, borderRadius: n, backgroundColor: "rgba(255,255,255,0.92)", color: "#1b2a22", fontWeight: 800, fontSize: Math.round(n * 0.52) }}>{index + 1}</div>
        </div>
        {/* nome e preço */}
        <div style={{ display: "flex", height: Math.round(bh * 0.07), marginTop: Math.round(bh * 0.035), borderRadius: 99, backgroundColor: "rgba(255,255,255,0.5)", width: "78%", alignSelf: "center" }} />
        <div style={{ display: "flex", height: Math.round(bh * 0.15), marginTop: Math.round(bh * 0.03), borderRadius: Math.round(raio * 0.6), border: `${Math.max(1, Math.round(2.5 * s))}px dashed rgba(255,255,255,0.55)` }} />
      </div>
    </div>
  );
}

export function renderEsqueleto(data: EncarteData, pageIndex: number): Pg | null {
  // um modelo qualquer só para valer a regra de 12 por página; a arte das caixas não entra
  const d: EncarteData = { ...data, modelo: data.modelo ?? "cx01", layout: "grade", items: Array.from({ length: PRODUTOS_POR_ENCARTE }, () => VAZIO) };
  return compor(d, pageIndex, { estilo: "vinheta", Card: CardEsqueleto, gap: 22, padX: 34, cardMaxRatio: 1.25 });
}
