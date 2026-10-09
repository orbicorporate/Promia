import { contrastRatio, mix, normalizeHex, pickTextColor } from "../color";
import { getTheme, type EncarteTheme } from "../themes";
import type { EncarteMarket } from "../types";

// Cores de um modelo de encarte. Saem do tema (a categoria do tabloide dá o
// clima: verde de hortifrúti, vinho de açougue, marrom de padaria) e da cor
// do mercado, que entra nos elementos de marca (faixa de rodapé e logo).
// Os papéis são fixos para os modelos poderem trocar de cor sem mudar de
// desenho: principal, sol (etiqueta de preço), quente (urgência), creme
// (papel), tinta (texto escuro com o matiz da cor principal).

export type Tokens = {
  main: string;
  mainDark: string;
  mainDeep: string;
  mainLight: string;
  sun: string; // etiqueta de preço e destaque
  sunInk: string; // texto sobre o sol
  sunDeep: string; // sombra do sol
  hot: string; // urgência, selo de desconto
  hotInk: string;
  cream: string; // papel claro
  paper: string; // papel um pouco mais escuro (cartão sobre o kraft)
  ink: string; // texto escuro
  white: string;
  onMain: string; // texto sobre a cor principal
  market: string; // cor do mercado
  onMarket: string;
};

const FALLBACK_HOT = "#E5412B";

export function tokensFor(themeKey: string | null | undefined, market: Pick<EncarteMarket, "colorPrimary" | "colorSecondary">): Tokens {
  const theme: EncarteTheme = getTheme(themeKey);
  const p = theme.palette;
  const main = p.headerBg;
  const sun = p.tagBg;
  const hotRaw = p.accent;
  const hot = contrastRatio(hotRaw, sun) >= 1.6 && contrastRatio(hotRaw, "#FFFFFF") >= 3 ? hotRaw : FALLBACK_HOT;
  const marketColor = normalizeHex(market.colorPrimary) ?? main;
  return {
    main,
    mainDark: mix(main, "#000000", 0.35),
    mainDeep: mix(main, "#000000", 0.62),
    mainLight: mix(main, "#FFFFFF", 0.88),
    sun,
    sunInk: p.tagText,
    sunDeep: mix(sun, "#7a4a00", 0.45),
    hot,
    hotInk: pickTextColor(hot),
    cream: mix("#FFF8E6", main, 0.05),
    paper: mix("#F4E6C8", main, 0.04),
    ink: mix(main, "#000000", 0.8),
    white: "#FFFFFF",
    onMain: pickTextColor(main),
    market: marketColor,
    onMarket: pickTextColor(marketColor),
  };
}
