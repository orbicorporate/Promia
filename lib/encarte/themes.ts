import { contrastRatio, normalizeHex, pickTextColor } from "./color";
import type { EncarteMarket } from "./types";

// Catálogo de temas do encarte, como dados. Um tema é só paleta + padrão
// decorativo + textos padrão + palavras-chave; o desenho é sempre o mesmo
// motor (lib/encarte/render.tsx). Assim cada tema funciona com todos os
// layouts e formatos (15 temas x 3 layouts = 45 combinações por formato)
// sem nenhum template novo, e criar um tema é acrescentar um objeto aqui.
//
// Regra de marca: o tema dá o clima (faixa do título, fundo, etiquetas),
// mas a barra da marca no topo e o rodapé usam a cor primária do mercado
// quando ela existe (ver resolveThemeColors), com texto branco ou escuro
// escolhido pelo contraste.

export type PatternKind =
  | "raios"
  | "listras"
  | "bolinhas"
  | "bolhas"
  | "confete"
  | "folhas"
  | "xadrez"
  | "coracoes"
  | "estrelas"
  | "ovos"
  | "bandeirinhas";

export type ThemePalette = {
  bg: string; // fundo da área de produtos
  bg2: string; // fundo secundário (placeholder de foto, linhas alternadas)
  bgText: string; // texto escrito direto sobre o fundo (paginação, aviso)
  headerBg: string; // faixa do título (headline)
  headerText: string;
  brandBg: string; // barra da marca e rodapé quando o mercado não tem cor
  brandText: string;
  card: string; // cartão do produto
  cardText: string;
  cardMuted: string; // marca, "de R$", limite
  tagBg: string; // etiqueta de preço
  tagText: string;
  oldPrice: string; // cor do preço "de" riscado
  accent: string; // selo de desconto, faixa de validade, label do produto
  accentText: string;
  pattern: string; // cor do desenho decorativo (usada com transparência)
};

export type EncarteTheme = {
  key: string;
  name: string;
  headline: string; // título padrão quando o encarte não tem um próprio
  subheadline?: string;
  palette: ThemePalette;
  pattern: PatternKind;
  seasonalKeywords: string[]; // casam com títulos de lib/seasonalDates.ts
  categoryKeywords: string[]; // casam com categoria de produto / promoção do dia
};

export const DEFAULT_THEME_KEY = "ofertas";

