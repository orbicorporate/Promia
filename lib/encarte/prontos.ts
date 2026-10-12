import type { EncarteFundo, EncarteModelo } from "./types";

// Combinações prontas: um clique e a arte já sai com caixa, fundo e emblema que combinam.
export const VISUAIS_PRONTOS: { slug: string; nome: string; modelo: EncarteModelo; fundo: EncarteFundo; emblema: string; themeKey: string }[] = [
  { slug: "ofertao-de-sabado", nome: "Ofertão de sábado", modelo: "cx01", fundo: "cs33" as EncarteFundo, emblema: "ofertao-de-sabado", themeKey: "ofertas" },
  { slug: "hortifruti", nome: "Hortifruti", modelo: "cx02", fundo: "dp01" as EncarteFundo, emblema: "quarta-do-hortifruti", themeKey: "hortifruti" },
  { slug: "acougue", nome: "Açougue", modelo: "cx07", fundo: "dp05" as EncarteFundo, emblema: "terca-da-carne", themeKey: "acougue" },
  { slug: "padaria", nome: "Padaria", modelo: "cx19", fundo: "dp12" as EncarteFundo, emblema: "padaria", themeKey: "padaria" },
  { slug: "fim-de-semana", nome: "Fim de semana", modelo: "cx05", fundo: "pp08" as EncarteFundo, emblema: "ofertas-de-fim-de-semana", themeKey: "fim-de-semana" },
  { slug: "black-friday", nome: "Black Friday", modelo: "cx04", fundo: "cs31" as EncarteFundo, emblema: "black-friday", themeKey: "black-friday" },
  { slug: "natal", nome: "Natal", modelo: "cx16", fundo: "fs25" as EncarteFundo, emblema: "natal-de-ofertas", themeKey: "natal" },
  { slug: "dia-das-maes", nome: "Dia das mães", modelo: "cx22", fundo: "fs39" as EncarteFundo, emblema: "dia-das-maes", themeKey: "dia-das-maes" },
];

