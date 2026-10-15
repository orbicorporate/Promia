// Como a validade ("VÁLIDO 14/10 a 20/10") aparece na arte: estilo e posição.
// Os dois ficam gravados junto do slug do emblema (lib/encarte/emblema-escala.ts).

export const VALIDADE_ESTILOS = ["pilula", "selo", "etiqueta", "claro", "texto"] as const;
export type ValidadeEstilo = (typeof VALIDADE_ESTILOS)[number];

export const VALIDADE_POSICOES = ["abaixo", "sobre", "canto", "base", "oculto"] as const;
export type ValidadePosicao = (typeof VALIDADE_POSICOES)[number];

export const VALIDADE_ESTILO_PADRAO: ValidadeEstilo = "pilula";
export const VALIDADE_POSICAO_PADRAO: ValidadePosicao = "sobre";

export const VALIDADE_ESTILO_LABEL: Record<ValidadeEstilo, string> = {
  pilula: "Pílula escura",
  selo: "Selo redondo",
  etiqueta: "Etiqueta dourada",
  claro: "Pílula clara",
  texto: "Só texto",
};

export const VALIDADE_POSICAO_LABEL: Record<ValidadePosicao, string> = {
  abaixo: "Abaixo do título",
  sobre: "Na emenda do cabeçalho",
  canto: "Canto do topo",
  base: "Acima do rodapé",
  oculto: "Não mostrar",
};

export function isValidadeEstilo(v: unknown): v is ValidadeEstilo {
  return typeof v === "string" && (VALIDADE_ESTILOS as readonly string[]).includes(v);
}
export function isValidadePosicao(v: unknown): v is ValidadePosicao {
  return typeof v === "string" && (VALIDADE_POSICOES as readonly string[]).includes(v);
}
