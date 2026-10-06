import { normalizeName } from "@/lib/photos/key";

// Casa o nome de um produto do encarte do concorrente com o catálogo do
// mercado. Tamanho diferente (2L contra 600ml) não é o mesmo produto.

const GENERIC = new Set(["de", "da", "do", "com", "e", "a", "o", "em", "tipo", "tp", "un", "und", "unid", "cada", "pct", "pacote", "embalagem", "emb", "lata", "garrafa", "pet", "caixa", "cx", "kg", "g", "l", "ml", "oferta"]);
const SIZE = /^\d+(?:\.\d+)?(?:kg|g|ml|l|un|lt)?$/;

export function tokens(name: string) {
  const all = normalizeName(name).split(" ").filter(Boolean);
  return {
    words: new Set(all.filter((t) => !GENERIC.has(t) && !SIZE.test(t) && t.length > 1)),
    sizes: new Set(all.filter((t) => SIZE.test(t) && /[a-z]/.test(t))),
  };
}

export function similarity(a: string, b: string): number {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.words.size || !tb.words.size) return 0;
  let inter = 0;
  for (const w of ta.words) if (tb.words.has(w)) inter++;
  // quanto do nome menor aparece no maior: "Arroz Camil 5kg" casa com "Arroz Branco Tipo 1 Camil 5kg"
  const score = inter / Math.min(ta.words.size, tb.words.size);
  const sizeClash = ta.sizes.size > 0 && tb.sizes.size > 0 && ![...ta.sizes].some((s) => tb.sizes.has(s));
  return sizeClash ? score * 0.4 : score;
}

export function bestMatch<T extends { id: string; name: string; brand?: string | null }>(name: string, catalog: T[], min = 0.6): { item: T; score: number } | null {
  let best: { item: T; score: number } | null = null;
  for (const c of catalog) {
    const s = Math.max(similarity(name, c.name), c.brand ? similarity(name, `${c.name} ${c.brand}`) : 0);
    if (s >= min && (!best || s > best.score)) best = { item: c, score: s };
  }
  return best;
}
