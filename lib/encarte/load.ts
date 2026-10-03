import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { effectiveOldPrice } from "./price";
import { DEFAULT_THEME_KEY, isThemeKey } from "./themes";
import { isEncarteFormat, isEncarteLayout, type EncarteData, type EncarteItem, type EncarteMarket } from "./types";

// Lê um encarte salvo do Supabase e devolve os dados prontos para desenhar
// (ainda com as URLs originais das fotos; ver lib/encarte/images.ts).
//
// Quem chama confere o acesso: loadEncarte devolve o marketId para a rota
// comparar com o usuário logado ANTES de mostrar qualquer coisa.

type Admin = SupabaseClient<Database>;
type MarketRow = Database["public"]["Tables"]["markets"]["Row"];

export const MARKET_ENCARTE_COLUMNS =
  "name, logo_url, color_primary, color_secondary, tagline, address, city, whatsapp, phone, instagram, opening_hours, legal_note" as const;

// limite de segurança: um encarte com mais itens que isso é erro de uso
export const MAX_ENCARTE_ITEMS = 300;

export function marketRowToEncarte(
  row: Pick<MarketRow, "name" | "logo_url" | "color_primary" | "color_secondary" | "tagline" | "address" | "city" | "whatsapp" | "phone" | "instagram" | "opening_hours" | "legal_note">
): EncarteMarket {
  return {
    name: row.name,
    logoUrl: row.logo_url,
    colorPrimary: row.color_primary,
    colorSecondary: row.color_secondary,
    tagline: row.tagline,
    address: row.address,
    city: row.city,
    whatsapp: row.whatsapp,
    phone: row.phone,
    instagram: row.instagram,
    openingHours: row.opening_hours,
    legalNote: row.legal_note,
  };
}

export type LoadedEncarte = {
  data: EncarteData;
  marketId: string;
  skippedWithoutPrice: number; // itens sem preço de oferta nem preço do produto
};

export async function loadEncarte(admin: Admin, tabloidId: string): Promise<LoadedEncarte | null> {
  const { data: tabloid, error } = await admin
    .from("tabloids")
    .select("id, name, headline, subheadline, format, layout, theme_key, valid_from, valid_until, market_id")
    .eq("id", tabloidId)
    .maybeSingle();
  if (error) throw error;
  if (!tabloid) return null;

  const [marketRes, itemsRes] = await Promise.all([
    admin.from("markets").select(MARKET_ENCARTE_COLUMNS).eq("id", tabloid.market_id).maybeSingle(),
    admin
      .from("tabloid_products")
      .select("position, promo_price, old_price, highlight, limit_qty, label, products(name, brand, unit, image_url, price, market_id)")
      .eq("tabloid_id", tabloidId)
      .order("position", { ascending: true })
      .limit(MAX_ENCARTE_ITEMS),
  ]);
  if (marketRes.error) throw marketRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (!marketRes.data) return null;

  let skippedWithoutPrice = 0;
  const items: EncarteItem[] = [];
  for (const row of itemsRes.data ?? []) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    // segurança: produto de outro mercado nunca entra no encarte
    if (!product || product.market_id !== tabloid.market_id) continue;
    const price = row.promo_price ?? product.price;
    if (price == null || !Number.isFinite(Number(price)) || Number(price) < 0) {
      skippedWithoutPrice++;
      continue;
    }
    // preço "de": o informado no item ou, quando há preço promocional, o
    // preço normal do produto; só vale se for maior que o preço de oferta
    const oldCandidate = row.old_price ?? (row.promo_price != null ? product.price : null);
    items.push({
      name: product.name,
      brand: product.brand,
      unit: product.unit,
      imageUrl: product.image_url,
      price: Number(price),
      oldPrice: effectiveOldPrice(Number(price), oldCandidate == null ? null : Number(oldCandidate)),
      highlight: !!row.highlight,
      limitQty: row.limit_qty,
      label: row.label,
    });
  }

  return {
    marketId: tabloid.market_id,
    skippedWithoutPrice,
    data: {
      id: tabloid.id,
      name: tabloid.name,
      headline: tabloid.headline,
      subheadline: tabloid.subheadline,
      format: isEncarteFormat(tabloid.format) ? tabloid.format : "feed",
      layout: isEncarteLayout(tabloid.layout) ? tabloid.layout : "grade",
      themeKey: isThemeKey(tabloid.theme_key) ? tabloid.theme_key : DEFAULT_THEME_KEY,
      validFrom: tabloid.valid_from,
      validUntil: tabloid.valid_until,
      market: marketRowToEncarte(marketRes.data),
      items,
    },
  };
}
