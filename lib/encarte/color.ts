// Contas de cor do encarte: contraste WCAG e escolha de texto claro/escuro
// sobre uma cor qualquer (a cor da marca do mercado vem do cadastro e pode
// ser qualquer coisa).

export const TEXT_LIGHT = "#FFFFFF";
export const TEXT_DARK = "#17130F";

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

// "#abc" -> "#AABBCC"; inválida -> null
export function normalizeHex(value: string | null | undefined): string | null {
  if (!isHexColor(value)) return null;
  let hex = value.trim().slice(1);
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return `#${hex.toUpperCase()}`;
}

function rgb(hex: string): [number, number, number] {
  const h = normalizeHex(hex) ?? "#000000";
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// texto branco ou escuro, o que tiver mais contraste com o fundo
export function pickTextColor(bg: string, light = TEXT_LIGHT, dark = TEXT_DARK): string {
  return contrastRatio(bg, light) >= contrastRatio(bg, dark) ? light : dark;
}

// mistura linear entre duas cores (t = 0 -> a, t = 1 -> b)
export function mix(a: string, b: string, t: number): string {
  const ca = rgb(a);
  const cb = rgb(b);
  const out = ca.map((v, i) => Math.round(v + (cb[i] - v) * Math.min(1, Math.max(0, t))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

// rgba() a partir de hex, para sombras e camadas translúcidas
export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
