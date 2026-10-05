// Chave estável para o nome de um produto: a mesma para "Leite Italac 1L",
// "LEITE ITALAC 1 L" e "leite italac 1l". Usada pela memória de fotos por
// nome, compartilhada entre mercados.

const STOP = new Set(["de", "da", "do", "das", "dos", "com", "c", "e", "a", "o", "em", "para", "tipo", "tp", "un", "und", "unid", "unidade"]);

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/(\d)[,.](\d)/g, "$1.$2")
    .replace(/(\d)\s+(kg|g|gr|ml|l|lt|lts|un)\b/g, "$1$2")
    .replace(/\b(\d+(?:\.\d+)?)(gr)\b/g, "$1g")
    .replace(/\b(\d+(?:\.\d+)?)(lt|lts)\b/g, "$1l")
    .replace(/[^a-z0-9.]+/g, " ")
    .trim();
}

export function photoKey(name: string, brand?: string | null): string {
  const tokens = normalizeName(`${name} ${brand ?? ""}`)
    .split(" ")
    .filter((t) => t && !STOP.has(t));
  // ordem não importa ("Italac leite 1l" = "leite italac 1l"); repetição também não
  return [...new Set(tokens)].sort().join(" ");
}