export const THEMES: EncarteTheme[] = [
  {
    key: "ofertas",
    name: "Ofertas da semana",
    headline: "Ofertas da semana",
    subheadline: "Preço baixo de verdade, toda semana",
    pattern: "raios",
    palette: {
      bg: "#FFF1C2",
      bg2: "#FFE38A",
      bgText: "#5C3B00",
      headerBg: "#D90718",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#17130F",
      card: "#FFFFFF",
      cardText: "#17130F",
      cardMuted: "#6B6258",
      tagBg: "#FFD400",
      tagText: "#A1000F",
      oldPrice: "#6B6258",
      accent: "#17130F",
      accentText: "#FFD400",
      pattern: "#FFFFFF",
    },
    seasonalKeywords: ["consumidor", "cliente", "trabalho", "independencia", "tiradentes", "confraternizacao"],
    categoryKeywords: ["oferta", "promocao", "mercearia", "geral"],
  },
  {
    key: "fim-de-semana",
    name: "Fim de semana",
    headline: "Ofertas do fim de semana",
    subheadline: "Sexta, sábado e domingo",
    pattern: "listras",
    palette: {
      bg: "#E6EEFF",
      bg2: "#CCDBFF",
      bgText: "#0B2E6B",
      headerBg: "#0B4FB3",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#0B2E6B",
      card: "#FFFFFF",
      cardText: "#101A33",
      cardMuted: "#5A6478",
      tagBg: "#FFD23F",
      tagText: "#0B2E6B",
      oldPrice: "#5A6478",
      accent: "#FF6A00",
      accentText: "#17130F",
      pattern: "#FFFFFF",
    },
    seasonalKeywords: ["reveillon", "carnaval"],
    categoryKeywords: ["fim de semana", "final de semana", "feirao", "sabado", "domingo", "sextou"],
  },
  {
    key: "hortifruti",
    name: "Hortifrúti",
    headline: "Quarta do hortifrúti",
    subheadline: "Frutas, verduras e legumes fresquinhos",
    pattern: "folhas",
    palette: {
      bg: "#EEF7E4",
      bg2: "#D8EDC4",
      bgText: "#1E4D24",
      headerBg: "#1E7B34",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#1E4D24",
      card: "#FFFFFF",
      cardText: "#14301A",
      cardMuted: "#5E6E5A",
      tagBg: "#FFE14D",
      tagText: "#145A24",
      oldPrice: "#5E6E5A",
      accent: "#C63D0F",
      accentText: "#FFFFFF",
      pattern: "#B6F06A",
    },
    seasonalKeywords: ["arvore", "primavera"],
    categoryKeywords: ["hortifruti", "hortifrutti", "hortifrutigranjeiro", "fruta", "verdura", "legume", "hortalica", "feira", "sacolao", "flv"],
  },
  {
    key: "acougue",
    name: "Açougue e churrasco",
    headline: "Dia da carne",
    subheadline: "Cortes selecionados para o seu churrasco",
    pattern: "xadrez",
    palette: {
      bg: "#2B1714",
      bg2: "#F3E4DC",
      bgText: "#FFD9C7",
      headerBg: "#9E1116",
      headerText: "#FFFFFF",
      brandBg: "#17100E",
      brandText: "#FFFFFF",
      card: "#FFFFFF",
      cardText: "#1F1210",
      cardMuted: "#6E5A55",
      tagBg: "#FFC21A",
      tagText: "#5A0A0A",
      oldPrice: "#6E5A55",
      accent: "#FFC21A",
      accentText: "#2B1714",
      pattern: "#FFFFFF",
    },
    seasonalKeywords: [],
    categoryKeywords: ["acougue", "carne", "bovino", "bovina", "frango", "suino", "churrasco", "linguica", "frios", "peixaria", "peixe"],
  },
  {
    key: "padaria",
    name: "Padaria",
    headline: "Fornada de ofertas",
    subheadline: "Pão quentinho toda hora",
    pattern: "bolinhas",
    palette: {
      bg: "#FBF0DE",
      bg2: "#F1DCB8",
      bgText: "#5A3412",
      headerBg: "#7A4A21",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#4A2B0E",
      card: "#FFFFFF",
      cardText: "#2E1B0B",
      cardMuted: "#7A6A5A",
      tagBg: "#F5B731",
      tagText: "#3E2109",
      oldPrice: "#7A6A5A",
      accent: "#C8402B",
      accentText: "#FFFFFF",
      pattern: "#FFE6BF",
    },
    seasonalKeywords: [],
    categoryKeywords: ["padaria", "pao", "paes", "confeitaria", "bolo", "panificacao", "rotisseria", "lanche"],
  },
  {
    key: "bebidas",
    name: "Bebidas",
    headline: "Geladas em oferta",
    subheadline: "Cerveja, refri e suco para a semana",
    pattern: "bolhas",
    palette: {
      bg: "#E3F3FF",
      bg2: "#C6E6FF",
      bgText: "#062A5C",
      headerBg: "#062A5C",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#062A5C",
      card: "#FFFFFF",
      cardText: "#0A1A33",
      cardMuted: "#56657A",
      tagBg: "#FFCC00",
      tagText: "#062A5C",
      oldPrice: "#56657A",
      accent: "#E3262E",
      accentText: "#FFFFFF",
      pattern: "#5CC8FF",
    },
    seasonalKeywords: ["carnaval"],
    categoryKeywords: ["bebida", "cerveja", "refrigerante", "refri", "vinho", "destilado", "suco", "agua", "adega", "drink"],
  },
  {
    key: "limpeza",
    name: "Limpeza",
    headline: "Casa limpa, preço baixo",
    subheadline: "Limpeza e higiene em oferta",
    pattern: "bolhas",
    palette: {
      bg: "#E8F6FF",
      bg2: "#CDEBFA",
      bgText: "#00457A",
      headerBg: "#0065AD",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#00457A",
      card: "#FFFFFF",
      cardText: "#0A2135",
      cardMuted: "#55687A",
      tagBg: "#FFE14D",
      tagText: "#00457A",
      oldPrice: "#55687A",
      accent: "#0B7285",
      accentText: "#FFFFFF",
      pattern: "#9BE3FF",
    },
    seasonalKeywords: [],
    categoryKeywords: ["limpeza", "higiene", "lavanderia", "perfumaria", "descartavel", "casa"],
  },
  {
    key: "dia-das-criancas",
    name: "Dia das Crianças",
    headline: "Festival da criançada",
    subheadline: "Doces, brinquedos e lanchinhos",
    pattern: "confete",
    palette: {
      bg: "#FFF6D6",
      bg2: "#FFE7A3",
      bgText: "#4A1A99",
      headerBg: "#6A2BD9",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#4A1A99",
      card: "#FFFFFF",
      cardText: "#1F1240",
      cardMuted: "#6A6080",
      tagBg: "#FFD000",
      tagText: "#4A12A8",
      oldPrice: "#6A6080",
      accent: "#FF3D7F",
      accentText: "#17130F",
      pattern: "#FFD000",
    },
    seasonalKeywords: ["criancas", "crianca", "halloween"],
    categoryKeywords: ["infantil", "brinquedo", "doce", "bomboniere", "chocolate", "biscoito"],
  },
  {
    key: "dia-das-maes",
    name: "Dia das Mães",
    headline: "Especial Dia das Mães",
    subheadline: "Carinho que cabe no carrinho",
    pattern: "coracoes",
    palette: {
      bg: "#FFEEF4",
      bg2: "#FFD6E5",
      bgText: "#8A1043",
      headerBg: "#C2185B",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#8A1043",
      card: "#FFFFFF",
      cardText: "#2E0F1C",
      cardMuted: "#7A5F6A",
      tagBg: "#8A1043",
      tagText: "#FFFFFF",
      oldPrice: "#7A5F6A",
      accent: "#FFB300",
      accentText: "#2E0F1C",
      pattern: "#FF8FB8",
    },
    seasonalKeywords: ["maes", "mae", "mulher", "namorados"],
    categoryKeywords: ["flores", "presente", "beleza", "perfumaria feminina"],
  },
  {
    key: "dia-dos-pais",
    name: "Dia dos Pais",
    headline: "Especial Dia dos Pais",
    subheadline: "Churrasco, cerveja e presente para ele",
    pattern: "listras",
    palette: {
      bg: "#EDF1F6",
      bg2: "#D5DEEA",
      bgText: "#12355B",
      headerBg: "#12355B",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#12355B",
      card: "#FFFFFF",
      cardText: "#0E1C2E",
      cardMuted: "#5A6676",
      tagBg: "#F2B705",
      tagText: "#12355B",
      oldPrice: "#5A6676",
      accent: "#B83A0A",
      accentText: "#FFFFFF",
      pattern: "#3F6EA5",
    },
    seasonalKeywords: ["pais", "pai"],
    categoryKeywords: [],
  },
  {
    key: "pascoa",
    name: "Páscoa",
    headline: "Páscoa de ofertas",
    subheadline: "Ovos, chocolates e o almoço de domingo",
    pattern: "ovos",
    palette: {
      bg: "#FFF4E6",
      bg2: "#FBE1C6",
      bgText: "#4A2312",
      headerBg: "#5B2C1A",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#4A2312",
      card: "#FFFFFF",
      cardText: "#2A140A",
      cardMuted: "#7A6458",
      tagBg: "#F4C430",
      tagText: "#4A2312",
      oldPrice: "#7A6458",
      accent: "#E86FA0",
      accentText: "#2A140A",
      pattern: "#F9B8D0",
    },
    seasonalKeywords: ["pascoa", "sexta-feira santa", "santa"],
    categoryKeywords: ["ovo de pascoa", "chocolate", "bacalhau"],
  },
  {
    key: "festa-junina",
    name: "Festa Junina",
    headline: "Arraiá de ofertas",
    subheadline: "Pipoca, canjica, quentão e muito mais",
    pattern: "bandeirinhas",
    palette: {
      bg: "#FFF2D4",
      bg2: "#FCDFA0",
      bgText: "#6B1D00",
      headerBg: "#B83A0A",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#6B1D00",
      card: "#FFFFFF",
      cardText: "#2E1206",
      cardMuted: "#7A6250",
      tagBg: "#FFD000",
      tagText: "#7A1F00",
      oldPrice: "#7A6250",
      accent: "#1F6FB2",
      accentText: "#FFFFFF",
      pattern: "#FFD000",
    },
    seasonalKeywords: ["junina", "sao joao", "julina"],
    categoryKeywords: ["milho", "amendoim", "pipoca", "canjica", "pacoca"],
  },
  {
    key: "black-friday",
    name: "Black Friday",
    headline: "Black Friday",
    subheadline: "Os menores preços do ano",
    pattern: "raios",
    palette: {
      bg: "#141414",
      bg2: "#EDEDED",
      bgText: "#FFE100",
      headerBg: "#000000",
      headerText: "#FFE100",
      brandBg: "#000000",
      brandText: "#FFFFFF",
      card: "#FFFFFF",
      cardText: "#111111",
      cardMuted: "#5E5E5E",
      tagBg: "#FFE100",
      tagText: "#000000",
      oldPrice: "#5E5E5E",
      accent: "#FF2D2D",
      accentText: "#000000",
      pattern: "#FFE100",
    },
    seasonalKeywords: ["black friday", "cyber monday", "black"],
    categoryKeywords: [],
  },
  {
    key: "natal",
    name: "Natal",
    headline: "Natal de ofertas",
    subheadline: "Tudo para a sua ceia",
    pattern: "estrelas",
    palette: {
      bg: "#0F4D2E",
      bg2: "#E9F2EC",
      bgText: "#FFE9A8",
      headerBg: "#B3121D",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#8A0E16",
      card: "#FFFFFF",
      cardText: "#1A1A1A",
      cardMuted: "#5E665F",
      tagBg: "#FFD54A",
      tagText: "#8A0E16",
      oldPrice: "#5E665F",
      accent: "#FFD54A",
      accentText: "#5C0A0F",
      pattern: "#FFFFFF",
    },
    seasonalKeywords: ["natal", "reveillon", "ano novo", "ceia"],
    categoryKeywords: ["panetone", "chester", "peru", "tender", "castanha", "espumante"],
  },
  {
    key: "aniversario",
    name: "Aniversário da loja",
    headline: "Aniversário com preços de festa",
    subheadline: "Quem ganha o presente é você",
    pattern: "confete",
    palette: {
      bg: "#FFF7E0",
      bg2: "#FFE9A8",
      bgText: "#3A1580",
      headerBg: "#4B1FA8",
      headerText: "#FFFFFF",
      brandBg: "#FFFFFF",
      brandText: "#3A1580",
      card: "#FFFFFF",
      cardText: "#1C1033",
      cardMuted: "#675E7A",
      tagBg: "#FFC83D",
      tagText: "#3A1580",
      oldPrice: "#675E7A",
      accent: "#FF4F79",
      accentText: "#17130F",
      pattern: "#FFC83D",
    },
    seasonalKeywords: ["aniversario"],
    categoryKeywords: ["aniversario", "festa"],
  },
];

