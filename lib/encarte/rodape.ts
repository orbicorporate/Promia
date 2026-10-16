import { VALIDADE_COR_HEX, VALIDADE_CORES, type ValidadeCor } from "./validade";

// Rodapé do encarte: o desenho (estilo), a cor e uma frase opcional no lugar
// do endereço. Ficam gravados junto do slug do emblema (emblema-escala.ts).

export const RODAPE_ESTILOS = ["barra", "claro", "pilula", "centro", "faixa", "degrade"] as const;
export type RodapeEstilo = (typeof RODAPE_ESTILOS)[number];

// "tema" acompanha as cores do tema e do logo escolhidos; as outras são fixas
export const RODAPE_CORES = ["tema", ...VALIDADE_CORES] as const;
export type RodapeCor = (typeof RODAPE_CORES)[number];

export const RODAPE_TEXTO_MAX = 56;
export const RODAPE_CAMPO_MAX = { nome: 40, whatsapp: 24, instagram: 30, horario: 44 } as const;

// partes do rodapé que dá para esconder
export const RODAPE_PARTES = ["selo", "nome", "endereco", "contato", "horario"] as const;
export type RodapeParte = (typeof RODAPE_PARTES)[number];
export const RODAPE_PARTE_LABEL: Record<RodapeParte, string> = { selo: "Selo", nome: "Nome", endereco: "Endereço", contato: "Contatos", horario: "Horário" };
// letra de cada parte na gravação compacta ("msc" = selo e contatos escondidos)
export const RODAPE_PARTE_LETRA: Record<RodapeParte, string> = { selo: "s", nome: "n", endereco: "e", contato: "c", horario: "h" };

export type RodapeOpcoes = {
  estilo: RodapeEstilo;
  cor: RodapeCor;
  texto: string; // frase no lugar do endereço
  nome: string; // nome no lugar do nome do mercado
  whatsapp: string;
  instagram: string;
  horario: string; // só aparece quando preenchido
  ocultar: RodapeParte[];
};
export const RODAPE_PADRAO: RodapeOpcoes = { estilo: "barra", cor: "tema", texto: "", nome: "", whatsapp: "", instagram: "", horario: "", ocultar: [] };

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

export function limparCampo(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/[~\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";
}
export const isRodapeParte = (v: unknown): v is RodapeParte => has(RODAPE_PARTES, v);
export function limparOcultar(v: unknown): RodapeParte[] {
  return Array.isArray(v) ? RODAPE_PARTES.filter((p) => v.includes(p)) : [];
}

export function limparRodape(raw: unknown): Partial<RodapeOpcoes> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const out: Partial<RodapeOpcoes> = {};
  if (isRodapeEstilo(r.estilo)) out.estilo = r.estilo;
  if (isRodapeCor(r.cor)) out.cor = r.cor;
  if (typeof r.texto === "string") out.texto = limparRodapeTexto(r.texto);
  for (const k of ["nome", "whatsapp", "instagram", "horario"] as const) if (typeof r[k] === "string") out[k] = limparCampo(r[k], RODAPE_CAMPO_MAX[k]);
  if (Array.isArray(r.ocultar)) out.ocultar = limparOcultar(r.ocultar);
  return out;
}

export function resolverRodape(p?: Partial<RodapeOpcoes> | null): RodapeOpcoes {
  return { ...RODAPE_PADRAO, ...limparRodape(p) };
}

// O que de fato aparece no rodapé, já com os textos digitados no encarte por
// cima do cadastro do mercado e as partes escondidas retiradas.
export type MercadoRodape = { name: string; address?: string | null; city?: string | null; whatsapp?: string | null; phone?: string | null; instagram?: string | null };
export type RodapeDados = { nome: string; mostrarSelo: boolean; mostrarNome: boolean; linha2: string; contato: string; horario: string; iniciaisDe: string };

export function rodapeDados(market: MercadoRodape, op: RodapeOpcoes): RodapeDados {
  const oculta = (p: RodapeParte) => op.ocultar.includes(p);
  const nome = op.nome || market.name;
  const addr = [market.address, market.city].filter(Boolean).join(" - ");
  const whats = op.whatsapp || market.whatsapp || "";
  const insta = (op.instagram || market.instagram || "").replace(/^@/, "");
  const contato = [whats ? `WhatsApp ${whats}` : null, !whats && market.phone ? market.phone : null, insta ? `@${insta}` : null].filter(Boolean).join("   ");
  return {
    nome,
    mostrarSelo: !oculta("selo"),
    mostrarNome: !oculta("nome"),
    linha2: oculta("endereco") ? "" : op.texto || addr,
    contato: oculta("contato") ? "" : contato,
    horario: oculta("horario") ? "" : op.horario,
    iniciaisDe: nome,
  };
}

// Dados do cadastro que servem de sugestão (texto cinza) nos campos do editor de rodapé.
export function mercadoRodapeInfo(m: { name: string; whatsapp?: string | null; instagram?: string | null; address?: string | null; city?: string | null; opening_hours?: string | null }) {
  return {
    nome: m.name,
    whatsapp: m.whatsapp ?? "",
    instagram: m.instagram ?? "",
    endereco: [m.address, m.city].filter(Boolean).join(" - "),
    horario: m.opening_hours ?? "",
  };
}
