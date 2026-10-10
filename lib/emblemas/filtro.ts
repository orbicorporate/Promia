import { addDaysISO } from "@/lib/dates";
import type { Emblema } from "./catalog";
import type { Planejado } from "./planejados";
import { quandoFits, quandoFitsRange } from "./quando";
import type { Feriado, TipoOferta } from "./tipos";

export type Janela = "qualquer" | "hoje" | "7" | "30" | "data";

export type Filtro = {
  q: string;
  tipo: TipoOferta | "";
  tema: string; // chave de tema, "sem-tema" ou ""
  feriado: Feriado | "";
  janela: Janela;
  data: string; // ISO, usada quando janela = "data"
};

export const FILTRO_VAZIO: Filtro = { q: "", tipo: "", tema: "", feriado: "", janela: "qualquer", data: "" };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function filtroAtivo(f: Filtro): boolean {
  return !!(f.q.trim() || f.tipo || f.tema || f.feriado || f.janela !== "qualquer");
}

function combinaComData(quando: Emblema["quando"], f: Filtro, hoje: string): boolean {
  switch (f.janela) {
    case "qualquer":
      return true;
    case "hoje":
      return quandoFits(quando, hoje);
    case "7":
      return quandoFitsRange(quando, hoje, 7);
    case "30":
      return quandoFitsRange(quando, hoje, 30);
    case "data":
      return f.data ? quandoFits(quando, f.data) : true;
  }
}

type Filtravel = { nome: string; tipo: TipoOferta; feriados?: Feriado[]; quando?: Emblema["quando"]; tags?: string[]; temas?: string[] };

function passa(e: Filtravel, f: Filtro, hoje: string): boolean {
  if (f.tipo && e.tipo !== f.tipo) return false;
  if (f.feriado && !(e.feriados ?? []).includes(f.feriado)) return false;
  if (f.tema) {
    const t = e.temas ?? [];
    if (f.tema === "sem-tema" ? t.length > 0 : !t.includes(f.tema)) return false;
  }
  if (f.janela !== "qualquer" && e.quando && !combinaComData(e.quando, f, hoje)) return false;
  const q = norm(f.q.trim());
  if (q && !norm([e.nome, ...(e.tags ?? []), ...(e.temas ?? [])].join(" ")).includes(q)) return false;
  return true;
}

// Emblemas que combinam com os filtros. Os do ano todo entram nas buscas
// por data, mas vêm depois dos que têm a data certa.
export function filtrarEmblemas(lista: Emblema[], f: Filtro, hoje: string): Emblema[] {
  const out = lista.filter((e) => passa(e, f, hoje));
  if (f.janela === "qualquer") return out;
  const especifico = (e: Emblema) => (e.quando.kind === "sempre" ? 1 : 0);
  return [...out].sort((a, b) => especifico(a) - especifico(b));
}

export function filtrarPlanejados(lista: Planejado[], f: Filtro, hoje: string): Planejado[] {
  // tema não existe nos planejados (ainda não têm arte); só filtra se for "sem-tema"
  if (f.tema && f.tema !== "sem-tema") return [];
  return lista.filter((p) => passa({ ...p, tags: [p.ideia] }, f, hoje));
}

export function hojeMais(hoje: string, dias: number) {
  return addDaysISO(hoje, dias);
}
