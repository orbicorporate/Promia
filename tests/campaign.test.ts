import { describe, expect, it } from "vitest";
import { normalizeCampaign } from "@/lib/ai/campaign";

const base = {
  resumo: "Semana da carne com preço de atacado",
  posts: [{ titulo: "Abertura", quando: "seg 06/10, 11h", formato: "feed", legenda: "Chegou a semana da carne", hashtags: ["carne", "#oferta"] }],
  whatsapp: "Oi! Ofertas da semana",
  video: { titulo: "15s", cenas: [{ tempo: "0-3s", imagem: "picanha", fala: "Olha o preço" }] },
  carroDeSom: "Atenção, atenção",
  calendario: [{ data: "2026-10-06", acao: "Postar abertura" }, { data: "06/10", acao: "data errada some" }],
  dicasLoja: ["Ponta de gôndola com carvão"],
};

describe("campanha da IA", () => {
  it("normaliza hashtags, formato e datas", () => {
    const c = normalizeCampaign(base)!;
    expect(c.posts[0].hashtags).toEqual(["#carne", "#oferta"]);
    expect(c.posts[0].formato).toBe("feed");
    expect(c.calendario).toHaveLength(1);
    expect(c.geradoEm).toMatch(/^\d{4}-/);
  });

  it("troca travessão por vírgula", () => {
    const c = normalizeCampaign({ ...base, whatsapp: "Oferta — só hoje" })!;
    expect(c.whatsapp).toBe("Oferta, só hoje");
  });

  it("recusa campanha sem post ou sem WhatsApp", () => {
    expect(normalizeCampaign({ ...base, posts: [] })).toBeNull();
    expect(normalizeCampaign({ ...base, whatsapp: "" })).toBeNull();
    expect(normalizeCampaign("texto")).toBeNull();
  });
});
