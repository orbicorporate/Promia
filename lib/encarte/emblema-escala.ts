import { isValidadeEstilo, isValidadePosicao, VALIDADE_ESTILO_PADRAO, VALIDADE_POSICAO_PADRAO, type ValidadeEstilo, type ValidadePosicao } from "./validade";

// Ajustes do encarte que não têm coluna própria no banco ficam gravados junto
// do slug do emblema, no campo `emblema`, separados por "~":
//   "slug~120~vselo~pcanto" = logo a 120%, validade em selo, no canto.
// Valores padrão não são gravados, então "slug" puro continua valendo.

export const EMBLEMA_ESCALA_MIN = 0.6;
export const EMBLEMA_ESCALA_MAX = 1.6;
export const EMBLEMA_ESCALA_PASSO = 0.05;

export function clampEscala(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 1;
  return Math.round(Math.min(EMBLEMA_ESCALA_MAX, Math.max(EMBLEMA_ESCALA_MIN, n)) * 100) / 100;
}

export type OpcoesEmblema = { slug: string | null; escala: number; validadeEstilo: ValidadeEstilo; validadePosicao: ValidadePosicao };

export function lerEmblema(raw: string | null | undefined): OpcoesEmblema {
  const out: OpcoesEmblema = { slug: null, escala: 1, validadeEstilo: VALIDADE_ESTILO_PADRAO, validadePosicao: VALIDADE_POSICAO_PADRAO };
  if (!raw) return out;
  const [slug, ...resto] = raw.split("~");
  out.slug = slug || null;
  for (const t of resto) {
    if (/^\d+$/.test(t)) out.escala = clampEscala(Number(t) / 100);
    else if (t.startsWith("v") && isValidadeEstilo(t.slice(1))) out.validadeEstilo = t.slice(1) as ValidadeEstilo;
    else if (t.startsWith("p") && isValidadePosicao(t.slice(1))) out.validadePosicao = t.slice(1) as ValidadePosicao;
  }
  return out;
}

export function juntarEmblema(slug: string | null, escala: number, validadeEstilo: ValidadeEstilo = VALIDADE_ESTILO_PADRAO, validadePosicao: ValidadePosicao = VALIDADE_POSICAO_PADRAO): string | null {
  if (!slug) return null;
  const e = clampEscala(escala);
  const partes = [slug];
  if (e !== 1) partes.push(String(Math.round(e * 100)));
  if (validadeEstilo !== VALIDADE_ESTILO_PADRAO) partes.push(`v${validadeEstilo}`);
  if (validadePosicao !== VALIDADE_POSICAO_PADRAO) partes.push(`p${validadePosicao}`);
  return partes.join("~");
}
