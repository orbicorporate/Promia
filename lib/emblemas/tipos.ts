// Vocabulário do repositório de emblemas: tipos de oferta, regras de data
// e feriados. Puro (sem React, sem servidor) para servir a galeria, os
// testes e, mais adiante, a escolha automática do emblema do encarte.

export const TIPOS = ["dia-da-semana", "ofertao", "periodo", "setor", "data", "campanha", "condicao", "loja", "calendario"] as const;
export type TipoOferta = (typeof TIPOS)[number];

export const TIPO_LABEL: Record<TipoOferta, string> = {
  "dia-da-semana": "Dia da semana",
  ofertao: "Ofertão",
  periodo: "Semana e urgência",
  setor: "Setor da loja",
  data: "Data comemorativa",
  campanha: "Campanha e evento",
  condicao: "Condição comercial",
  loja: "Institucional da loja",
  calendario: "Dia de pagamento e cliente",
};

export const TIPO_HINT: Record<TipoOferta, string> = {
  "dia-da-semana": "Promoção fixa de um dia (quarta do hortifrúti, terça da carne)",
  ofertao: "A oferta forte do dia ou do mês",
  periodo: "Ofertas da semana, do dia, fim de semana, só hoje",
  setor: "Açougue, padaria, limpeza e os outros departamentos",
  data: "Mães, Pais, Crianças, Natal, Páscoa e outras datas",
  campanha: "Black Friday, Carnaval, Copa, volta às aulas",
  condicao: "Liquidação, atacarejo, clube, lançamento",
  loja: "Aniversário, inauguração, preço baixo, cesta básica",
  calendario: "Dia 5, dia 20, salário, cartão, feriadão",
};

// Regras de data. O dia da semana segue o JavaScript: 0 domingo a 6 sábado.
export type Quando =
  | { kind: "sempre" }
  | { kind: "semana"; dias: number[] }
  | { kind: "diaDoMes"; dias: number[]; antes?: number } // vale até `antes` dias antes do dia
  | { kind: "mes"; mes: number }
  | { kind: "feriado"; titulo: string; antes: number; depois?: number } // título em lib/seasonalDates
  | { kind: "periodo"; de: string; ate: string }; // MM-DD a MM-DD (todo ano) ou ISO completo

export const FERIADOS = [
  "Carnaval",
  "Páscoa",
  "Dia das Mães",
  "Dia dos Namorados",
  "Festa Junina",
  "Dia dos Pais",
  "Dia do Cliente",
  "Dia das Crianças",
  "Black Friday",
  "Natal",
  "Réveillon",
  "Copa do Mundo",
  "Volta às aulas",
  "Feriado prolongado",
] as const;
export type Feriado = (typeof FERIADOS)[number];

export const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
