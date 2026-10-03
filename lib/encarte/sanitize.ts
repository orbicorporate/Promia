import { isISODate } from "@/lib/dates";
import { normalizeUnit } from "@/lib/products";
import { isThemeKey } from "./themes";
import { isEncarteFormat, isEncarteLayout, type EncarteData, type EncarteItem } from "./types";

// Validação do encarte que chega do navegador (rota de prévia). Nada do
// que vem de fora é confiável: textos cortados, preços numéricos e não
// negativos, formato/layout/tema da lista fechada, foto só https. O
// mercado NÃO vem daqui (é lido do banco pela rota).

export const PREVIEW_MAX_ITEMS = 200;

export type PreviewInput = Omit<EncarteData, "id" | "market">;

export type SanitizeResult =
  | { ok: true; data: PreviewInput; ignoredItems: number }
  | { ok: false; error: string };

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : null;
}

function money(value: unknown): number | null {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value.replace(",", ".")) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > 999999) return null;
  return Math.round(n * 100) / 100;
}

function httpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

function item(raw: unknown): EncarteItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const name = text(r.name, 120);
  const price = money(r.price);
  if (!name || price == null) return null;
  const oldPrice = money(r.oldPrice);
  const limit = typeof r.limitQty === "number" && Number.isInteger(r.limitQty) && r.limitQty >= 1 && r.limitQty <= 999 ? r.limitQty : null;
  const unit = text(r.unit, 12);
  return {
    name,
    brand: text(r.brand, 60),
    unit: unit ? normalizeUnit(unit) : null,
    imageUrl: httpsUrl(r.imageUrl),
    price,
    oldPrice: oldPrice != null && oldPrice > price ? oldPrice : null,
    highlight: r.highlight === true,
    limitQty: limit,
    label: text(r.label, 28),
  };
}

export function sanitizePreviewInput(raw: unknown): SanitizeResult {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "Dados do encarte inválidos." };
  const r = raw as Record<string, unknown>;
  if (!isEncarteFormat(r.format)) return { ok: false, error: "Formato inválido." };
  if (!isEncarteLayout(r.layout)) return { ok: false, error: "Layout inválido." };
  if (!isThemeKey(r.themeKey)) return { ok: false, error: "Tema inválido." };
  if (r.items != null && !Array.isArray(r.items)) return { ok: false, error: "Lista de produtos inválida." };

  const rawItems = ((r.items as unknown[] | undefined) ?? []).slice(0, PREVIEW_MAX_ITEMS);
  const items = rawItems.map(item).filter((i): i is EncarteItem => i !== null);

  return {
    ok: true,
    ignoredItems: rawItems.length - items.length,
    data: {
      name: text(r.name, 120) ?? "Encarte",
      headline: text(r.headline, 80),
      subheadline: text(r.subheadline, 120),
      format: r.format,
      layout: r.layout,
      themeKey: r.themeKey,
      validFrom: isISODate(r.validFrom) ? r.validFrom : null,
      validUntil: isISODate(r.validUntil) ? r.validUntil : null,
      items,
    },
  };
}
