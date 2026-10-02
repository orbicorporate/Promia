import ExcelJS from "exceljs";

// Leitura da planilha de produtos do mercado.
//
// A planilha real vem do sistema de PDV ou do Excel do dono: CSV com ponto
// e vírgula, acentos em Windows-1252, cabeçalho que não está na primeira
// linha, colunas com nomes livres ("Descrição do Produto", "Preço Venda",
// "Cód. Barras"), preço calculado por fórmula, número no formato brasileiro.
// Tudo isso é resolvido aqui, por regra, sem IA: é rápido, de graça e
// previsível. A tela de revisão mostra o que foi entendido antes de gravar.

export type ProductField = "sku" | "ean" | "name" | "brand" | "category" | "price" | "cost" | "stock" | "unit";

export type ParsedProduct = {
  sku: string;
  ean: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  cost: number | null;
  stock: number | null;
  unit: string | null;
  rowIndex: number; // linha original na planilha (1 = primeira), pra apontar erro
};

export type SkippedRow = { rowIndex: number; reason: string };

export type ParseResult = {
  products: ParsedProduct[];
  skippedRows: SkippedRow[];
  columns: Partial<Record<ProductField, string>>; // campo -> nome da coluna na planilha
  headerRow: number;
  generatedSkus: number; // produtos sem código, que ganharam um código pelo nome
};

export class SpreadsheetError extends Error {}

// limite de linhas por importação (o corpo de uma requisição na Vercel vai
// até ~4,5 MB; a tela envia a gravação em lotes)
export const MAX_ROWS = 15000;

type Cell = string | number | null;

// ---------------------------------------------------------------------
// Cabeçalhos
// ---------------------------------------------------------------------

const STOPWORDS = new Set(["de", "do", "da", "dos", "das", "e", "o", "a"]);

export function normalizeHeader(h: unknown): string {
  return String(h ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w && !STOPWORDS.has(w))
    .join(" ");
}

// A ordem importa: campos mais específicos primeiro, pra "Preço de Custo"
// virar custo (e não preço) e "Código de Barras" virar EAN (e não SKU).
const FIELD_ALIASES: [ProductField, string[]][] = [
  ["ean", ["ean", "ean13", "gtin", "cod barras", "codigo barras", "codbarras", "cod barra", "codigo barra", "barcode", "cod ean", "codigo ean"]],
  ["cost", ["custo", "preco custo", "valor custo", "custo unitario", "custo medio", "vlr custo", "pc custo", "preco compra", "valor compra"]],
  ["price", ["preco", "preco venda", "valor venda", "preco varejo", "preco unitario", "vlr venda", "vl venda", "pv", "valor", "preco final", "venda", "preco atual"]],
  ["sku", ["sku", "codigo", "cod", "cod produto", "codigo produto", "codigo interno", "cod interno", "referencia", "ref", "plu", "id", "id produto", "cod item", "codigo item"]],
  ["name", ["descricao", "descricao produto", "nome produto", "nome", "produto", "mercadoria", "item", "desc produto", "descr", "desc"]],
  ["brand", ["marca", "fabricante"]],
  ["category", ["categoria", "departamento", "depto", "secao", "setor", "grupo", "familia"]],
  ["stock", ["estoque", "qtd", "qtde", "quantidade", "saldo", "estoque atual", "qtd estoque", "saldo estoque"]],
  ["unit", ["unidade", "un", "und", "unid", "medida", "unidade medida", "um"]],
];

// Palavras que, junto de um alias genérico, mudam o sentido da coluna:
// "Valor Total", "Valor Vendido", "Qtd. Vendida", "Qtd. Emb." não são
// preço nem estoque.
const EXCLUDE: Partial<Record<ProductField, string[]>> = {
  price: ["total", "vendido", "vendida", "vendidos", "estoque", "desconto", "margem", "lucro", "imposto", "icms", "ipi", "compra", "custo", "anterior", "antigo"],
  stock: ["vendida", "vendido", "vendas", "venda", "emb", "embalagem", "minimo", "maximo", "min", "max", "pedido", "reservado"],
  name: ["fornecedor", "fabricante", "marca", "categoria", "grupo", "secao"],
};

