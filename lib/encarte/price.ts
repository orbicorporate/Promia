// Formatação de preço no padrão de encarte de supermercado brasileiro:
// "R$" pequeno, parte inteira enorme, centavos pequenos no alto (",90") e
// a unidade embaixo dos centavos ("/kg"). Tudo aqui é texto puro, sem
// layout: o desenho fica em lib/encarte/render.tsx.

export type PriceParts = {
  currency: string; // "R$"
  integer: string; // "1.299"
  cents: string; // ",90"
};

function toCents(value: number): number {
  return Math.round(Math.max(0, value) * 100);
}

export function priceParts(value: number): PriceParts {
  const cents = toCents(Number.isFinite(value) ? value : 0);
  const integer = Math.floor(cents / 100);
  return {
    currency: "R$",
    integer: integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "."),
    cents: `,${String(cents % 100).padStart(2, "0")}`,
  };
}

// "R$ 1.299,90" (espaço comum, não o espaço fino do Intl, que some em
// algumas fontes)
export function formatBRL(value: number): string {
  const p = priceParts(value);
  return `${p.currency} ${p.integer}${p.cents}`;
}

const UNIT_SUFFIX: Record<string, string> = {
  un: "cada",
  kg: "/kg",
  g: "/g",
  l: "/litro",
  ml: "/ml",
  cx: "/caixa",
  pct: "/pacote",
  dz: "/dúzia",
  bdj: "/bandeja",
  fd: "/fardo",
};

// Sufixo de unidade que aparece embaixo dos centavos. Produto sem unidade
// (a maioria: pacote de arroz, garrafa de refrigerante) não leva sufixo;
// "un" vira "cada" (nunca "/un", que ninguém escreve em cartaz); o resto
// vira "/kg", "/bandeja" etc. Unidade desconhecida aparece como veio.
export function unitSuffix(unit: string | null | undefined): string {
  if (!unit) return "";
  const key = unit.trim().toLowerCase();
  if (!key) return "";
  return UNIT_SUFFIX[key] ?? `/${key.slice(0, 8)}`;
}

// só vale como preço "de" quando é maior que o preço de oferta
export function effectiveOldPrice(price: number, oldPrice: number | null | undefined): number | null {
  if (oldPrice == null || !Number.isFinite(oldPrice)) return null;
  return toCents(oldPrice) > toCents(price) ? oldPrice : null;
}

// "de R$ 9,99"
export function oldPriceLabel(price: number, oldPrice: number | null | undefined): string | null {
  const old = effectiveOldPrice(price, oldPrice);
  return old == null ? null : `de ${formatBRL(old)}`;
}

// desconto em % arredondado; só aparece a partir de 5% (abaixo disso o
// selo chama atenção para um desconto que não convence)
export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  const old = effectiveOldPrice(price, oldPrice);
  if (old == null) return null;
  const pct = Math.round(((toCents(old) - toCents(price)) / toCents(old)) * 100);
  return pct >= 5 ? pct : null;
}

export function discountLabel(price: number, oldPrice: number | null | undefined): string | null {
  const pct = discountPercent(price, oldPrice);
  return pct == null ? null : `-${pct}%`;
}

export function limitLabel(limitQty: number | null | undefined): string | null {
  if (limitQty == null || !Number.isFinite(limitQty)) return null;
  const n = Math.floor(limitQty);
  return n >= 1 ? `Limite de ${n} por cliente` : null;
}
