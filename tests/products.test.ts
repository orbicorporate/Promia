import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  parseProductSpreadsheet,
  parseBRNumber,
  fieldForHeader,
  sanitizeProducts,
  inferUnitFromName,
  normalizeEan,
  SpreadsheetError,
} from "@/lib/products";

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

// Windows-1252 de verdade: acentos viram 1 byte (não é UTF-8 válido)
function win1252(s: string): ArrayBuffer {
  const bytes = Array.from(s, (ch) => {
    const code = ch.charCodeAt(0);
    if (code > 255) throw new Error("fora do latin-1");
    return code;
  });
  return new Uint8Array(bytes).buffer;
}

async function xlsx(build: (ws: ExcelJS.Worksheet) => void): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  build(wb.addWorksheet("Plan1"));
  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

describe("parseBRNumber", () => {
  it.each([
    ["12,90", 12.9],
    ["R$ 1.234,56", 1234.56],
    ["12.90", 12.9],
    ["1.500", 1500],
    ["0.500", 0.5],
    ["1,234.56", 1234.56],
    ["12,5", 12.5],
    [" R$ 7,49 ", 7.49],
    [27.9, 27.9],
    ["", null],
    ["abc", null],
    [null, null],
  ])("%s -> %s", (raw, expected) => {
    expect(parseBRNumber(raw)).toBe(expected);
  });
});

describe("cabeçalhos", () => {
  it.each([
    ["Descrição do Produto", "name"],
    ["Preço Venda", "price"],
    ["Preço de Custo", "cost"],
    ["Cód. Barras", "ean"],
    ["Código de Barras", "ean"],
    ["Código", "sku"],
    ["Cod. Produto", "sku"],
    ["Valor", "price"],
    ["Valor Custo", "cost"],
    ["Qtde", "stock"],
    ["UN", "unit"],
    ["Seção", "category"],
    ["Observação", null],
  ])("%s -> %s", (header, field) => {
    expect(fieldForHeader(header)).toBe(field);
  });
});

describe("planilha de PDV em CSV", () => {
  it("lê ponto e vírgula, Windows-1252, cabeçalho fora da primeira linha e número brasileiro", async () => {
    const csv = [
      "Relatório de produtos;;;;;",
      "Emitido em 01/10/2026;;;;;",
      "Código;Descrição;Seção;Preço Venda;Preço Custo;Estoque",
      "1001;Feijão Carioca 1kg;Mercearia;8,49;6,10;200",
      "1002;Açúcar Refinado 1kg;Mercearia;4,79;3,50;1.500",
      ";;;;;",
      "1003;;Mercearia;3,00;;",
    ].join("\r\n");
    const r = await parseProductSpreadsheet(win1252(csv), "export.csv");
    expect(r.headerRow).toBe(3);
    expect(r.products).toHaveLength(2);
    expect(r.products[0]).toMatchObject({ sku: "1001", name: "Feijão Carioca 1kg", category: "Mercearia", price: 8.49, cost: 6.1, stock: 200 });
    expect(r.products[1]).toMatchObject({ name: "Açúcar Refinado 1kg", stock: 1500 });
    expect(r.skippedRows).toEqual([{ rowIndex: 7, reason: "Sem nome do produto." }]);
    expect(r.columns).toMatchObject({ sku: "Código", name: "Descrição", price: "Preço Venda", cost: "Preço Custo" });
  });

  it("lê CSV com vírgula e preço entre aspas", async () => {
    const csv = 'produto,preco,ean\n"Leite Integral 1L","4,99",7891234567895\n';
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products[0]).toMatchObject({ name: "Leite Integral 1L", price: 4.99, ean: "7891234567895", sku: "7891234567895" });
  });

  it("código repetido fica com a última linha e avisa", async () => {
    const csv = "codigo;produto;preco\n10;Arroz;20,00\n10;Arroz Tipo 1;21,00\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products).toHaveLength(1);
    expect(r.products[0]).toMatchObject({ name: "Arroz Tipo 1", price: 21 });
    expect(r.skippedRows[0].rowIndex).toBe(2);
  });

  it("sem coluna de código, o código vem do nome (estável quando a ordem muda)", async () => {
    const a = await parseProductSpreadsheet(enc("produto;marca\nArroz 5kg;Camil\nFeijão;Kicaldo\n"), "a.csv");
    const b = await parseProductSpreadsheet(enc("produto;marca\nFeijão;Kicaldo\nArroz 5kg;Camil\n"), "b.csv");
    const skus = (r: typeof a) => Object.fromEntries(r.products.map((p) => [p.name, p.sku]));
    expect(skus(a)).toEqual(skus(b));
    expect(a.generatedSkus).toBe(2);
    expect(a.products[0].sku).toBe("n:arroz-5kg-camil");
  });

  it("sem coluna de nome, explica o que falta", async () => {
    await expect(parseProductSpreadsheet(enc("codigo;preco\n1;2\n"), "x.csv")).rejects.toBeInstanceOf(SpreadsheetError);
  });

  it("recusa .xls com instrução de como resolver", async () => {
    await expect(parseProductSpreadsheet(enc("x"), "antigo.xls")).rejects.toThrow(/Salvar como \.xlsx/);
  });
});