// Para um cabeçalho, devolve o campo e a força do casamento (menor = melhor):
// casamento exato ganha de prefixo, e alias mais acima na lista ganha.
export function matchHeader(header: unknown): { field: ProductField; rank: number } | null {
  if (String(header ?? "").includes("%")) return null; // "Desc. %", "Margem %"
  const h = normalizeHeader(header);
  if (!h) return null;
  const words = h.split(" ");
  for (const [field, aliases] of FIELD_ALIASES) {
    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i];
      const exact = h === alias;
      if (!exact && !h.startsWith(`${alias} `)) continue;
      if (!exact && (EXCLUDE[field] ?? []).some((w) => words.includes(w))) continue;
      return { field, rank: (exact ? 0 : 100) + i };
    }
  }
  return null;
}

export function fieldForHeader(header: unknown): ProductField | null {
  return matchHeader(header)?.field ?? null;
}

function looksNumeric(v: Cell): boolean {
  if (v == null) return false;
  if (typeof v === "number") return true;
  return /^[\d.,\s-]+$/.test(v.trim());
}

// Escolhe, para cada campo, a coluna que melhor casa. Uma coluna de "nome"
// que só tem números (comum em ERP: "Produto" = código) é descartada.
function mapColumns(header: Cell[], sample: Cell[][]): Partial<Record<ProductField, number>> {
  const candidates = new Map<ProductField, { idx: number; rank: number }[]>();
  header.forEach((cell, idx) => {
    const m = matchHeader(cell);
    if (!m) return;
    const list = candidates.get(m.field) ?? [];
    list.push({ idx, rank: m.rank });
    candidates.set(m.field, list);
  });

  const map: Partial<Record<ProductField, number>> = {};
  const taken = new Set<number>();
  for (const [field] of FIELD_ALIASES) {
    const list = (candidates.get(field) ?? []).filter((c) => !taken.has(c.idx)).sort((a, b) => a.rank - b.rank);
    for (const c of list) {
      if (field === "name") {
        const values = sample.map((r) => r[c.idx]).filter((v) => v != null && String(v).trim() !== "");
        const numeric = values.filter(looksNumeric).length;
        if (values.length > 0 && numeric / values.length > 0.8) continue;
      }
      map[field] = c.idx;
      taken.add(c.idx);
      break;
    }
  }
  return map;
}

// Procura a linha de cabeçalho nas primeiras 20 linhas: a que reconhece
// mais colunas, desde que tenha a coluna do nome do produto.
export function detectHeader(rows: Cell[][]): { index: number; map: Partial<Record<ProductField, number>> } | null {
  let best: { index: number; map: Partial<Record<ProductField, number>>; score: number } | null = null;
  const limit = Math.min(rows.length, 20);
  for (let i = 0; i < limit; i++) {
    const map = mapColumns(rows[i] ?? [], rows.slice(i + 1, i + 31));
    if (map.name === undefined) continue;
    const score = Object.keys(map).length;
    if (!best || score > best.score) best = { index: i, map, score };
  }
  return best ? { index: best.index, map: best.map } : null;
}

// ---------------------------------------------------------------------
// Valores
// ---------------------------------------------------------------------

// Número no formato brasileiro ou americano: "R$ 1.234,56", "12,90",
// "12.90", "1.500" (mil e quinhentos), 12.9 (número de verdade). Quando a
// coluna inteira usa ponto como decimal ("12.90", "69.990" em kg), passe
// dotDecimal e "69.990" vira 69,99.
export function parseBRNumber(raw: unknown, opts: { dotDecimal?: boolean } = {}): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  let s = String(raw).replace(/\s| /g, "").replace(/^R\$/i, "");
  s = s.replace(/[^\d.,-]/g, "");
  if (!s || !/\d/.test(s)) return null;

  const negative = s.startsWith("-");
  s = s.replace(/-/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    s = parts.length > 2 ? parts.join("") : s.replace(",", ".");
  } else if (lastDot !== -1) {
    const parts = s.split(".");
    if (parts.length > 2) {
      s = parts.join("");
    } else if (!opts.dotDecimal && parts[1].length === 3 && parts[0] !== "0" && parts[0].length <= 3) {
      // "1.500" no Brasil é mil e quinhentos
      s = parts.join("");
    }
  }

  const value = Number(s);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

