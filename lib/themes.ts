import { seasonalDatesInRange, type SeasonalDate } from "./seasonalDates";
import { weeklyPromotionsForDate, type WeeklyPromotion } from "./weeklyPromotions";

// Um tema é o "molde" visual de um tabloide: um template HTML com tokens
// (%%LOGO%%, %%COR_PRIMARIA%%, %%NOME_MERCADO%%, e um bloco repetido por
// produto) que o motor de renderização preenche. Alguns temas são globais
// da plataforma (sazonais, ex. "Páscoa"), outros específicos de um mercado
// (criados por pesquisa livre, ex. "Aniversário da loja").
export type ThemeKind = "sazonal" | "dia_da_semana" | "livre";

export type Theme = {
  id: string;
  marketId: string | null; // null = template global da plataforma
  name: string;
  kind: ThemeKind;
  templatePath: string; // caminho do arquivo de template HTML (com tokens)
  sourceSeasonalTitle?: string; // quando kind = "sazonal", casa com SeasonalDate.title
  sourceWeekday?: number; // quando kind = "dia_da_semana"
};

// Uma sugestão de tema pronta pra aparecer no fluxo de montagem: "hoje/essa
// semana faz sentido usar esse tema, por causa disso".
export type ThemeSuggestion = {
  date: string; // YYYY-MM-DD a que a sugestão se refere
  label: string; // nome da data/promoção que originou a sugestão
  reason: string; // frase curta explicando o porquê pro dono do mercado
  matchingThemeIds: string[]; // temas cadastrados que já servem pra essa sugestão
};

// Junta datas sazonais (universais, ou que batem com o nicho/categoria do
// mercado) com as promoções recorrentes por dia da semana já cadastradas, e
// devolve uma lista única de sugestões de tema ordenada por data, pro dono
// do mercado escolher de forma guiada em vez de vasculhar um catálogo
// gigante de temas toda vez que for montar um tabloide.
export function suggestThemesInRange({
  startISO,
  endISO,
  marketNiche,
  weeklyPromotions,
  availableThemes,
}: {
  startISO: string;
  endISO: string;
  marketNiche?: string | null;
  weeklyPromotions: WeeklyPromotion[];
  availableThemes: Theme[];
}): ThemeSuggestion[] {
  const seasonal = seasonalDatesInRange(startISO, endISO).filter(
    (d) => d.universal || matchesNiche(marketNiche, d)
  );

  const seasonalSuggestions: ThemeSuggestion[] = seasonal.map((d) => ({
    date: d.date,
    label: d.title,
    reason: d.universal
      ? `${d.title} é uma data forte pra praticamente qualquer mercado.`
      : `${d.title} costuma performar bem no seu ramo.`,
    matchingThemeIds: availableThemes
      .filter((t) => t.kind === "sazonal" && t.sourceSeasonalTitle === d.title)
      .map((t) => t.id),
  }));

  const weekdaySuggestions: ThemeSuggestion[] = [];
  for (let cursor = startISO; cursor <= endISO; cursor = addOneDay(cursor)) {
    const dayPromos = weeklyPromotionsForDate(weeklyPromotions, cursor);
    for (const promo of dayPromos) {
      weekdaySuggestions.push({
        date: cursor,
        label: promo.name,
        reason: `Recorrente: toda semana nesse dia você roda "${promo.name}".`,
        matchingThemeIds: availableThemes
          .filter((t) => t.kind === "dia_da_semana" && t.sourceWeekday === promo.weekday)
          .map((t) => t.id),
      });
    }
  }

  return [...seasonalSuggestions, ...weekdaySuggestions].sort((a, b) => a.date.localeCompare(b.date));
}

function matchesNiche(niche: string | null | undefined, date: SeasonalDate): boolean {
  if (!niche) return false;
  const n = niche.toLowerCase();
  return date.tags.some((tag) => n.includes(tag));
}

function addOneDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// tokens que todo template de tabloide precisa suportar. Um produto
// individual dentro do template repete o bloco %%PRODUTOS%% (ver
// lib/renderTabloid.ts) substituindo esses tokens por item.
export const THEME_MARKET_TOKENS = [
  "%%NOME_MERCADO%%",
  "%%LOGO_URL%%",
  "%%COR_PRIMARIA%%",
  "%%COR_SECUNDARIA%%",
  "%%NOME_TABLOIDE%%",
  "%%VIGENCIA%%",
] as const;

export const THEME_PRODUCT_TOKENS = [
  "%%PRODUTO_NOME%%",
  "%%PRODUTO_PRECO%%",
  "%%PRODUTO_IMAGEM_URL%%",
  "%%PRODUTO_CATEGORIA%%",
] as const;
