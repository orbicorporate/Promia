import { FONT_WIDTHS, METRIC_CHARS, type FontVariant } from "./fontMetrics";

// Utilitários de texto do encarte. O Satori não faz line-clamp confiável,
// então a quebra em linhas é calculada aqui, por número de caracteres ou
// pela largura real medida com as métricas das fontes (fontMetrics.ts), e
// cada linha é desenhada separada, sem quebra automática.

const charIndex = new Map(Array.from(METRIC_CHARS).map((ch, i) => [ch, i]));

// largura do texto em px (sem kerning; caractere desconhecido conta 0,6 em)
export function measureText(text: string, variant: FontVariant, fontSize: number, letterSpacing = 0): number {
  const widths = FONT_WIDTHS[variant];
  let total = 0;
  let n = 0;
  for (const ch of text) {
    const i = charIndex.get(ch);
    total += i == null ? 600 : widths[i];
    n++;
  }
  return (total / 1000) * fontSize + letterSpacing * Math.max(0, n - 1);
}

// Quebra por palavra em até maxLines linhas, usando `fits` para saber se
// uma linha cabe. Se sobrar texto, a última linha termina em "…". Palavra
// que sozinha não cabe é cortada.
export function wrapText(text: string, fits: (line: string) => boolean, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean || maxLines < 1) return [];
  const cut = (word: string) => {
    let w = word;
    while (w.length > 1 && !fits(`${w}…`)) w = w.slice(0, -1);
    return `${w}…`;
  };
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";
  let i = 0;
  for (; i < words.length; i++) {
    const word = fits(words[i]) ? words[i] : cut(words[i]);
    const candidate = current ? `${current} ${word}` : word;
    if (fits(candidate)) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
    i = words.length;
  }
  if (i < words.length && lines.length > 0) {
    let last = lines[lines.length - 1];
    while (!fits(`${last}…`) && last.includes(" ")) last = last.slice(0, last.lastIndexOf(" "));
    while (!fits(`${last}…`) && last.length > 1) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last.replace(/[\s,.;:-]+$/, "")}…`;
  }
  return lines;
}

// por número de caracteres
export function wrapLines(text: string, maxChars: number, maxLines: number): string[] {
  const limit = Math.max(4, Math.floor(maxChars));
  return wrapText(text, (line) => line.length <= limit, maxLines);
}

// pela largura real do texto na fonte
export function wrapMeasured(text: string, maxWidth: number, variant: FontVariant, fontSize: number, maxLines: number, letterSpacing = 0): string[] {
  return wrapText(text, (line) => measureText(line, variant, fontSize, letterSpacing) <= maxWidth, maxLines);
}

export function clip(text: string | null | undefined, max: number): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function ddmm(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}` : null;
}

// "Ofertas válidas de 03/10 a 09/10" | "Ofertas válidas até 09/10" |
// "Ofertas válidas a partir de 03/10" | null
export function validityLabel(from: string | null | undefined, until: string | null | undefined): string | null {
  const f = from ? ddmm(from) : null;
  const u = until ? ddmm(until) : null;
  if (f && u) return f === u ? `Oferta válida somente em ${f}` : `Ofertas válidas de ${f} a ${u}`;
  if (u) return `Ofertas válidas até ${u}`;
  if (f) return `Ofertas válidas a partir de ${f}`;
  return null;
}

// "Encarte Semana 40!" -> "encarte-semana-40"
export function slugify(value: string, fallback = "encarte"): string {
  const slug = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || fallback;
}

export const DEFAULT_LEGAL_NOTE =
  "Imagens meramente ilustrativas. Ofertas válidas enquanto durarem os estoques. Reservamo-nos o direito de limitar quantidades.";
