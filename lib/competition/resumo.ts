import { priceRole } from "./pricing";

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

export type LinhaLida = { product_name: string; product_id: string | null; price: number };
export type Nosso = { id: string; name: string; price: number | null };

// Texto curto para o WhatsApp: o que o concorrente cobra contra o que você cobra.
export function resumoWhatsApp(concorrente: string, lidos: LinhaLida[], catalogo: Nosso[], link: string): string {
  const por = new Map(catalogo.map((p) => [p.id, p]));
  const comuns = lidos
    .map((l) => ({ l, p: l.product_id ? por.get(l.product_id) : undefined }))
    .filter((x): x is { l: LinhaLida; p: Nosso & { price: number } } => !!x.p && x.p.price != null && x.p.price > 0);
  const linhas = [`Li ${lidos.length} preços do ${concorrente}.`];
  if (comuns.length === 0) {
    linhas.push("Nenhum bateu com produtos do seu catálogo ainda, então não deu para comparar.", `Veja os preços lidos: ${link}`);
    return linhas.join("\n");
  }
  const caro = comuns.filter((x) => x.p.price / x.l.price - 1 > 0.02).sort((a, b) => b.p.price / b.l.price - a.p.price / a.l.price);
  const barato = comuns.filter((x) => x.p.price / x.l.price - 1 < -0.02);
  linhas.push(`Comparei ${comuns.length} com o seu catálogo: você está mais caro em ${caro.length} e mais barato em ${barato.length}.`);
  if (caro.length) {
    linhas.push("", "Mais caro:");
    for (const x of caro.slice(0, 5)) linhas.push(`- ${x.p.name}: você ${brl(x.p.price)}, eles ${brl(x.l.price)}${priceRole(x.p.name) === "atracao" ? " (produto de atração)" : ""}`);
  }
  if (barato.length) {
    linhas.push("", "Mais barato, vale anunciar:");
    for (const x of barato.slice(0, 3)) linhas.push(`- ${x.p.name}: você ${brl(x.p.price)}, eles ${brl(x.l.price)}`);
  }
  linhas.push("", `Preços sugeridos e encarte de resposta: ${link}`);
  return linhas.join("\n");
}