// A coluna usa ponto como separador decimal? (alguma célula como "12.90"
// ou "1,234.56"). Decide uma vez por coluna, não célula a célula.
export function columnUsesDotDecimal(values: Cell[]): boolean {
  return values.some(
    (v) => typeof v === "string" && (/^\s*(R\$)?\s*-?\d+\.\d{1,2}\s*$/.test(v) || /^\s*-?\d{1,3}(,\d{3})+\.\d+\s*$/.test(v))
  );
}

export function normalizeEan(raw: unknown): string | null {
  if (raw == null) return null;
  // "7,89612E+12": o Excel cortou o código; não dá pra recuperar
  if (typeof raw === "string" && /e\+?\d/i.test(raw)) return null;
  const digits = (typeof raw === "number" ? raw.toFixed(0) : String(raw)).replace(/\D/g, "");
  return [8, 12, 13, 14].includes(digits.length) && !/^0+$/.test(digits) ? digits : null;
}

const UNIT_MAP: Record<string, string> = {
  un: "un", und: "un", unid: "un", unidade: "un", pc: "un", peca: "un", uni: "un",
  kg: "kg", kilo: "kg", quilo: "kg", kgs: "kg",
  g: "g", gr: "g", grama: "g", gramas: "g",
  l: "l", lt: "l", litro: "l", litros: "l",
  ml: "ml",
  cx: "cx", caixa: "cx",
  pct: "pct", pacote: "pct", pt: "pct",
  dz: "dz", duzia: "dz",
  bdj: "bdj", bandeja: "bdj",
  fd: "fd", fardo: "fd",
};

export function normalizeUnit(raw: unknown): string | null {
  // aqui "a" e "o" não são palavras soltas, então não usa normalizeHeader
  const key = String(raw ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  return UNIT_MAP[key] ?? key.slice(0, 10);
}

// "Contrafilé Bovino kg" é vendido por quilo; "Arroz 5kg" é um pacote.
export function inferUnitFromName(name: string): string | null {
  return /\bkg\b/i.test(name) && !/\d\s*kg\b/i.test(name) ? "kg" : null;
}

function cleanText(raw: unknown, max: number): string | null {
  if (raw == null) return null;
  const s = (typeof raw === "number" && Number.isInteger(raw) ? raw.toFixed(0) : String(raw))
    .replace(/\s+/g, " ")
    .trim();
  return s ? s.slice(0, max) : null;
}

// "001234" no CSV e 1234 no xlsx são o mesmo produto
export function normalizeSku(raw: unknown): string | null {
  const s = cleanText(raw, 64);
  if (!s) return null;
  if (/^\d+$/.test(s)) return s.replace(/^0+(?=\d)/, "");
  return s;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------
// Leitura do arquivo
// ---------------------------------------------------------------------

export function decodeText(bytes: Uint8Array): string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    // exportação de sistema brasileiro antigo: Windows-1252 (Latin-1)
    text = new TextDecoder("windows-1252").decode(bytes);
  }
  return text.replace(/^﻿/, "");
}

// Aspas só abrem um campo quando são o primeiro caractere dele. No meio do
// texto (TV 32", MANGUEIRA 1/2") são literais e não engolem a linha.
function splitLine(line: string, delimiter: string): number {
  let inQuotes = false;
  let atFieldStart = true;
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') i++;
        else inQuotes = false;
      }
      continue;
    }
    if (c === '"' && atFieldStart) {
      inQuotes = true;
      atFieldStart = false;
    } else if (c === delimiter) {
      count++;
      atFieldStart = true;
    } else {
      atFieldStart = false;
    }
  }
  return count;
}