const BY_KEY = new Map(THEMES.map((t) => [t.key, t]));

export const THEME_KEYS = THEMES.map((t) => t.key);

export function isThemeKey(value: unknown): value is string {
  return typeof value === "string" && BY_KEY.has(value);
}

// tema pela chave; chave desconhecida cai no padrão (o banco guarda
// theme_key como texto livre)
export function getTheme(key: string | null | undefined): EncarteTheme {
  return (key && BY_KEY.get(key)) || BY_KEY.get(DEFAULT_THEME_KEY)!;
}

// minúsculas, sem acento, só letras/números/espaço/hífen
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAny(text: string, keywords: string[]): boolean {
  if (!text) return false;
  const padded = ` ${text} `;
  // palavra inteira ou prefixo de palavra ("carne" casa "carnes")
  return keywords.some((kw) => kw && padded.includes(` ${normalizeText(kw)}`));
}

// "Dia das Crianças" -> "dia-das-criancas"; "Black Friday" -> "black-friday".
// Datas sem tema próprio (ex. Tiradentes) caem em "ofertas" quando listadas
// nas palavras do tema padrão; senão, null.
export function themeForSeasonalTitle(title: string): EncarteTheme | null {
  const text = normalizeText(title);
  // temas específicos primeiro, o padrão por último
  const ordered = [...THEMES.filter((t) => t.key !== DEFAULT_THEME_KEY), getTheme(DEFAULT_THEME_KEY)];
  return ordered.find((t) => matchesAny(text, t.seasonalKeywords)) ?? null;
}

