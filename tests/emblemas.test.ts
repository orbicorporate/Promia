import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EMBLEMAS } from "@/lib/emblemas/catalog";
import { FILTRO_VAZIO, filtrarEmblemas } from "@/lib/emblemas/filtro";
import { PLANEJADOS } from "@/lib/emblemas/planejados";
import { quandoFits, quandoTexto } from "@/lib/emblemas/quando";
import { FERIADOS } from "@/lib/emblemas/tipos";

describe("catálogo de emblemas", () => {
  it("slugs únicos e feriados conhecidos", () => {
    const slugs = EMBLEMAS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const e of EMBLEMAS) for (const f of e.feriados) expect(FERIADOS).toContain(f);
    for (const p of PLANEJADOS) for (const f of p.feriados ?? []) expect(FERIADOS).toContain(f);
  });

  it("regras de data", () => {
    // 2026-10-07 é quarta-feira
    expect(quandoFits({ kind: "semana", dias: [3] }, "2026-10-07")).toBe(true);
    expect(quandoFits({ kind: "semana", dias: [2] }, "2026-10-07")).toBe(false);
    expect(quandoFits({ kind: "mes", mes: 9 }, "2026-09-30")).toBe(true);
    // Dia das Crianças em 12/10: vale 15 dias antes
    expect(quandoFits({ kind: "feriado", titulo: "Dia das Crianças", antes: 15 }, "2026-09-28")).toBe(true);
    expect(quandoFits({ kind: "feriado", titulo: "Dia das Crianças", antes: 15 }, "2026-10-13")).toBe(false);
    // Black Friday 2026 é 27/11
    expect(quandoFits({ kind: "feriado", titulo: "Black Friday", antes: 14, depois: 3 }, "2026-11-15")).toBe(true);
    expect(quandoFits({ kind: "periodo", de: "01-10", ate: "02-20" }, "2027-02-01")).toBe(true);
    expect(quandoFits({ kind: "periodo", de: "12-10", ate: "02-28" }, "2027-01-05")).toBe(true);
    expect(quandoFits({ kind: "diaDoMes", dias: [5], antes: 3 }, "2026-10-03")).toBe(true);
    expect(quandoFits({ kind: "diaDoMes", dias: [5], antes: 3 }, "2026-10-06")).toBe(false);
  });

  it("textos das regras", () => {
    expect(quandoTexto({ kind: "semana", dias: [3] })).toBe("Toda quarta");
    expect(quandoTexto({ kind: "semana", dias: [6] })).toBe("Todo sábado");
    expect(quandoTexto({ kind: "semana", dias: [4, 5, 6, 0] })).toBe("De quinta a domingo");
    expect(quandoTexto({ kind: "mes", mes: 9 })).toBe("Em setembro");
  });

  it("filtros por tipo, tema, feriado e data", () => {
    const hoje = "2026-10-07";
    const f = (p: Partial<typeof FILTRO_VAZIO>) => filtrarEmblemas(EMBLEMAS, { ...FILTRO_VAZIO, ...p }, hoje).map((e) => e.slug);
    expect(f({ tipo: "ofertao" })).toHaveLength(8);
    expect(f({ tema: "hortifruti" })).toEqual(expect.arrayContaining(["hortifruti", "quarta-do-hortifruti", "dia-de-feira"]));
    expect(f({ tema: "sem-tema" })).toContain("pet");
    expect(f({ feriado: "Natal" })).toEqual(expect.arrayContaining(["natal-de-ofertas", "ceia-de-natal"]));
    const hojeLista = f({ janela: "hoje" });
    expect(hojeLista).toContain("quarta-do-hortifruti");
    expect(hojeLista).toContain("ofertao-de-quarta");
    expect(hojeLista).not.toContain("terca-da-carne");
    // os do ano todo vêm por último
    expect(hojeLista.indexOf("quarta-do-hortifruti")).toBeLessThan(hojeLista.indexOf("padaria"));
    expect(f({ q: "acougue" })).toContain("terca-da-carne");
  });

  it("variantes existem em disco e os 12 de prioridade alta saíram da lista de faltantes", () => {
    const comVar = EMBLEMAS.filter((e) => e.variantes?.length);
    expect(comVar).toHaveLength(12);
    for (const e of EMBLEMAS) {
      expect(existsSync(`public/emblemas/${e.slug}.png`)).toBe(true);
      expect(existsSync(`public/emblemas/t/${e.slug}.webp`)).toBe(true);
      for (const v of e.variantes ?? []) expect(existsSync(`public/emblemas/${e.slug}--${v}.png`)).toBe(true);
    }
    const prontos = new Set(EMBLEMAS.map((e) => e.nome));
    for (const p of PLANEJADOS) expect(prontos.has(p.nome)).toBe(false);
    expect(EMBLEMAS).toHaveLength(71);
  });

  it("texto da janela que termina antes da data", () => {
    const q = { kind: "feriado", titulo: "Black Friday", antes: 30, depois: -14 } as const;
    expect(quandoTexto(q)).toBe("De 30 a 14 dias antes de Black Friday");
    expect(quandoFits(q, "2026-10-30")).toBe(true); // 28 dias antes de 27/11
    expect(quandoFits(q, "2026-11-20")).toBe(false);
  });
});
