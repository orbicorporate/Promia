// Promoções recorrentes por dia da semana (ex.: toda terça é dia da carne,
// toda sexta é dia do hortifruti). Diferente das datas sazonais
// (lib/seasonalDates.ts), que são pontuais no calendário, isso aqui é um
// padrão semanal configurável por mercado: cada mercado cadastra as suas
// (tabela weekly_promotions no banco), e este arquivo só resolve, dada uma
// data qualquer, quais promoções recorrentes caem nela.

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export type WeeklyPromotion = {
  id: string;
  marketId: string;
  weekday: number; // 0 = domingo ... 6 = sábado, igual Date#getDay()
  name: string; // ex. "Dia da Carne"
  categoryHint: string | null; // categoria/departamento sugerido pra puxar produtos (ex. "açougue")
  active: boolean;
};

// dado um conjunto de promoções recorrentes já cadastradas pro mercado e uma
// data (YYYY-MM-DD), devolve as que caem nesse dia da semana.
export function weeklyPromotionsForDate(
  promotions: WeeklyPromotion[],
  isoDate: string
): WeeklyPromotion[] {
  const weekday = new Date(`${isoDate}T00:00:00Z`).getUTCDay();
  return promotions.filter((p) => p.active && p.weekday === weekday);
}

// sugestões padrão pra pré-popular o cadastro de um mercado novo, no molde
// mais comum do setor. O dono edita/remove livremente depois, isso é só
// ponto de partida pra não começar de tela em branco.
export const DEFAULT_WEEKLY_PROMOTION_SUGGESTIONS: { weekday: number; name: string; categoryHint: string }[] = [
  { weekday: 2, name: "Dia da Carne", categoryHint: "açougue" },
  { weekday: 3, name: "Dia da Limpeza", categoryHint: "limpeza" },
  { weekday: 5, name: "Dia do Hortifruti", categoryHint: "hortifruti" },
  { weekday: 6, name: "Feirão de Fim de Semana", categoryHint: "hortifruti" },
];