describe("planilha .xlsx", () => {
  it("lê fórmula, texto rico e número como código", async () => {
    const buf = await xlsx((ws) => {
      ws.addRow(["Cod", "Produto", "Preço"]);
      ws.addRow([7891000100103, { richText: [{ text: "Café " }, { text: "Pilão 500g" }] }, { formula: "10+9.9", result: 19.9 }]);
    });
    const r = await parseProductSpreadsheet(buf, "x.xlsx");
    expect(r.products[0]).toMatchObject({ sku: "7891000100103", name: "Café Pilão 500g", price: 19.9 });
  });

  it("lê a planilha de teste dos 40 produtos", async () => {
    const file = readFileSync(path.join(__dirname, "fixtures/produtos-teste-promia.xlsx"));
    const r = await parseProductSpreadsheet(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) as ArrayBuffer, "produtos-teste-promia.xlsx");
    expect(r.products).toHaveLength(40);
    expect(r.skippedRows).toHaveLength(0);
    const picanha = r.products.find((p) => p.name === "Contrafilé Bovino kg");
    expect(picanha).toMatchObject({ unit: "kg", category: "Açougue", price: 54.9 });
    expect(r.products.find((p) => p.name.startsWith("Arroz"))?.unit).toBeNull();
  });
});

describe("pequenas regras", () => {
  it("unidade por quilo só quando não é tamanho de pacote", () => {
    expect(inferUnitFromName("Pão Francês kg")).toBe("kg");
    expect(inferUnitFromName("Arroz Branco 5kg")).toBeNull();
    expect(inferUnitFromName("Arroz Branco 5 kg")).toBeNull();
  });

  it("EAN só com tamanho válido", () => {
    expect(normalizeEan("789-1000-1001-03")).toBe("7891000100103");
    expect(normalizeEan("123")).toBeNull();
    expect(normalizeEan("0000000000000")).toBeNull();
  });

  it("revalida no servidor o que vem do navegador", () => {
    const out = sanitizeProducts([
      { sku: "1", name: "  Arroz  ", price: "12,90", stock: 5, unit: "KG" },
      { sku: "1", name: "Arroz repetido", price: 13 },
      { sku: "", name: "sem código" },
      { sku: "2", name: "Preço negativo", price: -3 },
      "lixo",
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ sku: "1", name: "Arroz repetido", price: 13 });
    expect(out[1]).toMatchObject({ sku: "2", price: null });
  });
});

describe("casos de ERP apontados na revisão", () => {
  it("aspas no meio do nome (polegadas) não engolem as linhas seguintes", async () => {
    const csv = 'codigo;descricao;preco\n1;MANGUEIRA 1/2" 10M;25,90\n2;ARROZ 5KG;27,90\n3;TV 32" LED;999,00\n';
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products.map((p) => p.name)).toEqual(['MANGUEIRA 1/2" 10M', "ARROZ 5KG", 'TV 32" LED']);
    expect(r.products[0].price).toBe(25.9);
  });

  it("EAN em notação científica não vira código", async () => {
    const csv = "descricao;ean;preco\nArroz;7,89612E+12;27,90\nFeijão;7,89612E+12;8,49\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products).toHaveLength(2);
    expect(r.products.every((p) => p.ean === null)).toBe(true);
  });

  it("coluna Produto com código e Descrição com o nome", async () => {
    const csv = "Produto;Descrição;Preço\n1001;Feijão Carioca;8,49\n1002;Arroz;27,90\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products.map((p) => p.name)).toEqual(["Feijão Carioca", "Arroz"]);
  });

  it("Desc. % não vira nome; Valor Estoque não vira preço", async () => {
    const csv = "Código;Desc. %;Descrição;Valor Estoque;Preço Venda;Qtd Vendida;Estoque\n1;0;Leite;259,00;4,99;30;52\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products[0]).toMatchObject({ name: "Leite", price: 4.99, stock: 52 });
  });

  it("coluna com ponto decimal: 69.990 em kg é 69,99", async () => {
    const csv = "descricao,preco\nPicanha kg,69.990\nAlcatra kg,49.90\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products.map((p) => p.price)).toEqual([69.99, 49.9]);
  });

  it("título antes do cabeçalho em CSV com vírgula e rodapé de total", async () => {
    const csv = "Relatório de estoque\ncodigo,descricao,preco\n1,Leite,4.99\n2,Café,19.90\nTOTAL GERAL,,24.89\n";
    const r = await parseProductSpreadsheet(enc(csv), "x.csv");
    expect(r.products.map((p) => p.name)).toEqual(["Leite", "Café"]);
  });

  it("código 001234 e 1234 são o mesmo produto", async () => {
    const r = await parseProductSpreadsheet(enc("codigo;descricao\n001234;Leite\n1234;Leite 1L\n"), "x.csv");
    expect(r.products).toHaveLength(1);
    expect(r.products[0]).toMatchObject({ sku: "1234", name: "Leite 1L" });
  });
});
