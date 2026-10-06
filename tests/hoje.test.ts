import { describe, expect, it } from "vitest";
import { buildHojeActions, type HojeInput } from "@/lib/hoje";

const base: HojeInput = {
  slug: "m",
  today: "2026-10-06",
  productCount: 100,
  photosToReview: 0,
  photosPending: 0,
  noPrice: 0,
  occasions: [{ date: "2026-10-12", title: "Dia das Crianças", kind: "data", themeKey: "dia-das-criancas", headline: "Festival da criançada" }],
  encartes: [],
  topRec: null,
};

describe("tela Hoje", () => {
  it("sem produtos, a única ação é enviar a planilha", () => {
    const a = buildHojeActions({ ...base, productCount: 0 });
    expect(a).toHaveLength(1);
    expect(a[0].href).toContain("importar=1");
  });

  it("ocasião próxima sem encarte vira ação com tema e datas", () => {
    const a = buildHojeActions(base);
    expect(a[0].title).toContain("Dia das Crianças em 6 dias");
    expect(a[0].href).toContain("tema=dia-das-criancas");
    expect(a[0].href).toContain("ate=2026-10-12");
  });

  it("encarte que cobre a ocasião tira a sugestão e pede campanha", () => {
    const a = buildHojeActions({ ...base, encartes: [{ id: "e1", name: "Crianças", valid_from: "2026-10-06", valid_until: "2026-10-12", theme_key: "x", hasCampaign: false, todaySteps: [] }] });
    expect(a.some((x) => x.id.startsWith("ocasiao"))).toBe(false);
    expect(a.some((x) => x.id === "campanha-e1")).toBe(true);
  });

  it("passo da campanha de hoje vem primeiro", () => {
    const a = buildHojeActions({ ...base, photosToReview: 3, encartes: [{ id: "e1", name: "X", valid_from: "2026-10-06", valid_until: "2026-10-12", theme_key: "x", hasCampaign: true, todaySteps: ["Postar o anúncio no feed às 11h"] }] });
    expect(a[0].title).toBe("Postar o anúncio no feed às 11h");
    expect(a.at(-1)?.id).toBe("fotos");
  });
});
