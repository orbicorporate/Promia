import { addDaysISO } from "@/lib/dates";
import { seasonalDatesForYear } from "@/lib/seasonalDates";
import { DIAS_SEMANA, type Quando } from "./tipos";

// Diz se um emblema combina com uma data, e descreve a regra em português.

function weekday(iso: string) {
  return new Date(`${iso}T12:00:00Z`).getUTCDay();
}

function holidayDates(title: string, year: number): string[] {
  return seasonalDatesForYear(year)
    .filter((d) => d.title.toLowerCase().startsWith(title.toLowerCase()))
    .map((d) => d.date);
}

function daysBetween(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00Z`).getTime() - new Date(`${a}T12:00:00Z`).getTime()) / 86_400_000);
}

export function quandoFits(q: Quando, iso: string): boolean {
  const year = Number(iso.slice(0, 4));
  switch (q.kind) {
    case "sempre":
      return true;
    case "semana":
      return q.dias.includes(weekday(iso));
    case "mes":
      return Number(iso.slice(5, 7)) === q.mes;
    case "diaDoMes": {
      const day = Number(iso.slice(8, 10));
      return q.dias.some((d) => day <= d && d - day <= (q.antes ?? 0));
    }
    case "feriado": {
      for (const y of [year - 1, year, year + 1]) {
        for (const h of holidayDates(q.titulo, y)) {
          const diff = daysBetween(iso, h); // positivo: o feriado ainda vem
          if (diff <= q.antes && diff >= -(q.depois ?? 0)) return true;
        }
      }
      return false;
    }
    case "periodo": {
      if (q.de.length > 5) return iso >= q.de && iso <= q.ate;
      const md = iso.slice(5);
      return q.de <= q.ate ? md >= q.de && md <= q.ate : md >= q.de || md <= q.ate;
    }
  }
}

export function quandoFitsRange(q: Quando, from: string, days: number): boolean {
  for (let i = 0; i <= days; i++) if (quandoFits(q, addDaysISO(from, i))) return true;
  return false;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function lista(items: string[]) {
  return items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

function mmdd(s: string) {
  const [m, d] = s.length > 5 ? [s.slice(5, 7), s.slice(8, 10)] : [s.slice(0, 2), s.slice(3, 5)];
  return `${Number(d)} de ${MESES[Number(m) - 1]}`;
}

export function quandoTexto(q: Quando): string {
  switch (q.kind) {
    case "sempre":
      return "O ano todo";
    case "semana": {
      const nomes = q.dias.map((d) => DIAS_SEMANA[d]);
      if (nomes.length === 1) return `${q.dias[0] === 0 || q.dias[0] === 6 ? "Todo" : "Toda"} ${nomes[0]}`;
      return `De ${nomes[0]} a ${nomes[nomes.length - 1]}`;
    }
    case "mes":
      return `Em ${MESES[q.mes - 1]}`;
    case "diaDoMes":
      return `Perto do dia ${lista(q.dias.map(String))}${q.antes ? `, a partir de ${q.antes} dias antes` : ""}`;
    case "feriado":
      if (q.depois && q.depois < 0) return `De ${q.antes} a ${-q.depois} dias antes de ${q.titulo}`;
      return `${q.antes} dias antes de ${q.titulo}${q.depois ? ` até ${q.depois} depois` : ""}`;
    case "periodo":
      return `De ${mmdd(q.de)} a ${mmdd(q.ate)}`;
  }
}
