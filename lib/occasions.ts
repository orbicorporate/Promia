import { seasonalDatesInRange } from "@/lib/seasonalDates";
import { addDaysISO } from "@/lib/dates";
import { DEFAULT_THEME_KEY, getTheme, themeForCategory, themeForSeasonalTitle } from "@/lib/encarte/themes";

// Próximas ocasiões que valem um encarte: datas do calendário que o
// varejo alimentar usa e as promoções fixas da semana do próprio mercado.

export type Occasion = {
  date: string; // YYYY-MM-DD
  title: string;
  kind: "data" | "semana";
  themeKey: string;
  headline: string;
};

const IGNORAR = /tiradentes|revolu|independ|consci|trabalho|confraterniza|cyber|professor|arvore|árvore|internacional da mulher|sexta-feira santa/i;

export function upcomingOccasions(
  today: string,
  weekly: { weekday: number; name: string; category_hint: string | null; active: boolean }[],
  days = 21
): Occasion[] {
  const end = addDaysISO(today, days);
  const out: Occasion[] = [];

  for (const d of seasonalDatesInRange(today, end)) {
    if (IGNORAR.test(d.title)) continue;
    const theme = themeForSeasonalTitle(d.title);
    if (!theme && !d.universal) continue;
    const key = theme?.key ?? DEFAULT_THEME_KEY;
    out.push({ date: d.date, title: d.title, kind: "data", themeKey: key, headline: theme?.headline ?? `Ofertas de ${d.title}` });
  }

  for (let i = 0; i < 7; i++) {
    const date = addDaysISO(today, i);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    for (const p of weekly) {
      if (!p.active || p.weekday !== weekday) continue;
      const theme = (p.category_hint && themeForCategory(p.category_hint)) || themeForCategory(p.name);
      out.push({ date, title: p.name, kind: "semana", themeKey: theme?.key ?? DEFAULT_THEME_KEY, headline: p.name });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function themeAccent(key: string) {
  const t = getTheme(key);
  return { bg: t.palette.headerBg, text: t.palette.headerText, tag: t.palette.tagBg };
}
