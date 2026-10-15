import { VALIDADE_COR_HEX, VALIDADE_CORES, type ValidadeCor } from "./validade";

// Rodapé do encarte: o desenho (estilo), a cor e uma frase opcional no lugar
// do endereço. Ficam gravados junto do slug do emblema (emblema-escala.ts).

export const RODAPE_ESTILOS = ["barra", "claro", "pilula", "centro", "faixa", "degrade"] as const;
export type RodapeEstilo = (typeof RODAPE_ESTILOS)[number];

// "tema" acompanha as cores do tema e do logo escolhidos; as outras são fixas
export const RODAPE_CORES = ["tema", ...VALIDADE_CORES] as const;
export type RodapeCor = (typeof RODAPE_CORES)[number];

export const RODAPE_TEXTO_MAX = 56;

export type RodapeOpcoes = { estilo: RodapeEstilo; cor: RodapeCor; texto: string };
export const RODAPE_PADRAO: RodapeOpcoes = { estilo: "barra", cor: "tema", texto: "" };

export const RODAPE_ESTILO_LABEL: Record<RodapeEstilo, string> = {
  barra: "Barra",
  claro: "Claro",
  pilula: "Pílula",
  centro: "Centro",
  faixa: "Duas cores",
  degrade: "Degradê",
};
export const RODAPE_COR_LABEL: Record<RodapeCor, string> = {
  tema: "Cor do tema",
  branco: "Branco",
  dourado: "Dourado",
  preto: "Preto",
  vermelho: "Vermelho",
  verde: "Verde",
  azul: "Azul",
};
export const RODAPE_COR_HEX = (c: Exclude<RodapeCor, "tema">): string => VALIDADE_COR_HEX[c as ValidadeCor];

const has = (lista: readonly string[], v: unknown): boolean => typeof v === "string" && lista.includes(v);
export const isRodapeEstilo = (v: unknown): v is RodapeEstilo => has(RODAPE_ESTILOS, v);
export const isRodapeCor = (v: unknown): v is RodapeCor => has(RODAPE_CORES, v);

export function limparRodapeTexto(v: unknown): string {
  return typeof v === "string" ? v.replace(/[~\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, RODAPE_TEXTO_MAX) : "";
}

export function limparRodape(raw: unknown): Partial<RodapeOpcoes> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<RodapeOpcoes> = {};
  if (isRodapeEstilo(r.estilo)) out.estilo = r.estilo;
  if (isRodapeCor(r.cor)) out.cor = r.cor;
  if (typeof r.texto === "string") out.texto = limparRodapeTexto(r.texto);
  return out;
}

export function resolverRodape(p?: Partial<RodapeOpcoes> | null): RodapeOpcoes {
  return { ...RODAPE_PADRAO, ...limparRodape(p) };
}
