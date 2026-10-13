import { describe, expect, it } from "vitest";
import { emblemaPorSlug } from "@/lib/emblemas/catalog";
import { isEncarteFundo, isEncarteModelo } from "@/lib/encarte/types";
import { isThemeKey } from "@/lib/encarte/themes";
import { TEMAS_PRONTOS, VISUAIS_PRONTOS } from "@/lib/encarte/prontos";

describe("combinações prontas", () => {
  it("só usa logo, fundo, caixa e tema que existem", () => {
    for (const v of VISUAIS_PRONTOS) {
      expect(emblemaPorSlug(v.emblema), v.slug).toBeTruthy();
      expect(isEncarteFundo(v.fundo), `${v.slug} fundo ${v.fundo}`).toBe(true);
      expect(isEncarteModelo(v.modelo), `${v.slug} caixa ${v.modelo}`).toBe(true);
      expect(isThemeKey(v.themeKey), v.slug).toBe(true);
    }
  });
  it("tem seis variações por tema e nenhuma repetida", () => {
    for (const t of TEMAS_PRONTOS) expect(VISUAIS_PRONTOS.filter((v) => v.tema === t.id)).toHaveLength(6);
    const chaves = VISUAIS_PRONTOS.map((v) => `${v.emblema}|${v.fundo}|${v.modelo}`);
    expect(new Set(chaves).size).toBe(chaves.length);
  });
});
