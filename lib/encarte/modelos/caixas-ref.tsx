import type { ReactElement } from "react";
import type { EncarteData } from "../types";
import { compor, type CardProps } from "./brilho";
import { BOXES, type BoxDef } from "./boxes";

// As 24 caixas de referência (cx01 a cx24): cada uma vira um modelo da arte.
// A caixa é desenhada na proporção própria e centralizada na célula da grade.

function cardDe(def: BoxDef) {
  return function CardRef({ t, item, w, h, s, wide, index }: CardProps): ReactElement {
    const bw = Math.round(Math.min(w, h * def.aspect));
    const bh = Math.round(bw / def.aspect);
    return (
      <div style={{ display: "flex", width: w, height: h, alignItems: "center", justifyContent: "center" }}>
        {def.render({ t, item, w: bw, h: bh, s: Math.max(0.5, Math.min(1.6, bw / 300)) * 1 * (s > 0 ? 1 : 1), wide, index })}
      </div>
    );
  };
}

export const MODELOS_CAIXA: Record<string, { label: string; hint: string; render: (d: EncarteData, i: number) => ReturnType<typeof compor> }> = Object.fromEntries(
  BOXES.map((b) => [
    b.id,
    {
      label: b.nome,
      hint: `Caixa ${b.id.slice(2)} das referências, cores fixas, fundo e emblema à escolha`,
      render: (d: EncarteData, i: number) => compor(d, i, { estilo: "vinheta", Card: cardDe(b), gap: 22, padX: 34, cardMaxRatio: 1.25 }),
    },
  ])
);
