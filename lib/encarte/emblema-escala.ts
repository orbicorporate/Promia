import { limparRotulo, isValidadeAlinhamento, isValidadeCor, isValidadeEstilo, isValidadePosicao, VALIDADE_PADRAO, type ValidadeOpcoes } from "./validade";

// Ajustes do encarte que não têm coluna própria no banco ficam gravados junto
// do slug do emblema, no campo `emblema`, separados por "~":
//   "slug~120~vcontorno~pbase~adireita~cpreto" = logo a 120%, validade em contorno preto,
// no rodapé, à direita.
// Valores padrão não são gravados, então "slug" puro continua valendo.

export const EMBLEMA_ESCALA_MIN = 0.6;
export const EMBLEMA_ESCALA_MAX = 1.6;
export const EMBLEMA_ESCALA_PASSO = 0.05;

export function clampEscala(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 1;
  return Math.round(Math.min(EMBLEMA_ESCALA_MAX, Math.max(EMBLEMA_ESCALA_MIN, n)) * 100) / 100;
}

export type OpcoesEmblema = { slug: string | null; escala: number; validade: ValidadeOpcoes };

export function lerEmblema(raw: string | null | undefined): OpcoesEmblema {
  const out: OpcoesEmblema = { slug: null, escala: 1, validade: { ...VALIDADE_PADRAO } };
  if (!raw) return out;
  const [slug, ...resto] = raw.split("~");
  out.slug = slug || null;
  for (const t of resto) {
    const v = t.slice(1);
    if (/^\d+$/.test(t)) out.escala = clampEscala(Number(t) / 100);
    else if (t[0] === "v" && isValidadeEstilo(v)) out.validade.estilo = v;
    else if (t[0] === "p" && isValidadePosicao(v)) out.validade.posicao = v;
    else if (t[0] === "a" && isValidadeAlinhamento(v)) out.validade.alinhamento = v;
    else if (t[0] === "c" && isValidadeCor(v)) out.validade.cor = v;
    else if (t[0] === "t") {
      try {
        out.validade.rotulo = limparRotulo(decodeURIComponent(v));
      } catch {
        /* ignora texto mal formado */
      }
    }
  }
  return out;
}

export function juntarEmblema(slug: string | null, escala: number, validade: Partial<ValidadeOpcoes> = {}): string | null {
  if (!slug) return null;
  const e = clampEscala(escala);
  const val = { ...VALIDADE_PADRAO, ...validade };
  const partes = [slug];
  if (e !== 1) partes.push(String(Math.round(e * 100)));
  if (val.estilo !== VALIDADE_PADRAO.estilo) partes.push(`v${val.estilo}`);
  if (val.posicao !== VALIDADE_PADRAO.posicao) partes.push(`p${val.posicao}`);
  if (val.alinhamento !== VALIDADE_PADRAO.alinhamento) partes.push(`a${val.alinhamento}`);
  if (val.cor !== VALIDADE_PADRAO.cor) partes.push(`c${val.cor}`);
  const rotulo = limparRotulo(val.rotulo);
  if (rotulo) partes.push(`t${encodeURIComponent(rotulo).replace(/~/g, "%7E")}`);
  return partes.join("~");
}
