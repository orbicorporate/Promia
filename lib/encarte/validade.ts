// Como a validade ("VÁLIDO 14/10 a 20/10") aparece na arte: posição, alinhamento,
// estilo e cor. Os quatro ficam gravados junto do slug do emblema
// (lib/encarte/emblema-escala.ts). Todas as combinações funcionam, porque a
// posição (linha) e o alinhamento (lado) são independentes.

export const VALIDADE_POSICOES = ["abaixo", "sobre", "base", "oculto"] as const;
export type ValidadePosicao = (typeof VALIDADE_POSICOES)[number];

export const VALIDADE_ALINHAMENTOS = ["esquerda", "centro", "direita"] as const;
export type ValidadeAlinhamento = (typeof VALIDADE_ALINHAMENTOS)[number];

export const VALIDADE_ESTILOS = ["cheia", "contorno", "texto"] as const;
export type ValidadeEstilo = (typeof VALIDADE_ESTILOS)[number];

export const VALIDADE_CORES = ["branco", "dourado", "preto", "vermelho", "verde", "azul"] as const;
export type ValidadeCor = (typeof VALIDADE_CORES)[number];

export const VALIDADE_POSICAO_PADRAO: ValidadePosicao = "sobre";
export const VALIDADE_ALINHAMENTO_PADRAO: ValidadeAlinhamento = "centro";
export const VALIDADE_ESTILO_PADRAO: ValidadeEstilo = "cheia";
export const VALIDADE_COR_PADRAO: ValidadeCor = "branco";

export const VALIDADE_POSICAO_LABEL: Record<ValidadePosicao, string> = {
  abaixo: "Abaixo do logo",
  sobre: "Na emenda",
  base: "No rodapé",
  oculto: "Sem data",
};
export const VALIDADE_ALINHAMENTO_LABEL: Record<ValidadeAlinhamento, string> = { esquerda: "Esquerda", centro: "Centro", direita: "Direita" };
export const VALIDADE_ESTILO_LABEL: Record<ValidadeEstilo, string> = { cheia: "Cheia", contorno: "Contorno", texto: "Texto" };
export const VALIDADE_COR_LABEL: Record<ValidadeCor, string> = { branco: "Branco", dourado: "Dourado", preto: "Preto", vermelho: "Vermelho", verde: "Verde", azul: "Azul" };

export const VALIDADE_COR_HEX: Record<ValidadeCor, string> = {
  branco: "#ffffff",
  dourado: "#f5b800",
  preto: "#141a24",
  vermelho: "#e0262f",
  verde: "#16a34a",
  azul: "#2563eb",
};

// cor do texto que fica legível sobre o fundo escolhido
export function tintaSobre(cor: ValidadeCor): string {
  return cor === "branco" || cor === "dourado" ? "#141a24" : "#ffffff";
}

export type ValidadeOpcoes = {
  estilo: ValidadeEstilo;
  posicao: ValidadePosicao;
  alinhamento: ValidadeAlinhamento;
  cor: ValidadeCor;
};
export const VALIDADE_PADRAO: ValidadeOpcoes = {
  estilo: VALIDADE_ESTILO_PADRAO,
  posicao: VALIDADE_POSICAO_PADRAO,
  alinhamento: VALIDADE_ALINHAMENTO_PADRAO,
  cor: VALIDADE_COR_PADRAO,
};

const has = (lista: readonly string[], v: unknown): boolean => typeof v === "string" && lista.includes(v);
export const isValidadeEstilo = (v: unknown): v is ValidadeEstilo => has(VALIDADE_ESTILOS, v);
export const isValidadePosicao = (v: unknown): v is ValidadePosicao => has(VALIDADE_POSICOES, v);
export const isValidadeAlinhamento = (v: unknown): v is ValidadeAlinhamento => has(VALIDADE_ALINHAMENTOS, v);
export const isValidadeCor = (v: unknown): v is ValidadeCor => has(VALIDADE_CORES, v);

// aceita qualquer valor vindo de fora e devolve só o que é válido
export function limparValidade(raw: unknown): Partial<ValidadeOpcoes> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<ValidadeOpcoes> = {};
  if (isValidadeEstilo(r.estilo)) out.estilo = r.estilo;
  if (isValidadePosicao(r.posicao)) out.posicao = r.posicao;
  if (isValidadeAlinhamento(r.alinhamento)) out.alinhamento = r.alinhamento;
  if (isValidadeCor(r.cor)) out.cor = r.cor;
  return out;
}

// junta o que foi escolhido com o padrão (ignora valores ausentes ou inválidos)
export function resolverValidade(p?: Partial<ValidadeOpcoes> | null): ValidadeOpcoes {
  return { ...VALIDADE_PADRAO, ...limparValidade(p) };
}
