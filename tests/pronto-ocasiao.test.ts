import { describe, expect, it } from "vitest";
import { prontoDaOcasiao, VISUAIS_PRONTOS } from "@/lib/encarte/prontos";

describe("combinação pronta de cada data", () => {
  it("Halloween abre com o logo e o fundo de Halloween", () => {
    const p = prontoDaOcasiao("Halloween");
    expect(p?.emblema).toBe("halloween");
    expect(p?.fundo).toBe("ar80");
    expect(p?.themeKey).toBe("halloween");
  });
  it("as datas do calendário caem no grupo e no logo certos", () => {
    expect(prontoDaOcasiao("Dia das Mães")?.emblema).toBe("dia-das-maes");
    expect(prontoDaOcasiao("Dia dos Namorados")?.emblema).toBe("dia-dos-namorados");
    expect(prontoDaOcasiao("Natal")?.tema).toBe("natal");
    expect(prontoDaOcasiao("Réveillon")?.emblema).toBe("ofertas-de-ano-novo");
    expect(prontoDaOcasiao("Carnaval")?.tema).toBe("carnaval");
    expect(prontoDaOcasiao("Black Friday")?.tema).toBe("black-friday");
    expect(prontoDaOcasiao("Páscoa")?.tema).toBe("pascoa");
    expect(prontoDaOcasiao("Dia das Crianças")?.emblema).toBe("dia-das-criancas");
    expect(prontoDaOcasiao("Terça da carne")).toBeNull();
  });
  it("toda combinação nova tem miniatura gerada", async () => {
    const { existsSync } = await import("node:fs");
    for (const v of VISUAIS_PRONTOS.filter((x) => x.tema === "halloween" || x.tema === "carnaval")) {
      expect(existsSync(`public/miniaturas/pronto-${v.slug}.webp`)).toBe(true);
    }
  });
});
