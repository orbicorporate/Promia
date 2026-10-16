import { limparRodapeTexto, limparCampo, isRodapeCor, isRodapeEstilo, RODAPE_CAMPO_MAX, RODAPE_PADRAO, RODAPE_PARTES, RODAPE_PARTE_LETRA, type RodapeOpcoes } from "./rodape";
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

export type OpcoesEmblema = { slug: string | null; escala: number; validade: ValidadeOpcoes; rodape: RodapeOpcoes };

export function lerEmblema(raw: string | null | undefined): OpcoesEmblema {
  const out: OpcoesEmblema = { slug: null, escala: 1, validade: { ...VALIDADE_PADRAO }, rodape: { ...RODAPE_PADRAO } };
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
    else if (t[0] === "r" && isRodapeEstilo(v)) out.rodape.estilo = v;
    else if (t[0] === "k" && isRodapeCor(v)) out.rodape.cor = v;
    else if (t[0] === "x") {
      try {
        out.rodape.texto = limparRodapeTexto(decodeURIComponent(v));
      } catch {
        /* ignora texto mal formado */
      }
    } else if (t[0] === "n" || t[0] === "w" || t[0] === "i" || t[0] === "h") {
      const campo = ({ n: "nome", w: "whatsapp", i: "instagram", h: "horario" } as const)[t[0]];
      try {
        out.rodape[campo] = limparCampo(decodeURIComponent(v), RODAPE_CAMPO_MAX[campo]);
      } catch {
        /* ignora texto mal formado */
      }
    } else if (t[0] === "m") {
      out.rodape.ocultar = RODAPE_PARTES.filter((p) => v.includes(RODAPE_PARTE_LETRA[p]));
    } else if (t[0] === "t") {
      try {
        out.validade.rotulo = limparRotulo(decodeURIComponent(v));
      } catch {
        /* ignora texto mal formado */
      }
    }
  }
  return out;
}

// Sem slug (encarte só com título) as opções continuam valendo: o texto fica "~vcontorno...".
export function juntarEmblema(slug: string | null, escala: number, validade: Partial<ValidadeOpcoes> = {}, rodape: Partial<RodapeOpcoes> = {}): string | null {
  const e = slug ? clampEscala(escala) : 1;
  const val = { ...VALIDADE_PADRAO, ...validade };
  const rod = { ...RODAPE_PADRAO, ...rodape };
  const partes: string[] = [];
  if (e !== 1) partes.push(String(Math.round(e * 100)));
  if (val.estilo !== VALIDADE_PADRAO.estilo) partes.push(`v${val.estilo}`);
  if (val.posicao !== VALIDADE_PADRAO.posicao) partes.push(`p${val.posicao}`);
  if (val.alinhamento !== VALIDADE_PADRAO.alinhamento) partes.push(`a${val.alinhamento}`);
  if (val.cor !== VALIDADE_PADRAO.cor) partes.push(`c${val.cor}`);
  const rotulo = limparRotulo(val.rotulo);
  if (rotulo) partes.push(`t${encodeURIComponent(rotulo).replace(/~/g, "%7E")}`);
  if (rod.estilo !== RODAPE_PADRAO.estilo) partes.push(`r${rod.estilo}`);
  if (rod.cor !== RODAPE_PADRAO.cor) partes.push(`k${rod.cor}`);
  const texto = limparRodapeTexto(rod.texto);
  if (texto) partes.push(`x${encodeURIComponent(texto).replace(/~/g, "%7E")}`);
  for (const [letra, campo] of [["n", "nome"], ["w", "whatsapp"], ["i", "instagram"], ["h", "horario"]] as const) {
    const val2 = limparCampo(rod[campo], RODAPE_CAMPO_MAX[campo]);
    if (val2) partes.push(`${letra}${encodeURIComponent(val2).replace(/~/g, "%7E")}`);
  }
  const ocultas = RODAPE_PARTES.filter((p) => rod.ocultar?.includes(p));
  if (ocultas.length) partes.push(`m${ocultas.map((p) => RODAPE_PARTE_LETRA[p]).join("")}`);
  if (!slug && partes.length === 0) return null;
  return [slug ?? "", ...partes].join("~");
}
