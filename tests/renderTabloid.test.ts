import { describe, expect, it } from "vitest";
import { renderTabloidHtml, safeImageUrl, safeColor, EMPTY_IMAGE, formatPrice } from "@/lib/renderTabloid";

const template =
  '<div style="border-color:%%COR_PRIMARIA%%"><img src="%%LOGO_URL%%"><h1>%%NOME_MERCADO%%</h1>' +
  '<!--PRODUTOS_INICIO--><p style="color:%%COR_PRIMARIA%%"><img src="%%PRODUTO_IMAGEM_URL%%">%%PRODUTO_NOME%% %%PRODUTO_PRECO%%</p><!--PRODUTOS_FIM--></div>';

const market = {
  name: "Mercado <Bom> & Barato",
  logoUrl: null,
  colorPrimary: "#e30613",
  colorSecondary: null,
  tabloidName: "Ofertas",
  validityLabel: "",
};

describe("renderTabloidHtml", () => {
  it("escapa texto e preenche os tokens do mercado dentro do bloco do produto", () => {
    const html = renderTabloidHtml(template, market, [
      { name: 'Leite "integral" <b>', price: 4.99, imageUrl: "https://cdn.exemplo.com/leite.png", category: null },
    ]);
    expect(html).toContain("Mercado &lt;Bom&gt; &amp; Barato");
    expect(html).toContain("Leite &quot;integral&quot; &lt;b&gt;");
    expect(html).toContain('<p style="color:#e30613">');
    expect(html).toContain('src="https://cdn.exemplo.com/leite.png"');
    expect(html).not.toContain("%%");
  });

  it("um nome de produto com cara de token não é reprocessado", () => {
    const html = renderTabloidHtml(template, market, [{ name: "%%NOME_MERCADO%%", price: 1, imageUrl: null, category: null }]);
    expect(html).toContain(">%%NOME_MERCADO%% R$");
  });

  it("logo ausente vira imagem vazia, não ícone quebrado", () => {
    expect(renderTabloidHtml(template, market, [])).toContain(`src="${EMPTY_IMAGE}"`);
  });
});

describe("valores perigosos", () => {
  it.each([
    ["javascript:alert(1)", EMPTY_IMAGE],
    ["http://sem-https.com/a.png", EMPTY_IMAGE],
    ['https://x.com/a.png" onerror="alert(1)', "https://x.com/a.png%22%20onerror=%22alert(1)"],
    ["nao é url", EMPTY_IMAGE],
  ])("url %s", (url, expected) => {
    expect(safeImageUrl(url)).toBe(expected);
  });

  it("cor só passa se for hexadecimal", () => {
    expect(safeColor("#abc", "#000")).toBe("#abc");
    expect(safeColor("red;background:url(x)", "#000")).toBe("#000");
    expect(safeColor(null, "#111")).toBe("#111");
  });

  it("preço com unidade", () => {
    expect(formatPrice(54.9, "kg")).toMatch(/54,90\/kg$/);
    expect(formatPrice(4.99, "un")).not.toContain("/");
    expect(formatPrice(null)).toBe("Consulte");
  });
});
