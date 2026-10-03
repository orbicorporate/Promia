import { createAdminClient } from "@/lib/supabase/admin";
import { THEMES, suggestThemeKeys } from "@/lib/encarte/themes";
import { upcomingOccasions } from "@/lib/occasions";
import { todayInSaoPaulo } from "@/lib/dates";
import type { CatalogProduct, ThemeOption } from "./builder";

// Dados que a tela de montagem precisa: o catálogo ativo, os temas e a
// sugestão de temas pelas datas próximas e pelas categorias do catálogo.
export async function loadBuilderData(marketId: string, extraTitles: string[] = []) {
  const admin = createAdminClient();
  const today = todayInSaoPaulo();
  const [{ data: products }, { data: weekly }] = await Promise.all([
    admin
      .from("products")
      .select("id, name, brand, category, price, unit, image_url")
      .eq("market_id", marketId)
      .eq("active", true)
      .order("name")
      .limit(5000),
    admin.from("weekly_promotions").select("weekday, name, category_hint, active").eq("market_id", marketId),
  ]);

  const catalog: CatalogProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    price: p.price == null ? null : Number(p.price),
    unit: p.unit,
    image_url: p.image_url,
  }));

  const occasions = upcomingOccasions(today, weekly ?? [], 14);
  const suggested = suggestThemeKeys({
    seasonalTitles: [...extraTitles, ...occasions.filter((o) => o.kind === "data").map((o) => o.title)],
    categories: catalog.map((p) => p.category),
  });

  const themes: ThemeOption[] = THEMES.map((t) => ({
    key: t.key,
    name: t.name,
    headline: t.headline,
    bg: t.palette.headerBg,
    text: t.palette.headerText,
    tag: t.palette.tagBg,
    tagText: t.palette.tagText,
    cardBg: t.palette.bg,
  }));

  return { catalog, themes, suggested, today, occasions };
}