// Escolhe o separador mais frequente e consistente entre as primeiras
// linhas, ignorando linhas de título sem separador. Empate: ponto e
// vírgula (padrão do Excel no Brasil, onde a vírgula é decimal).
export function detectDelimiter(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim()).slice(0, 15);
  if (lines.length === 0) return ";";
  let best = ";";
  let bestScore = -1;
  for (const d of [";", "\t", "|", ","]) {
    const counts = lines.map((l) => splitLine(l, d)).filter((c) => c > 0);
    if (counts.length < Math.ceil(lines.length / 2)) continue;
    const freq = new Map<number, number>();
    counts.forEach((c) => freq.set(c, (freq.get(c) ?? 0) + 1));
    const [mode, modeCount] = [...freq.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];
    const score = modeCount * 100 + mode;
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

export function parseCsv(text: string, delimiter: string): Cell[][] {
  const rows: Cell[][] = [];
  let row: Cell[] = [];
  let field = "";
  let inQuotes = false;
  let atFieldStart = true;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"' && atFieldStart) {
      inQuotes = true;
      atFieldStart = false;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
      atFieldStart = true;
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      atFieldStart = true;
    } else {
      field += c;
      atFieldStart = false;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.map((r) => r.map((v) => (typeof v === "string" && v.trim() === "" ? null : v)));
}

// Célula do Excel pode ser fórmula, texto rico, link, data ou erro.
export function excelCellValue(v: ExcelJS.CellValue): Cell {
  if (v == null) return null;
  if (typeof v === "number" || typeof v === "string") return v;
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("result" in v) return excelCellValue((v as { result?: ExcelJS.CellValue }).result ?? null);
    if ("richText" in v) return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("");
    if ("text" in v) return String((v as { text: unknown }).text ?? "");
    if ("error" in v) return null;
  }
  return null;
}

export async function readSheetRows(buffer: ArrayBuffer, filename: string): Promise<Cell[][]> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xls")) {
    throw new SpreadsheetError(
      "Arquivos .xls (Excel antigo) não são lidos. Abra no Excel e use Salvar como .xlsx, ou exporte em .csv."
    );
  }
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = decodeText(new Uint8Array(buffer));
    return parseCsv(text, detectDelimiter(text));
  }
  if (!lower.endsWith(".xlsx")) {
    throw new SpreadsheetError("Formato não suportado. Envie .xlsx ou .csv.");
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new SpreadsheetError("Não consegui abrir esse .xlsx. Confira se o arquivo não está corrompido ou protegido por senha.");
  }
  // primeira aba que tenha conteúdo
  const sheet = workbook.worksheets.find((ws) => ws.actualRowCount > 0);
  if (!sheet) return [];
  const rows: Cell[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1).map(excelCellValue);
    rows[rowNumber - 1] = values;
  });
  return Array.from(rows, (r) => r ?? []);
}

// ---------------------------------------------------------------------
// Planilha -> produtos
// ---------------------------------------------------------------------

