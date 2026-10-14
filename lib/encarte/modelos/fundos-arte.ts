// Fundos de arte: cabeçalho (herói e onda) e rodapé em imagem, corpo em
// degradê remontado no código. Os recortes ficam em public/fundos/arte e as
// medidas vêm de scripts/importar-fundos-arte.py. Sem imports de servidor:
// serve também ao montador.

export type FundoArteMeta = {
  id: string; // ar01...
  slug: string; // arquivo em public/fundos/arte/<slug>-topo.webp e -base.webp
  nome: string;
  w: number; // largura do recorte original
  cut: number; // linha onde a onda do cabeçalho termina (no tamanho original)
  topoH: number; // altura do recorte do cabeçalho (cut + transição)
  baseH: number; // altura do recorte do rodapé
  fade: number; // transição em px
  topo: string[]; // 9 cores do corpo na emenda do cabeçalho, da esquerda para a direita
  base: string[]; // idem na emenda do rodapé
  meio: string;
  claro: boolean; // corpo claro (texto escuro em cima)
  faixaClara: boolean; // faixa do rodapé clara (texto escuro)
};

export const FUNDOS_ARTE: FundoArteMeta[] = [
  { id: "ar01", slug: "leite", nome: "Leite e iogurte", w: 1122, cut: 401, topoH: 457, baseH: 185, fade: 56, topo: ["#b9d4f1", "#bad5f1", "#bad5f2", "#bad5f1", "#b9d4f1", "#bad5f2", "#bad5f1", "#bad5f1", "#b9d4f1"], base: ["#bbd5f2", "#bbd6f2", "#bbd6f2", "#bbd5f2", "#bad5f2", "#bad5f2", "#bbd5f2", "#bbd5f2", "#bad5f1"], meio: "#bad5f2", claro: true, faixaClara: false },
  { id: "ar02", slug: "queijos", nome: "Queijos e uvas", w: 1122, cut: 400, topoH: 456, baseH: 188, fade: 56, topo: ["#f1d18c", "#efcf87", "#f1d089", "#f2d28d", "#f2d28f", "#f1d18c", "#f0d088", "#f1d089", "#f4d48f"], base: ["#efca7e", "#efcc81", "#f0cd84", "#f0cf86", "#efcf88", "#efce86", "#efcd83", "#efcd82", "#f0cb7f"], meio: "#f0cf88", claro: true, faixaClara: false },
  { id: "ar03", slug: "carnes", nome: "Carnes nobres", w: 1122, cut: 454, topoH: 510, baseH: 192, fade: 56, topo: ["#e3b592", "#e5b795", "#e6ba99", "#e6ba99", "#e6ba99", "#e6b997", "#e6b998", "#e4b896", "#e0b18d"], base: ["#d8aa87", "#dcae8b", "#deb18f", "#dfb290", "#e0b492", "#e1b493", "#e1b493", "#dfb391", "#deaf8c"], meio: "#e3b695", claro: true, faixaClara: false },
  { id: "ar04", slug: "vinhos", nome: "Vinhos", w: 1122, cut: 449, topoH: 505, baseH: 160, fade: 56, topo: ["#d2a9b6", "#d4acb9", "#d6afbc", "#d7afbc", "#d8b0bd", "#d7afbd", "#d4acb9", "#d2aab8", "#cea3b0"], base: ["#b88b9b", "#b88b9c", "#b88c9c", "#b98d9d", "#ba8e9f", "#ba8e9f", "#bd91a1", "#be93a4", "#c196a8"], meio: "#c9a0af", claro: true, faixaClara: false },
  { id: "ar05", slug: "sorvete", nome: "Sorvetes", w: 1122, cut: 441, topoH: 497, baseH: 151, fade: 56, topo: ["#bdc5f3", "#bcc5f3", "#bcc5f3", "#bcc5f4", "#bdc5f4", "#bdc6f4", "#bdc5f4", "#bdc5f4", "#bcc5f3"], base: ["#bdc6f3", "#bdc6f3", "#bdc6f4", "#bec6f4", "#bdc6f4", "#bec6f4", "#bec6f4", "#bdc6f4", "#bdc5f4"], meio: "#bdc5f4", claro: true, faixaClara: false },
  { id: "ar06", slug: "cerveja", nome: "Cerveja", w: 1122, cut: 427, topoH: 483, baseH: 168, fade: 56, topo: ["#d1a75a", "#e1b96b", "#e8c274", "#ecc578", "#ebc579", "#eac479", "#e6bf73", "#e1b96b", "#cda256"], base: ["#cba154", "#d1aa5f", "#d8b166", "#dab46a", "#dbb66d", "#dab56c", "#d8b36b", "#d3ad64", "#c9a157"], meio: "#e7c277", claro: true, faixaClara: false },
  { id: "ar07", slug: "churrasco", nome: "Churrasco e pais", w: 1122, cut: 451, topoH: 507, baseH: 168, fade: 56, topo: ["#acc7e1", "#abc7e1", "#aac6e0", "#acc6e0", "#abc6e0", "#abc6e0", "#abc5df", "#acc6e0", "#abc5de"], base: ["#9ebbd8", "#9fbcda", "#9ebdda", "#9fbddb", "#9fbedc", "#9fbddb", "#9fbddb", "#9ebcda", "#9ebddb"], meio: "#a5c2df", claro: true, faixaClara: false },
  { id: "ar08", slug: "mulher", nome: "Dia da mulher", w: 1122, cut: 435, topoH: 491, baseH: 203, fade: 56, topo: ["#dcaacb", "#dcaccc", "#ddb0ce", "#deafcf", "#deafce", "#deaecd", "#dcaccc", "#dbabcb", "#dcaacb"], base: ["#d5a5c5", "#d6a6c7", "#d7a8c9", "#d6a8c8", "#d7a8c8", "#d7a9c9", "#d6a7c8", "#d6a6c6", "#d6a5c6"], meio: "#daadcc", claro: true, faixaClara: false },
  { id: "ar09", slug: "limpeza", nome: "Limpeza", w: 1122, cut: 440, topoH: 496, baseH: 175, fade: 56, topo: ["#a5eadc", "#abebdd", "#afeddf", "#b0eee1", "#b2efe2", "#b3f0e3", "#b2f0e1", "#b3f0e2", "#b0efe1"], base: ["#90e1d2", "#8fdfd1", "#91e1d2", "#93e2d5", "#93e3d6", "#95e3d7", "#93e2d6", "#94e2d4", "#96e3d5"], meio: "#a3e9dc", claro: true, faixaClara: false },
  { id: "ar10", slug: "mercado", nome: "Supermercado", w: 1122, cut: 387, topoH: 443, baseH: 147, fade: 56, topo: ["#b8d9be", "#b9d9bf", "#b9d9be", "#badabf", "#b9dabf", "#b9d9bf", "#b9d9be", "#badabf", "#b9d9bf"], base: ["#bad9bf", "#badabf", "#badabf", "#b9d9bf", "#b9d9bf", "#badabf", "#b9d9bf", "#badabf", "#b9d9bf"], meio: "#b9d9bf", claro: true, faixaClara: false },
  { id: "ar11", slug: "natal", nome: "Natal", w: 1122, cut: 429, topoH: 485, baseH: 157, fade: 56, topo: ["#c2d7b8", "#c4d8b8", "#c7dabb", "#c7dabc", "#c9dcbd", "#c9dcbe", "#c5d9ba", "#c4d8b9", "#c1d5b6"], base: ["#9dbb98", "#9dba96", "#a3bf9d", "#a7c29f", "#a7c2a0", "#a6c2a0", "#a5c19f", "#a4c09e", "#a3bf9d"], meio: "#b9d0b0", claro: true, faixaClara: false },
  { id: "ar12", slug: "carnaval", nome: "Carnaval", w: 1122, cut: 423, topoH: 479, baseH: 173, fade: 56, topo: ["#cbaaeb", "#d0afef", "#d6b6f3", "#dabbf6", "#ddbdf7", "#dbbcf6", "#d5b5f2", "#d0aeee", "#ccabeb"], base: ["#b58fdb", "#b995e0", "#bf9de6", "#c19fe9", "#c2a0eb", "#c1a0ea", "#bf9de6", "#bd9ae6", "#b895df"], meio: "#ccadf0", claro: true, faixaClara: false },
  { id: "ar13", slug: "junina", nome: "Festa junina", w: 1122, cut: 500, topoH: 556, baseH: 165, fade: 56, topo: ["#f2c36e", "#f4c672", "#f4c773", "#f3c673", "#f3c572", "#f2c471", "#f3c672", "#f3c571", "#f3c36d"], base: ["#e9b65c", "#edba60", "#eebc64", "#f0bf67", "#efbe68", "#eebe67", "#eebd66", "#eebb62", "#ebb85d"], meio: "#efc16f", claro: true, faixaClara: false },
  { id: "ar14", slug: "pascoa", nome: "Páscoa", w: 1122, cut: 440, topoH: 496, baseH: 178, fade: 56, topo: ["#c4e1d2", "#c9e6d7", "#cbe7d8", "#c9e5d7", "#c9e5d6", "#c8e5d6", "#c8e5d6", "#c7e4d5", "#c6e3d4"], base: ["#b5d6c3", "#b7d7c6", "#badac8", "#bbdac9", "#bddccc", "#bedece", "#bfdecf", "#c0decf", "#bfdecf"], meio: "#c5e3d4", claro: true, faixaClara: false },
  { id: "ar15", slug: "infantil", nome: "Dia das crianças", w: 1122, cut: 394, topoH: 450, baseH: 153, fade: 56, topo: ["#cdb8f1", "#cfbbf2", "#d0bbf2", "#d0bcf2", "#d1bcf3", "#d0bcf2", "#d0bcf2", "#d0bcf2", "#cfbaf1"], base: ["#d1bdf3", "#d1bdf2", "#d1bdf2", "#d1bcf2", "#d0bdf3", "#d1bdf3", "#d1bdf3", "#d1bef3", "#d1bdf3"], meio: "#d0bdf3", claro: true, faixaClara: true },
  { id: "ar16", slug: "padaria", nome: "Padaria", w: 1122, cut: 459, topoH: 515, baseH: 192, fade: 56, topo: ["#dfba90", "#e2bf97", "#e4c299", "#e2bf96", "#e1bd94", "#e2bf97", "#e2c097", "#e4c299", "#e3c096"], base: ["#cda379", "#d1a97f", "#d1aa80", "#d2ab80", "#d3ab80", "#d1aa80", "#d1a97e", "#d1a87e", "#cda379"], meio: "#dbb68c", claro: true, faixaClara: false },
  { id: "ar17", slug: "maes", nome: "Dia das mães", w: 1122, cut: 414, topoH: 470, baseH: 176, fade: 56, topo: ["#ebb6c0", "#ecb7c1", "#ecb6c1", "#ecb6c1", "#ebb6c2", "#edb6c3", "#ecb6c1", "#ecb6c2", "#ecb7c2"], base: ["#e9afbc", "#e8afbc", "#eab1bd", "#eab2bf", "#ebb2c0", "#ebb3c1", "#eab3c0", "#e9b0bd", "#e5aab6"], meio: "#edb8c6", claro: true, faixaClara: false },
  { id: "ar18", slug: "reveillon", nome: "Réveillon", w: 1122, cut: 442, topoH: 498, baseH: 168, fade: 56, topo: ["#ddbe93", "#e2c499", "#e3c69b", "#e7cca4", "#e6cca7", "#e7cea8", "#ead0a8", "#e3c79e", "#d4b181"], base: ["#ccab7f", "#cdad82", "#d0b38a", "#d4b890", "#d5b991", "#d5b991", "#d2b68d", "#d0b288", "#cdae83"], meio: "#e1c7a2", claro: true, faixaClara: false },
  { id: "ar19", slug: "aniversario", nome: "Aniversário azul", w: 1122, cut: 469, topoH: 525, baseH: 156, fade: 56, topo: ["#bdd9f7", "#bdd9f6", "#bdd9f6", "#bbd8f7", "#bad7f7", "#bad7f7", "#bad8f7", "#bbd8f7", "#bbd8f6"], base: ["#b9d9f9", "#b7d8f9", "#b7d8fa", "#b7d7fa", "#b7d8f9", "#b8d9fa", "#b6d8fa", "#b7d8fa", "#b9d9f9"], meio: "#b7d7f9", claro: true, faixaClara: false },
  { id: "ar20", slug: "blackfriday", nome: "Black Friday", w: 1122, cut: 382, topoH: 438, baseH: 178, fade: 56, topo: ["#585863", "#63626d", "#656570", "#666670", "#666671", "#666670", "#65656f", "#5e5e69", "#53545e"], base: ["#35363f", "#3d3e48", "#42434d", "#454651", "#484853", "#474853", "#474853", "#434450", "#3a3b45"], meio: "#585863", claro: false, faixaClara: false },
];

export const ARTE_IDS = FUNDOS_ARTE.map((a) => a.id) as readonly string[];

export function fundoArtePorId(id: string | null | undefined): FundoArteMeta | null {
  return id ? (FUNDOS_ARTE.find((a) => a.id === id) ?? null) : null;
}