// tema que combina com uma categoria de produto ou nome de promoção do dia
// (ex. "Açougue", "Dia da Carne", "Quarta do Hortifrúti")
export function themeForCategory(category: string): EncarteTheme | null {
  const text = normalizeText(category);
  const ordered = [...THEMES.filter((t) => t.key !== DEFAULT_THEME_KEY), getTheme(DEFAULT_THEME_KEY)];
  return ordered.find((t) => matchesAny(text, t.categoryKeywords)) ?? null;
}

// Sugestão de temas para a tela de montagem, em ordem de relevância:
// datas sazonais da vigência primeiro, depois as categorias que mais
// aparecem nos produtos escolhidos (e promoções do dia, se vierem), e o
// tema padrão sempre no fim como saída garantida.
export function suggestThemeKeys({
  seasonalTitles = [],
  categories = [],
}: {
  seasonalTitles?: string[];
  categories?: (string | null | undefined)[];
}): string[] {
  const out: string[] = [];
  const push = (key: string | undefined) => {
    if (key && !out.includes(key)) out.push(key);
  };

  for (const title of seasonalTitles) push(themeForSeasonalTitle(title)?.key);

  const counts = new Map<string, number>();
  for (const category of categories) {
    if (!category) continue;
    const key = themeForCategory(category)?.key;
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([key]) => push(key));

  push(DEFAULT_THEME_KEY);
  return out;
}

export type ResolvedColors = ThemePalette & {
  brandBg: string;
  brandText: string;
  brandAccent: string; // detalhe sobre a barra da marca (linha, monograma)
};

// Aplica a regra de marca: a cor primária do mercado (quando válida) vai
// para a barra do topo e o rodapé, com texto de contraste calculado. O
// resto da paleta é do tema.
export function resolveThemeColors(theme: EncarteTheme, market: Pick<EncarteMarket, "colorPrimary" | "colorSecondary">): ResolvedColors {
  const p = theme.palette;
  const primary = normalizeHex(market.colorPrimary);
  const brandBg = primary ?? p.brandBg;
  const brandText = primary ? pickTextColor(primary) : p.brandText;
  const secondary = normalizeHex(market.colorSecondary);
  // a cor secundária só entra como detalhe se aparecer bem sobre a barra
  const brandAccent = secondary && contrastRatio(secondary, brandBg) >= 3 ? secondary : p.headerBg !== brandBg && contrastRatio(p.headerBg, brandBg) >= 3 ? p.headerBg : brandText;
  return { ...p, brandBg, brandText, brandAccent };
}
