// Uma cor por tema das combinações prontas, só para a lista ficar fácil de
// percorrer com o olho (bolinha no filtro e selo no cartão). Todas têm
// contraste suficiente com texto branco.
const POR_TEMA: Record<string, string> = {
  ofertas: "#d62839",
  "fim-de-semana": "#7c3aed",
  hortifruti: "#2f9e44",
  acougue: "#b42318",
  padaria: "#b7791f",
  bebidas: "#0e7490",
  limpeza: "#0284c7",
  mercearia: "#c2410c",
  frios: "#4f46e5",
  "pet-bazar": "#0d9488",
  "black-friday": "#1f2937",
  natal: "#15803d",
  pascoa: "#a21caf",
  maes: "#db2777",
  "pais-criancas": "#2563eb",
  junina: "#d97706",
  aniversario: "#e11d74",
};
const RESERVA = ["#0f766e", "#9333ea", "#be123c", "#1d4ed8", "#a16207", "#047857"];

export function corDoTema(id: string, indice: number): string {
  return POR_TEMA[id] ?? RESERVA[indice % RESERVA.length];
}
