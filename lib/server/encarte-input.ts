import { isUuid } from "@/lib/auth";
import { isISODate } from "@/lib/dates";
import { isThemeKey } from "@/lib/encarte/themes";
import { isEncarteFormat, isEncarteLayout, type EncarteFormat, type EncarteLayout } from "@/lib/encarte/types";

// Validação do encarte salvo (criar ou editar). Os itens apontam para
// produtos do catálogo; a rota confere depois que são deste mercado.

export const MAX_ENCARTE_ITEMS = 200;

export type EncarteItemInput = {
  productId: string;
  promoPrice: number | null;
  oldPrice: number | null;
  highlight: boolean;
  limitQty: number | null;
  label: string | null;
};

export type EncarteInput = {
  name: string;
  headline: string | null;
  subheadline: string | null;
  format: EncarteFormat;
  layout: EncarteLayout;
  themeKey: string;
  validFrom: string | null;
  validUntil: string | null;
  items: EncarteItemInput[];
};

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

function money(v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : v;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n < 1e6 ? Math.round(n * 100) / 100 : null;
}

export function parseEncarteInput(raw: Record<string, unknown>): { ok: true; data: EncarteInput } | { ok: false; error: string } {
  const name = text(raw.name, 120);
  if (!name) return { ok: false, error: "Dê um nome para o encarte." };
  if (!isEncarteFormat(raw.format)) return { ok: false, error: "Escolha um formato." };
  if (!isEncarteLayout(raw.layout)) return { ok: false, error: "Escolha um layout." };
  if (!isThemeKey(raw.themeKey)) return { ok: false, error: "Escolha um tema." };
  const validFrom = raw.validFrom ? (isISODate(raw.validFrom) ? raw.validFrom : undefined) : null;
  const validUntil = raw.validUntil ? (isISODate(raw.validUntil) ? raw.validUntil : undefined) : null;
  if (validFrom === undefined || validUntil === undefined) return { ok: false, error: "Data de validade inválida." };
  if (validFrom && validUntil && validFrom > validUntil) return { ok: false, error: "A data final vem antes da inicial." };

  if (!Array.isArray(raw.items) || raw.items.length === 0) return { ok: false, error: "Escolha pelo menos um produto." };
  if (raw.items.length > MAX_ENCARTE_ITEMS) return { ok: false, error: `Um encarte aceita até ${MAX_ENCARTE_ITEMS} produtos.` };

  const seen = new Set<string>();
  const items: EncarteItemInput[] = [];
  for (const r of raw.items) {
    if (!r || typeof r !== "object") continue;
    const it = r as Record<string, unknown>;
    if (!isUuid(it.productId) || seen.has(it.productId)) continue;
    seen.add(it.productId);
    const limit = typeof it.limitQty === "number" && Number.isInteger(it.limitQty) && it.limitQty >= 1 && it.limitQty <= 999 ? it.limitQty : null;
    items.push({
      productId: it.productId,
      promoPrice: money(it.promoPrice),
      oldPrice: money(it.oldPrice),
      highlight: it.highlight === true,
      limitQty: limit,
      label: text(it.label, 28),
    });
  }
  if (items.length === 0) return { ok: false, error: "Escolha pelo menos um produto." };

  return {
    ok: true,
    data: {
      name,
      headline: text(raw.headline, 80),
      subheadline: text(raw.subheadline, 120),
      format: raw.format,
      layout: raw.layout,
      themeKey: raw.themeKey,
      validFrom,
      validUntil,
      items,
    },
  };
}
