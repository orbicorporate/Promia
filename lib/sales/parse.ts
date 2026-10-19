import { columnUsesDotDecimal, normalizeEan, normalizeHeader, normalizeSku, parseBRNumber, readSheetRows, SpreadsheetError } from "@/lib/products";

// Relatório de vendas exportado do sistema de caixa (curva ABC, vendas por
// produto, mapa de vendas). Cada sistema chama as colunas de um jeito:
// aqui só importa achar produto, quantidade vendida e valor vendido.

export type SalesField = "ean" | "sku" | "name" | "qty" | "revenue" | "cost" | "category";
export type SalesRow = { sku: string | null; ean: string | null; name: string; category: string | null; qty: number; revenue: number; cost: number | null };
export type SalesParse = { rows: SalesRow[]; columns: Partial<Record<SalesField, string>>; headerRow: number; skipped: number; period: { de: string; ate: string } | null };

type Cell = string | number | null;

const ALIASES: [SalesField, string[]][] = [
  ["ean", ["ean", "ean13", "gtin", "cod barras", "codigo barras", "codbarras", "cod barra", "codigo barra", "barcode"]],
  ["cost", ["custo total", "cmv", "custo mercadoria vendida", "custo vendido", "custo venda", "total custo", "valor custo", "custo"]],
  ["revenue", ["valor total", "total vendido", "valor vendido", "faturamento", "receita", "venda total", "total venda", "total vendas", "vlr total", "vl total", "valor venda", "total liquido", "venda liquida", "valor liquido", "vendas", "venda", "total"]],
  ["qty", ["qtd vendida", "quantidade vendida", "qtde vendida", "qt vendida", "quant vendida", "qtd venda", "qtde venda", "unidades vendidas", "itens vendidos", "quantidade", "qtd", "qtde", "quant", "volume"]],
  ["sku", ["sku", "codigo", "cod", "cod produto", "codigo produto", "codigo interno", "cod interno", "referencia", "ref", "plu", "id produto", "cod item"]],
  ["name", ["descricao", "descricao produto", "nome produto", "nome", "produto", "mercadoria", "item", "desc produto", "descr"]],
  ["category", ["categoria", "departamento", "depto", "secao", "setor", "grupo", "familia"]],
];
const EXCLUDE: Partial<Record<SalesField, string[]>> = {
  qty: ["estoque", "emb", "embalagem", "minimo", "maximo", "pedido", "compra", "devolvida", "devolucao"],
  revenue: ["custo", "desconto", "imposto", "icms", "lucro", "margem", "compra", "devolucao", "unitario", "medio"],
  name: ["fornecedor", "fabricante", "marca", "categoria", "grupo", "secao"],
};

function match(header: unknown): { field: SalesField; rank: number } | null {
  if (String(header ?? "").includes("%")) return null;
  const h = normalizeHeader(header);
  if (!h) return null;
  const words = h.split(" ");
  for (const [field, aliases] of ALIASES) {
    for (let i = 0; i < aliases.length; i++) {
      const a = aliases[i];
      const exact = h === a;
      if (!exact && !h.startsWith(`${a} `)) continue;
      if (!exact && (EXCLUDE[field] ?? []).some((w) => words.includes(w))) continue;
      return { field, rank: (exact ? 0 : 100) + i };
    }
  }
  return null;
}

function mapColumns(header: Cell[]): Partial<Record<SalesField, number>> {
  const cands: { field: SalesField; idx: number; rank: number }[] = [];
  header.forEach((cell, idx) => {
    const m = match(cell);
    if (m) cands.push({ ...m, idx });
  });
  const map: Partial<Record<SalesField, number>> = {};
  const taken = new Set<number>();
  for (const [field] of ALIASES) {
    const best = cands.filter((c) => c.field === field && !taken.has(c.idx)).sort((a, b) => a.rank - b.rank)[0];
    if (best) {
      map[field] = best.idx;
      taken.add(best.idx);
    }
  }
  return map;
}

