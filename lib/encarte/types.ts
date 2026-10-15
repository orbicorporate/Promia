import { CENARIO_IDS } from "./modelos/cenarios";
import { ARTE_IDS } from "./modelos/fundos-arte";
import type { ValidadeOpcoes } from "./validade";
// Tipos do motor de encarte (tabloide promocional de supermercado).
//
// O encarte é desenhado no servidor (lib/encarte/render.tsx + next/og) a
// partir destes dados já resolvidos: preço de oferta calculado, imagens
// trocadas por data URI e mercado lido do banco. Nada aqui depende do
// Supabase, então a mesma estrutura serve para o encarte salvo
// (lib/encarte/load.ts) e para a prévia ao vivo (app/api/encartes/previa).

export const ENCARTE_FORMATS = ["feed", "story", "quadrado", "a4"] as const;
export type EncarteFormat = (typeof ENCARTE_FORMATS)[number];

export const ENCARTE_LAYOUTS = ["grade", "destaque", "lista"] as const;
export type EncarteLayout = (typeof ENCARTE_LAYOUTS)[number];

// Modelo de arte (família visual). Nulo = Clássico (usa o layout).
export const ENCARTE_MODELOS = ["feira", "vitrine", "painel", "pomar", "vidro", "barra", "mercado", "selo", "cerca", "linhas", "cx01", "cx02", "cx03", "cx04", "cx05", "cx06", "cx07", "cx08", "cx09", "cx10", "cx11", "cx12", "cx13", "cx14", "cx15", "cx16", "cx17", "cx18", "cx19", "cx20", "cx21", "cx22", "cx23", "cx24"] as const;
export type EncarteModelo = (typeof ENCARTE_MODELOS)[number];

// Fundo da arte (só nos modelos brilhantes; nulo = o fundo padrão do modelo).
export const ENCARTE_FUNDOS = ["raios", "bokeh", "diagonal", "aros", "kraft", "madeira", "estudio", "vinheta", "xadrez", "feira", ...CENARIO_IDS, ...ARTE_IDS] as const;
export type EncarteFundo = (typeof ENCARTE_FUNDOS)[number];

export function isEncarteFundo(value: unknown): value is EncarteFundo {
  return typeof value === "string" && (ENCARTE_FUNDOS as readonly string[]).includes(value);
}

export function isEncarteModelo(value: unknown): value is EncarteModelo {
  return typeof value === "string" && (ENCARTE_MODELOS as readonly string[]).includes(value);
}

export type EncarteEmblemaArquivo = { src: string; w: number; h: number };
export type EncarteEmblemaImg = {
  slug: string;
  nome: string;
  ilustrado: EncarteEmblemaArquivo;
  horizontal: EncarteEmblemaArquivo | null;
  cores: { hue: number; sat: number; hue2: number; neutro: boolean; quente: boolean; dourado: number };
};

export type EncarteFundoArte = { id: string; topo: EncarteEmblemaArquivo; base: EncarteEmblemaArquivo; faixa: string };

export type EncarteItem = {
  name: string;
  brand?: string | null;
  unit?: string | null; // unidade normalizada (lib/products.ts): kg, g, l, ml, un, cx, pct, dz, bdj, fd
  imageUrl?: string | null; // https (antes de lib/encarte/images.ts) ou data URI (depois)
  price: number; // preço de oferta já resolvido: promo_price ?? product.price
  oldPrice?: number | null; // preço "de", só quando for maior que price
  highlight: boolean;
  limitQty?: number | null;
  label?: string | null; // ex. "Leve 3 pague 2"
};

export type EncarteMarket = {
  name: string;
  logoUrl?: string | null;
  colorPrimary?: string | null;
  colorSecondary?: string | null;
  tagline?: string | null;
  address?: string | null;
  city?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  instagram?: string | null;
  openingHours?: string | null;
  legalNote?: string | null;
};

export type EncarteData = {
  id: string;
  name: string;
  headline?: string | null;
  subheadline?: string | null;
  format: EncarteFormat;
  layout: EncarteLayout;
  modelo?: EncarteModelo | null;
  fundo?: EncarteFundo | null;
  emblema?: string | null; // slug do emblema da campanha (lib/emblemas/catalog.ts)
  validade?: Partial<ValidadeOpcoes>; // posição, alinhamento, estilo e cor da validade (lib/encarte/validade.ts)
  emblemaEscala?: number; // 0,6 a 1,6: aumenta ou diminui o logo mantendo a proporção (lib/encarte/emblema-escala.ts)
  emblemaImg?: EncarteEmblemaImg | null; // resolvido no servidor (lib/encarte/images.ts)
  fundoArte?: EncarteFundoArte | null; // cabeçalho e rodapé do fundo de arte, resolvidos no servidor
  escalaPrevia?: number; // só no servidor: desenha a página em escala menor (0,3 a 1) para a prévia ser rápida
  esqueleto?: boolean; // prévia só com fundo, logo e a marcação das 12 caixas (passos 1 e 2 do montador)
  themeKey: string;
  validFrom?: string | null; // YYYY-MM-DD
  validUntil?: string | null; // YYYY-MM-DD
  market: EncarteMarket;
  items: EncarteItem[];
};

export function isEncarteFormat(value: unknown): value is EncarteFormat {
  return typeof value === "string" && (ENCARTE_FORMATS as readonly string[]).includes(value);
}

export function isEncarteLayout(value: unknown): value is EncarteLayout {
  return typeof value === "string" && (ENCARTE_LAYOUTS as readonly string[]).includes(value);
}