export function rowsToProducts(rows: Cell[][]): ParseResult {
  const header = detectHeader(rows);
  if (!header) {
    throw new SpreadsheetError(
      "Não achei a coluna com o nome dos produtos. A planilha precisa de uma coluna chamada Produto, Nome ou Descrição."
    );
  }
  if (rows.length - header.index - 1 > MAX_ROWS) {
    throw new SpreadsheetError(`A planilha passa de ${MAX_ROWS.toLocaleString("pt-BR")} produtos. Divida em arquivos menores.`);
  }

  const headerCells = rows[header.index];
  const columns: Partial<Record<ProductField, string>> = {};
  for (const [field, idx] of Object.entries(header.map) as [ProductField, number][]) {
    columns[field] = String(headerCells[idx] ?? "").trim();
  }

  const get = (row: Cell[], field: ProductField) => {
    const idx = header.map[field];
    return idx === undefined ? null : (row[idx] ?? null);
  };

  const dataRows = rows.slice(header.index + 1);
  const dotDecimal = (field: ProductField) => {
    const idx = header.map[field];
    return idx === undefined ? false : columnUsesDotDecimal(dataRows.slice(0, 500).map((r) => r?.[idx] ?? null));
  };
  const dot = { price: dotDecimal("price"), cost: dotDecimal("cost"), stock: dotDecimal("stock") };

  const bySku = new Map<string, ParsedProduct>();
  const skippedRows: SkippedRow[] = [];
  let generatedSkus = 0;

  for (let i = header.index + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowIndex = i + 1;
    const hasAnyValue = row.some((v) => v != null && String(v).trim() !== "");
    if (!hasAnyValue) continue;

    const name = cleanText(get(row, "name"), 200);
    if (!name) {
      skippedRows.push({ rowIndex, reason: "Sem nome do produto." });
      continue;
    }
    if (/^(total|subtotal|soma)\b/i.test(normalizeHeader(name))) {
      skippedRows.push({ rowIndex, reason: "Linha de total." });
      continue;
    }

    const ean = normalizeEan(get(row, "ean"));
    const brand = cleanText(get(row, "brand"), 80);
    let sku = normalizeSku(get(row, "sku"));
    if (!sku && ean) sku = ean;
    if (!sku) {
      sku = `n:${slug(`${name} ${brand ?? ""}`)}`.slice(0, 64);
      generatedSkus++;
    }

    const price = parseBRNumber(get(row, "price"), { dotDecimal: dot.price });
    const cost = parseBRNumber(get(row, "cost"), { dotDecimal: dot.cost });
    const stock = parseBRNumber(get(row, "stock"), { dotDecimal: dot.stock });

    const product: ParsedProduct = {
      sku,
      ean,
      name,
      brand,
      category: cleanText(get(row, "category"), 80),
      price: price != null && price >= 0 && price < 1e7 ? round2(price) : null,
      cost: cost != null && cost >= 0 && cost < 1e7 ? round2(cost) : null,
      stock: stock != null && Math.abs(stock) < 1e9 ? stock : null,
      unit: normalizeUnit(get(row, "unit")) ?? inferUnitFromName(name),
      rowIndex,
    };

    const previous = bySku.get(sku);
    if (previous) {
      skippedRows.push({
        rowIndex: previous.rowIndex,
        reason: `Código ${sku} aparece de novo na linha ${rowIndex}; ficou a linha ${rowIndex}.`,
      });
    }
    bySku.set(sku, product);
  }

  return {
    products: Array.from(bySku.values()),
    skippedRows: skippedRows.sort((a, b) => a.rowIndex - b.rowIndex),
    columns,
    headerRow: header.index + 1,
    generatedSkus,
  };
}

export async function parseProductSpreadsheet(buffer: ArrayBuffer, filename: string): Promise<ParseResult> {
  const rows = await readSheetRows(buffer, filename);
  return rowsToProducts(rows);
}

// Revalida no servidor o que voltou da tela de revisão (o navegador pode
// mandar qualquer coisa). Devolve só produtos válidos, sem SKU repetido.
export function sanitizeProducts(input: unknown): ParsedProduct[] {
  if (!Array.isArray(input)) return [];
  const money = (v: unknown) => {
    const n = typeof v === "number" ? v : parseBRNumber(v);
    return n != null && Number.isFinite(n) && n >= 0 && n < 1e7 ? round2(n) : null;
  };
  const bySku = new Map<string, ParsedProduct>();
  input.slice(0, MAX_ROWS).forEach((raw, i) => {
    if (!raw || typeof raw !== "object") return;
    const r = raw as Record<string, unknown>;
    const name = cleanText(r.name, 200);
    const sku = normalizeSku(r.sku);
    if (!name || !sku) return;
    const stock = typeof r.stock === "number" && Number.isFinite(r.stock) && Math.abs(r.stock) < 1e9 ? r.stock : null;
    bySku.set(sku, {
      sku,
      ean: normalizeEan(r.ean),
      name,
      brand: cleanText(r.brand, 80),
      category: cleanText(r.category, 80),
      price: money(r.price),
      cost: money(r.cost),
      stock,
      unit: r.unit == null ? null : normalizeUnit(r.unit),
      rowIndex: typeof r.rowIndex === "number" ? r.rowIndex : i + 1,
    });
  });
  return Array.from(bySku.values());
}
