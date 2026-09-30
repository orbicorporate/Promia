import ExcelJS from "exceljs";
import { Readable } from "node:stream";

// Uma linha de produto já normalizada, pronta pra gravar na tabela
// `products`. A planilha que o dono do mercado sobe é bagunçada por
// natureza (nome de coluna varia, preço em formato variado, categoria às
// vezes ausente), então essa normalização faz o trabalho pesado uma vez só,
// no upload, em vez de espalhar isso pelo resto do app.
export type ParsedProduct = {
  sku: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  rowIndex: number; // linha original na planilha, útil pra apontar erro
};

export type ParseResult = {
  products: ParsedProduct[];
  skippedRows: { rowIndex: number; reason: string }[];
};

// nomes de coluna aceitos por campo, em português livre e variações comuns
// (maiúscula/minúscula e acento são normalizados antes de comparar).
const COLUMN_ALIASES: Record<keyof Omit<ParsedProduct, "rowIndex">, string[]> = {
  sku: ["sku", "codigo", "cod", "codigo produto", "cod produto"],
  name: ["produto", "nome", "descricao", "nome produto", "item"],
  brand: ["marca", "fabricante"],
  category: ["categoria", "departamento", "secao", "seção", "setor"],
  price: ["preco", "preço", "valor", "preco de venda", "preço de venda"],
  stock: ["estoque", "qtd", "quantidade", "saldo"],
};

function normalizeHeader(h: string): string {
  return h
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const idx = normalized.indexOf(normalizeHeader(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// aceita "12,90", "R$ 12,90", "12.90", "1.234,56" etc.
function parsePrice(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return raw;
  const cleaned = String(raw)
    .replace(/[^\d,.-]/g, "")
    .trim();
  if (!cleaned) return null;
  // se tem vírgula E ponto, assume formato BR (ponto = milhar, vírgula = decimal)
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    normalized = cleaned.replace(",", ".");
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function parseStock(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const value = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(value) ? value : null;
}

// lê um .xlsx ou .csv (buffer já em memória, baixado do Storage) e devolve
// a lista de produtos normalizada. Linhas sem nome de produto ou sem
// nenhuma coluna reconhecível de preço são ignoradas e reportadas em
// `skippedRows`, em vez de derrubar a importação inteira.
export async function parseProductSpreadsheet(buffer: ArrayBuffer, filename: string): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();

  if (filename.toLowerCase().endsWith(".csv")) {
    await workbook.csv.read(bufferToStream(buffer));
  } else {
    await workbook.xlsx.load(buffer);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { products: [], skippedRows: [] };
  }

  const headerRow = sheet.getRow(1).values as unknown[];
  const headers = headerRow.slice(1).map((h) => (h == null ? "" : String(h)));

  const colSku = findColumnIndex(headers, COLUMN_ALIASES.sku);
  const colName = findColumnIndex(headers, COLUMN_ALIASES.name);
  const colBrand = findColumnIndex(headers, COLUMN_ALIASES.brand);
  const colCategory = findColumnIndex(headers, COLUMN_ALIASES.category);
  const colPrice = findColumnIndex(headers, COLUMN_ALIASES.price);
  const colStock = findColumnIndex(headers, COLUMN_ALIASES.stock);

  const products: ParsedProduct[] = [];
  const skippedRows: { rowIndex: number; reason: string }[] = [];

  sheet.eachRow((row, rowIndex) => {
    if (rowIndex === 1) return; // header

    const values = row.values as unknown[];
    const get = (col: number) => (col === -1 ? undefined : values[col + 1]);

    const name = get(colName);
    if (!name || String(name).trim() === "") {
      // linha vazia ou sem nome de produto: ignora silenciosamente (comum
      // em planilha com linhas em branco no meio)
      const hasAnyValue = values.slice(1).some((v) => v != null && String(v).trim() !== "");
      if (hasAnyValue) {
        skippedRows.push({ rowIndex, reason: "Sem nome de produto identificável nessa linha." });
      }
      return;
    }

    const sku = get(colSku);
    products.push({
      sku: sku ? String(sku).trim() : `linha-${rowIndex}`,
      name: String(name).trim(),
      brand: get(colBrand) ? String(get(colBrand)).trim() : null,
      category: get(colCategory) ? String(get(colCategory)).trim() : null,
      price: parsePrice(get(colPrice)),
      stock: parseStock(get(colStock)),
      rowIndex,
    });
  });

  return { products, skippedRows };
}

function bufferToStream(buffer: ArrayBuffer) {
  return Readable.from(Buffer.from(buffer));
}
