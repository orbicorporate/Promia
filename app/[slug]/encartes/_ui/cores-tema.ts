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
  halloween: "#ea580c",
  carnaval: "#c026d3",
  aniversario: "#e11d74",
};
const RESERVA = ["#0f766e", "#9333ea", "#be123c", "#1d4ed8", "#a16207", "#047857"];

export function corDoTema(id: string, indice: number): string {
  return POR_TEMA[id] ?? RESERVA[indice % RESERVA.length];
}

// Uma cor por grupo de logos (filtro "Ou troque só o logo da campanha").
const POR_GRUPO: Record<string, string> = {
  "Para agora": "#16a34a",
  "Campanhas recorrentes": "#2563eb",
  "Loja e economia": "#c2410c",
  "Datas em família": "#db2777",
  "Datas e celebrações": "#7c3aed",
  "Grandes campanhas": "#d62839",
  "Ofertões": "#b45309",
  "Ofertões mensais": "#0e7490",
  "Condições comerciais": "#4f46e5",
  "Setores de alimentos": "#2f9e44",
  "Setores de casa e cuidados": "#0284c7",
  "Clientes e calendário": "#0d9488",
  "Sugestões de mercado": "#a21caf",
  "Datas comemorativas": "#9333ea",
  "Promoções e descontos": "#e11d48",
  "Urgência e prazo": "#ea580c",
  "Dias e semanas fixos": "#1d4ed8",
  "Carnes e churrasco": "#991b1b",
  "Mercearia e bebidas": "#a16207",
  "Frescos, congelados e doces": "#15803d",
  "Casa, higiene e bazar": "#0369a1",
  "Receitas e ocasiões": "#c2410c",
  "Serviços e institucional": "#0f766e",
};
export function corDoGrupo(nome: string, indice: number): string {
  return POR_GRUPO[nome] ?? RESERVA[indice % RESERVA.length];
}
