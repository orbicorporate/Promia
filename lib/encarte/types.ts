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
export const ENCARTE_MODELOS = ["feira"] as const;
export type EncarteModelo = (typeof ENCARTE_MODELOS)[number];

export function isEncarteModelo(value: unknown): value is EncarteModelo {
  return typeof value === "string" && (ENCARTE_MODELOS as readonly string[]).includes(value);
}

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
