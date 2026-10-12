import type { ReactElement } from "react";
import { Box04, Box05, Box06 } from "./b01-06";
import { Box07, Box08, Box09, Box10, Box11, Box12 } from "./b07-12";
import { Box13, Box14, Box15, Box16, Box17, Box18 } from "./b13-18";
import { Box19, Box20, Box21, Box22, Box23, Box24 } from "./b19-24";
import type { BoxProps } from "./kit";
import { SvgBox01, SvgBox02, SvgBox03 } from "./svgboxes";

export type BoxDef = { id: string; nome: string; aspect: number; render: (p: BoxProps) => ReactElement };

// proporção (largura/altura) de cada box, como nas referências
export const BOXES: BoxDef[] = [
  { id: "cx01", nome: "Vermelho clássico", aspect: 0.9, render: SvgBox01 },
  { id: "cx02", nome: "Verde e amarelo", aspect: 0.9, render: SvgBox02 },
  { id: "cx03", nome: "Vermelho faixa 3D", aspect: 0.9, render: SvgBox03 },
  { id: "cx04", nome: "Preto e dourado", aspect: 0.95, render: Box04 },
  { id: "cx05", nome: "Azul circular", aspect: 1, render: Box05 },
  { id: "cx06", nome: "Laranja cupom", aspect: 0.92, render: Box06 },
  { id: "cx07", nome: "Arco vinho", aspect: 0.8, render: Box07 },
  { id: "cx08", nome: "Dobra turquesa", aspect: 0.95, render: Box08 },
  { id: "cx09", nome: "Roxo e lima", aspect: 0.9, render: Box09 },
  { id: "cx10", nome: "Madeira e lousa", aspect: 0.88, render: Box10 },
  { id: "cx11", nome: "Coral e marinho", aspect: 0.82, render: Box11 },
  { id: "cx12", nome: "Prata e azul", aspect: 0.9, render: Box12 },
  { id: "cx13", nome: "Marfim e amarelo", aspect: 0.9, render: Box13 },
  { id: "cx14", nome: "Verde sálvia", aspect: 1.05, render: Box14 },
  { id: "cx15", nome: "Azul gelo", aspect: 0.9, render: Box15 },
  { id: "cx16", nome: "Vinho e rosé", aspect: 0.9, render: Box16 },
  { id: "cx17", nome: "Grafite e champanhe", aspect: 0.82, render: Box17 },
  { id: "cx18", nome: "Cobalto e coral", aspect: 0.9, render: Box18 },
  { id: "cx19", nome: "Arco terracota", aspect: 0.82, render: Box19 },
  { id: "cx20", nome: "Verde em camadas", aspect: 0.88, render: Box20 },
  { id: "cx21", nome: "Amarelo com fita", aspect: 0.85, render: Box21 },
  { id: "cx22", nome: "Janela pastel", aspect: 0.88, render: Box22 },
  { id: "cx23", nome: "Verde-água", aspect: 0.95, render: Box23 },
  { id: "cx24", nome: "Pêssego", aspect: 0.88, render: Box24 },
];
