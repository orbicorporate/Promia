import type { Feriado, Quando, TipoOferta } from "./tipos";

// Emblemas que ainda faltam criar para cobrir o que supermercado faz de
// tabloide. A prioridade segue a frequência de uso e o dinheiro que a
// data ou a promoção movimenta: 1 aparece toda semana ou mês, 2 algumas
// vezes por ano, 3 é nicho ou complemento. "ideia" já serve de briefing
// para gerar a arte no mesmo estilo dos 59 prontos (letras 3D, brilho,
// elementos do tema atrás do texto).

export type Planejado = {
  nome: string;
  tipo: TipoOferta;
  prioridade: 1 | 2 | 3;
  ideia: string;
  feriados?: Feriado[];
  quando?: Quando;
  motivo?: string;
};

const sem = (...dias: number[]): Quando => ({ kind: "semana", dias });

export const PLANEJADOS: Planejado[] = [
  // Dias da semana e ofertões

  // Condições comerciais

  // Datas comemorativas

  // Setores e departamentos

  // Loja e calendário do cliente

  // Sugestões de mercado (lote 3): o que supermercado de bairro e rede média costuma usar e ainda não estava na lista
];

// Peças que não são logo de campanha e saem em código (selos de preço,
// etiquetas e faixas), para não gastar geração de imagem com o que o motor
// de encarte desenha nítido em qualquer tamanho.
export const EM_CODIGO = [
  "Selo de percentual (-10%, -20%, -30%, -50% OFF)",
  "Selo NOVO, OFERTA, SUPER PREÇO, IMPERDÍVEL",
  "Etiqueta de preço em quatro formas (placa, etiqueta, arco, escudo)",
  "Faixa de validade e faixa de limite por cliente",
  "Selo de preço de clube e preço para quem tem cartão",
  "Monograma do mercado quando o cliente não tem logo",
];

// Variações técnicas dos emblemas prontos que valem pedir de uma vez
// Os 12 de prioridade alta já vieram com as três versões. Faltam nos outros 47.
export const VARIACOES = [
  { nome: "Versão só texto (sem ilustração)", para: "Cabeçalhos pequenos, story com pouca altura e quadrado" },
  { nome: "Versão em uma cor (preto ou cor do mercado)", para: "Cartaz de gôndola A4 impresso em preto e branco" },
  { nome: "Versão horizontal compacta", para: "Barra de topo do encarte e capa de WhatsApp" },
];
