import { describe, expect, it } from "vitest";
import { contrastRatio, normalizeHex, pickTextColor } from "@/lib/encarte/color";
import { getTheme, isThemeKey, resolveThemeColors, suggestThemeKeys, themeForCategory, themeForSeasonalTitle, THEMES, THEME_KEYS } from "@/lib/encarte/themes";
import { seasonalDatesForYear } from "@/lib/seasonalDates";

describe("catálogo de temas", () => {
  it("tem pelo menos 12 temas com chaves únicas", () => {
    expect(THEMES.length).toBeGreaterThanOrEqual(12);
    expect(new Set(THEME_KEYS).size).toBe(THEMES.length);
    for (const key of ["ofertas", "fim-de-semana", "hortifruti", "acougue", "padaria", "bebidas", "limpeza", "dia-das-criancas", "dia-das-maes", "dia-dos-pais", "pascoa", "festa-junina", "black-friday", "natal", "aniversario"]) {
      expect(isThemeKey(key)).toBe(true);
    }
  });

  it("toda cor da paleta é hexadecimal válida", () => {
    for (const t of THEMES) for (const [name, color] of Object.entries(t.palette)) expect(normalizeHex(color), `${t.key}.${name}`).not.toBeNull();
  });

  it.each(THEMES.map((t) => [t.key, t] as const))("%s: contraste mínimo 4.5:1 nos textos", (_key, t) => {
    const p = t.palette;
    expect(contrastRatio(p.tagBg, p.tagText), "etiqueta x preço").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.headerBg, p.headerText), "faixa do título x texto").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.brandBg, p.brandText), "barra da marca x texto").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.card, p.cardText), "cartão x nome").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.card, p.cardMuted), "cartão x texto secundário").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.card, p.oldPrice), "cartão x preço 'de'").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.accent, p.accentText), "selo/validade").toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(p.bg, p.bgText), "fundo x texto").toBeGreaterThanOrEqual(4.5);
  });

  it("chave desconhecida cai no tema padrão", () => {
    expect(getTheme("nao-existe").key).toBe("ofertas");
    expect(getTheme(null).key).toBe("ofertas");
  });
});

describe("cor da marca do mercado", () => {
  it("entra na barra e no rodapé com texto de contraste", () => {
    const theme = getTheme("hortifruti");
    const amarelo = resolveThemeColors(theme, { colorPrimary: "#FFD600" });
    expect(amarelo.brandBg).toBe("#FFD600");
    expect(amarelo.brandText).not.toBe("#FFFFFF");
    expect(contrastRatio(amarelo.brandBg, amarelo.brandText)).toBeGreaterThanOrEqual(4.5);
    const azul = resolveThemeColors(theme, { colorPrimary: "#0a2a6b" });
    expect(azul.brandBg).toBe("#0A2A6B");
    expect(azul.brandText).toBe("#FFFFFF");
    // o clima continua sendo do tema
    expect(azul.headerBg).toBe(theme.palette.headerBg);
    expect(azul.tagBg).toBe(theme.palette.tagBg);
  });

  it("cor inválida ou ausente usa a do tema", () => {
    const theme = getTheme("ofertas");
    expect(resolveThemeColors(theme, { colorPrimary: "vermelho" }).brandBg).toBe(theme.palette.brandBg);
    expect(resolveThemeColors(theme, {}).brandText).toBe(theme.palette.brandText);
  });

  it("pickTextColor escolhe o lado de maior contraste", () => {
    for (const bg of ["#000000", "#FFFFFF", "#FFD600", "#1B5E20", "#E53935", "#808080", "#00B3E6"]) {
      const fg = pickTextColor(bg);
      const other = fg === "#FFFFFF" ? "#17130F" : "#FFFFFF";
      expect(contrastRatio(bg, fg)).toBeGreaterThanOrEqual(contrastRatio(bg, other));
    }
  });
});

describe("sugestão de temas", () => {
  it("casa títulos de datas sazonais", () => {
    expect(themeForSeasonalTitle("Páscoa")?.key).toBe("pascoa");
    expect(themeForSeasonalTitle("Dia das Mães")?.key).toBe("dia-das-maes");
    expect(themeForSeasonalTitle("Dia dos Pais")?.key).toBe("dia-dos-pais");
    expect(themeForSeasonalTitle("Dia das Crianças")?.key).toBe("dia-das-criancas");
    expect(themeForSeasonalTitle("Festa Junina (São João)")?.key).toBe("festa-junina");
    expect(themeForSeasonalTitle("Black Friday")?.key).toBe("black-friday");
    expect(themeForSeasonalTitle("Cyber Monday")?.key).toBe("black-friday");
    expect(themeForSeasonalTitle("Natal")?.key).toBe("natal");
    expect(themeForSeasonalTitle("Réveillon")).not.toBeNull();
    expect(themeForSeasonalTitle("Dia do Cliente")?.key).toBe("ofertas");
    expect(themeForSeasonalTitle("Dia do Professor")).toBeNull();
  });

  it("toda data sazonal universal do calendário tem um tema", () => {
    for (const d of seasonalDatesForYear(2026).filter((x) => x.universal)) {
      expect(themeForSeasonalTitle(d.title), d.title).not.toBeNull();
    }
  });

  it("casa categorias de produto e promoções do dia", () => {
    expect(themeForCategory("Açougue")?.key).toBe("acougue");
    expect(themeForCategory("Dia da Carne")?.key).toBe("acougue");
    expect(themeForCategory("Hortifrúti")?.key).toBe("hortifruti");
    expect(themeForCategory("FLV")?.key).toBe("hortifruti");
    expect(themeForCategory("Padaria")?.key).toBe("padaria");
    expect(themeForCategory("Bebidas")?.key).toBe("bebidas");
    expect(themeForCategory("Limpeza")?.key).toBe("limpeza");
    expect(themeForCategory("Higiene")?.key).toBe("limpeza");
    expect(themeForCategory("Feirão de Fim de Semana")?.key).toBe("fim-de-semana");
    expect(themeForCategory("Laticínios")).toBeNull();
  });

  it("ordena: datas, depois categorias mais frequentes, e o padrão no fim", () => {
    const keys = suggestThemeKeys({
      seasonalTitles: ["Dia das Crianças"],
      categories: ["Açougue", "Bebidas", "Açougue", null, "Laticínios", "Açougue", "Bebidas", "Hortifruti"],
    });
    expect(keys).toEqual(["dia-das-criancas", "acougue", "bebidas", "hortifruti", "ofertas"]);
  });

  it("sem nada, sugere o padrão", () => {
    expect(suggestThemeKeys({})).toEqual(["ofertas"]);
  });
});
