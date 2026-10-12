import type { ReactElement } from "react";
import type { BoxProps } from "./kit";
import { SvgBox01, SvgBox02, SvgBox03, SvgBoxN } from "./svgboxes";

export type BoxDef = { id: string; nome: string; aspect: number; render: (p: BoxProps) => ReactElement };

// proporção (largura/altura) de cada box, como nas referências
export const BOXES: BoxDef[] = [
  { id: "cx01", nome: "Vermelho clássico", aspect: 0.9, render: SvgBox01 },
  { id: "cx02", nome: "Verde e amarelo", aspect: 0.9, render: SvgBox02 },
  { id: "cx03", nome: "Vermelho faixa 3D", aspect: 0.9, render: SvgBox03 },
  { id: "cx04", nome: "Preto e dourado", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx04" }) },
  { id: "cx05", nome: "Azul circular", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx05" }) },
  { id: "cx06", nome: "Laranja cupom", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx06" }) },
  { id: "cx07", nome: "Arco vinho", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx07" }) },
  { id: "cx08", nome: "Dobra turquesa", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx08" }) },
  { id: "cx09", nome: "Roxo e lima", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx09" }) },
  { id: "cx10", nome: "Madeira e lousa", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx10" }) },
  { id: "cx11", nome: "Coral e marinho", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx11" }) },
  { id: "cx12", nome: "Prata e azul", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx12" }) },
  { id: "cx13", nome: "Marfim e amarelo", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx13" }) },
  { id: "cx14", nome: "Verde sálvia", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx14" }) },
  { id: "cx15", nome: "Azul gelo", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx15" }) },
  { id: "cx16", nome: "Vinho e rosé", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx16" }) },
  { id: "cx17", nome: "Grafite e champanhe", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx17" }) },
  { id: "cx18", nome: "Cobalto e coral", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx18" }) },
  { id: "cx19", nome: "Arco terracota", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx19" }) },
  { id: "cx20", nome: "Verde em camadas", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx20" }) },
  { id: "cx21", nome: "Amarelo com fita", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx21" }) },
  { id: "cx22", nome: "Janela pastel", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx22" }) },
  { id: "cx23", nome: "Verde-água", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx23" }) },
  { id: "cx24", nome: "Pêssego", aspect: 0.9, render: (p) => SvgBoxN({ ...p, id: "cx24" }) },
];
