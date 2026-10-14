// Tamanho do logo (emblema) no encarte. O fator multiplica o tamanho que o
// motor escolheu sozinho, sempre mantendo a proporção do desenho. Fica
// guardado junto do slug no campo `emblema` do banco ("slug~120" = 120%),
// então não precisa de coluna nova; 100% grava só o slug, como antes.

export const EMBLEMA_ESCALA_MIN = 0.6;
export const EMBLEMA_ESCALA_MAX = 1.6;
export const EMBLEMA_ESCALA_PASSO = 0.05;

export function clampEscala(v: unknown): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 1;
  return Math.round(Math.min(EMBLEMA_ESCALA_MAX, Math.max(EMBLEMA_ESCALA_MIN, n)) * 100) / 100;
}

export function lerEmblema(raw: string | null | undefined): { slug: string | null; escala: number } {
  if (!raw) return { slug: null, escala: 1 };
  const [slug, pct] = raw.split("~");
  const n = pct ? Number(pct) / 100 : 1;
  return { slug: slug || null, escala: clampEscala(n) };
}

export function juntarEmblema(slug: string | null, escala: number): string | null {
  if (!slug) return null;
  const e = clampEscala(escala);
  return e === 1 ? slug : `${slug}~${Math.round(e * 100)}`;
}