// "Período: 01/10/2026 a 07/10/2026" costuma vir no topo do relatório do caixa.
// Só vale quando as duas datas estão juntas na mesma célula (data de emissão sozinha não conta).
function iso(d: string, m: string, y: string): string | null {
  const yy = y.length === 2 ? `20${y}` : y;
  const t = `${yy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const dt = new Date(`${t}T12:00:00Z`);
  return Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== t ? null : t;
}
export function detectPeriod(rows: Cell[][]): { de: string; ate: string } | null {
  for (const r of rows.slice(0, 20)) {
    for (const c of r ?? []) {
      if (typeof c !== "string") continue;
      const m = c.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})\D{1,12}?(\d{1,2})[/.-](\d{1,2})[/.-](\d{4}|\d{2})/);
      if (!m) continue;
      const de = iso(m[1], m[2], m[3]);
      const ate = iso(m[4], m[5], m[6]);
      if (de && ate && de <= ate && (new Date(ate).getTime() - new Date(de).getTime()) / 864e5 <= 400) return { de, ate };
    }
  }
  return null;
}

export function rowsToSales(rows: Cell[][]): SalesParse {
  let best: { index: number; map: Partial<Record<SalesField, number>>; score: number } | null = null;
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const map = mapColumns(rows[i] ?? []);
    if (map.name === undefined && map.sku === undefined) continue;
    if (map.qty === undefined && map.revenue === undefined) continue;
    const score = Object.keys(map).length;
    if (!best || score > best.score) best = { index: i, map, score };
  }
  if (!best) {
    const vistas = (rows.slice(0, 25).find((r) => (r ?? []).filter((c) => c != null && String(c).trim() !== "").length >= 3) ?? []).filter((c) => c != null && String(c).trim() !== "").slice(0, 8).map((c) => String(c).trim()).join(", ");
    throw new SpreadsheetError(`Não achei as colunas do relatório. Ele precisa ter o produto (nome ou código) e a quantidade ou o valor vendido.${vistas ? ` Colunas que vi: ${vistas}.` : ""} Se o seu caixa usa outros nomes, baixe o modelo e cole os dados nele.`);
  }
  const { index, map } = best;
  const body = rows.slice(index + 1);
  const dot = (f: SalesField) => (map[f] === undefined ? false : columnUsesDotDecimal(body.slice(0, 300).map((r) => r[map[f]!] ?? null)));
  const dots = { qty: dot("qty"), revenue: dot("revenue"), cost: dot("cost") };
  const get = (r: Cell[], f: SalesField) => (map[f] === undefined ? null : (r[map[f]!] ?? null));

  const out: SalesRow[] = [];
  let skipped = 0;
  for (const r of body) {
    const rawName = get(r, "name");
    const name = rawName == null ? "" : String(rawName).replace(/\s+/g, " ").trim();
    const sku = normalizeSku(get(r, "sku"));
    if (!name && !sku) continue;
    if (/^(sub)?total\b|^total geral/i.test(name)) continue;
    const qty = parseBRNumber(get(r, "qty"), { dotDecimal: dots.qty }) ?? 0;
    const revenue = parseBRNumber(get(r, "revenue"), { dotDecimal: dots.revenue }) ?? 0;
    if (qty <= 0 && revenue <= 0) {
      skipped++;
      continue;
    }
    const cost = parseBRNumber(get(r, "cost"), { dotDecimal: dots.cost });
    const cat = get(r, "category");
    out.push({
      sku,
      ean: normalizeEan(get(r, "ean")),
      name: (name || sku || "").slice(0, 200),
      category: cat == null ? null : String(cat).trim().slice(0, 80) || null,
      qty: Math.round(qty * 1000) / 1000,
      revenue: Math.round(revenue * 100) / 100,
      cost: cost == null ? null : Math.round(cost * 100) / 100,
    });
    if (out.length >= 20000) break;
  }
  const columns: Partial<Record<SalesField, string>> = {};
  for (const [f, idx] of Object.entries(map) as [SalesField, number][]) columns[f] = String(rows[index][idx] ?? "");
  return { rows: out, columns, headerRow: index, skipped, period: detectPeriod(rows.slice(0, index + 1)) };
}

export async function parseSalesSpreadsheet(buffer: ArrayBuffer, filename: string): Promise<SalesParse> {
  return rowsToSales(await readSheetRows(buffer, filename));
}
