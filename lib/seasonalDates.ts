// Calendário de datas sazonais/comemorativas relevantes pro varejo
// (supermercados) no Brasil. Datas fixas ficam com mês/dia; datas móveis
// (Páscoa, Dia das Mães/Pais, Black Friday etc.) são calculadas por ano,
// assim não ficam erradas de um ano pro outro. É a base do motor de temas
// sugeridos automaticamente pro tabloide (ver lib/encarte/themes.ts), junto com o
// motor de promoções recorrentes por dia da semana (lib/occasions.ts).

export type SeasonalDate = {
  date: string; // YYYY-MM-DD
  title: string;
  tags: string[]; // categorias/nicho a que a data serve
  universal?: boolean; // relevante pra praticamente qualquer negócio
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function iso(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

// algoritmo anônimo (Gauss) pro domingo de Páscoa
function easterDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function addDays(year: number, month: number, day: number, delta: number): { year: number; month: number; day: number } {
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + delta);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

// enésima ocorrência de um dia da semana num mês (weekday: 0=domingo),
// ex.: 2º domingo de maio = Dia das Mães
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = first.getUTCDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

// última ocorrência de um dia da semana num mês, ex.: última sexta de
// novembro = Black Friday
function lastWeekdayOfMonth(year: number, month: number, weekday: number): number {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const last = new Date(Date.UTC(year, month - 1, lastDay));
  const lastWeekday = last.getUTCDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  return lastDay - offset;
}

export function seasonalDatesForYear(year: number): SeasonalDate[] {
  const easter = easterDate(year);
  const carnaval = addDays(year, easter.month, easter.day, -47); // terça de carnaval
  const sextaSanta = addDays(year, easter.month, easter.day, -2);

  const diaDasMaesDay = nthWeekdayOfMonth(year, 5, 0, 2); // 2º domingo de maio
  const diaDosPaisDay = nthWeekdayOfMonth(year, 8, 0, 2); // 2º domingo de agosto
  const blackFridayDay = lastWeekdayOfMonth(year, 11, 5); // última sexta de novembro
  const cyberMonday = addDays(year, 11, blackFridayDay, 3);

  return [
    { date: iso(year, 1, 1), title: "Confraternização Universal", tags: ["geral"], universal: true },
    { date: iso(year, carnaval.month, carnaval.day), title: "Carnaval", tags: ["geral", "moda", "bebidas", "turismo", "beleza"], universal: true },
    { date: iso(year, sextaSanta.month, sextaSanta.day), title: "Sexta-feira Santa", tags: ["alimentacao", "geral"] },
    { date: iso(year, easter.month, easter.day), title: "Páscoa", tags: ["alimentacao", "presentes", "infantil", "geral"], universal: true },
    { date: iso(year, 3, 8), title: "Dia Internacional da Mulher", tags: ["beleza", "moda", "presentes", "saude"] },
    { date: iso(year, 3, 15), title: "Dia do Consumidor", tags: ["geral", "varejo", "tecnologia"], universal: true },
    { date: iso(year, 4, 21), title: "Tiradentes", tags: ["geral"] },
    { date: iso(year, 5, 1), title: "Dia do Trabalho", tags: ["geral"] },
    { date: iso(year, 5, diaDasMaesDay), title: "Dia das Mães", tags: ["presentes", "moda", "beleza", "alimentacao", "joias"], universal: true },
    { date: iso(year, 6, 12), title: "Dia dos Namorados", tags: ["presentes", "moda", "beleza", "alimentacao", "joias", "bebidas"], universal: true },
    { date: iso(year, 6, 24), title: "Festa Junina (São João)", tags: ["alimentacao", "bebidas", "eventos"] },
    { date: iso(year, 7, 9), title: "Revolução Constitucionalista (SP)", tags: ["geral"] },
    { date: iso(year, 8, diaDosPaisDay), title: "Dia dos Pais", tags: ["presentes", "moda", "tecnologia", "automotivo", "bebidas"], universal: true },
    { date: iso(year, 9, 7), title: "Independência do Brasil", tags: ["geral"] },
    { date: iso(year, 9, 15), title: "Dia do Cliente", tags: ["geral", "varejo"], universal: true },
    { date: iso(year, 9, 21), title: "Dia da Árvore / Início da Primavera", tags: ["geral", "casa", "saude"] },
    { date: iso(year, 10, 12), title: "Dia das Crianças", tags: ["infantil", "presentes", "moda"], universal: true },
    { date: iso(year, 10, 15), title: "Dia do Professor", tags: ["educacao"] },
    { date: iso(year, 10, 31), title: "Halloween", tags: ["infantil", "moda", "alimentacao", "eventos"] },
    { date: iso(year, 11, 20), title: "Dia da Consciência Negra", tags: ["geral", "moda"] },
    { date: iso(year, 11, blackFridayDay), title: "Black Friday", tags: ["geral", "varejo", "moda", "tecnologia", "automotivo"], universal: true },
    { date: iso(cyberMonday.year, cyberMonday.month, cyberMonday.day), title: "Cyber Monday", tags: ["tecnologia", "varejo"] },
    { date: iso(year, 12, 25), title: "Natal", tags: ["presentes", "alimentacao", "bebidas", "moda", "infantil"], universal: true },
    { date: iso(year, 12, 31), title: "Réveillon", tags: ["geral", "bebidas", "moda", "turismo"], universal: true },
  ].sort((a, b) => a.date.localeCompare(b.date));
}

// palavras-chave em português livre que a pessoa pode ter escrito no campo
// de nicho do cliente, mapeadas pra cada tag de data sazonal — assim o
// nicho não precisa bater exatamente com a tag, só fazer sentido.
const TAG_KEYWORDS: Record<string, string[]> = {
  alimentacao: ["comida", "restaurante", "açaí", "acai", "sorvete", "gastronomia", "delivery", "lanchonete", "padaria", "doce", "confeitaria"],
  bebidas: ["bebida", "drink", "cerveja", "vinho", "suco", "água", "agua", "cafeteria", "café"],
  moda: ["roupa", "vestuário", "vestuario", "calçado", "calcado", "acessório", "acessorio", "boutique"],
  beleza: ["estética", "estetica", "cosmético", "cosmetico", "salão", "salao", "skincare", "maquiagem"],
  presentes: ["presente", "gift", "papelaria"],
  joias: ["joia", "jóia", "semijoia", "bijuteria", "joalheria"],
  infantil: ["infantil", "criança", "crianca", "brinquedo", "kids", "bebê", "bebe"],
  tecnologia: ["tecnologia", "software", "saas", "app", "startup", "ti "],
  automotivo: ["automotivo", "carro", "veículo", "veiculo", "moto", "seguro veicular", "oficina", "concessionária", "concessionaria"],
  b2b: ["b2b", "corporativo", "empresa", "indústria", "industria"],
  saude: ["saúde", "saude", "clínica", "clinica", "farmácia", "farmacia", "bem-estar", "odontológ", "odontolog"],
  imoveis: ["imóvel", "imovel", "imobiliária", "imobiliaria", "construtora", "corretora"],
  educacao: ["educação", "educacao", "curso", "escola", "faculdade"],
  turismo: ["turismo", "viagem", "hotel", "pousada", "agência de viagens", "agencia de viagens"],
  varejo: ["varejo", "loja", "e-commerce", "ecommerce", "comércio", "comercio"],
  casa: ["casa", "decoração", "decoracao", "móveis", "moveis", "arquitetura", "design de interiores"],
  eventos: ["evento", "festa", "buffet", "cerimonial"],
};

// pega as datas sazonais que caem entre duas datas ISO (inclusive),
// cruzando virada de ano se precisar (ex.: dezembro deste ano + janeiro do
// mês seguinte).
export function seasonalDatesInRange(startISO: string, endISO: string): SeasonalDate[] {
  const startYear = Number(startISO.slice(0, 4));
  const endYear = Number(endISO.slice(0, 4));
  const years = Array.from(new Set([startYear, endYear]));
  const all = years.flatMap((y) => seasonalDatesForYear(y));
  return all.filter((d) => d.date >= startISO && d.date <= endISO).sort((a, b) => a.date.localeCompare(b.date));
}

// diz se um cliente "faz sentido" pra uma data sazonal: datas universais
// servem pra qualquer negócio; as demais dependem do nicho cadastrado do
// cliente bater com alguma tag da data (ou um sinônimo dela).
export function clientMatchesSeasonalDate(niche: string | null | undefined, date: SeasonalDate): boolean {
  if (date.universal) return true;
  if (!niche) return false;
  const n = niche.toLowerCase();
  return date.tags.some((tag) => n.includes(tag) || (TAG_KEYWORDS[tag] || []).some((kw) => n.includes(kw)));
}
