// Pesquisa de preços na internet pela busca do Google (Serper): páginas de
// sites, posts de redes sociais e lojas online. É referência de campo, não
// preço confirmado de loja.

export type Escopo = "cidade" | "estado" | "brasil";
export type Origem = "site" | "rede_social" | "loja_online";
export type Achado = { product_name: string; price: number; source_kind: Origem; source_name: string; source_url: string | null; snippet: string | null };

const REDES: Record<string, string> = { "instagram.com": "Instagram", "facebook.com": "Facebook", "m.facebook.com": "Facebook", "tiktok.com": "TikTok", "youtube.com": "YouTube", "x.com": "X", "twitter.com": "X", "kwai.com": "Kwai", "threads.net": "Threads" };
const PRECO = /R\$\s?(\d{1,4}(?:\.\d{3})*,\d{2})/g;

export function hostDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function origemDe(url: string): { kind: Origem; name: string } {
  const host = hostDe(url);
  const rede = Object.keys(REDES).find((d) => host === d || host.endsWith(`.${d}`));
  return rede ? { kind: "rede_social", name: REDES[rede] } : { kind: "site", name: host || "site" };
}

// primeiro preço plausível de um texto (mercado: entre R$ 0,30 e R$ 2.000)
export function primeiroPreco(texto: string): number | null {
  for (const m of texto.matchAll(PRECO)) {
    const n = Number(m[1].replace(/\./g, "").replace(",", "."));
    if (n >= 0.3 && n <= 2000) return n;
  }
  return null;
}

const UF_NOME: Record<string, string> = { AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins" };
export const UFS = Object.keys(UF_NOME);
export const nomeUf = (uf: string) => UF_NOME[uf] ?? uf;

// estado escrito na cidade do cadastro ("Sorocaba - SP", "Sorocaba/SP")
export function ufDaCidade(cidade: string | null): string {
  const m = (cidade ?? "").toUpperCase().match(/[\s\-\/,]([A-Z]{2})\s*$/);
  return m && UF_NOME[m[1]] ? m[1] : "";
}

async function serper(rota: "search" | "shopping", q: string): Promise<Record<string, unknown> | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(`https://google.serper.dev/${rota}`, { method: "POST", signal: controller.signal, headers: { "X-API-KEY": key, "content-type": "application/json" }, body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 10 }) });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Org = { title?: string; link?: string; snippet?: string };
type Shop = { title?: string; source?: string; link?: string; price?: string | number };

// Procura o preço de um produto na internet. `regiao` é a cidade ou o estado
// (vazio para o Brasil todo). Devolve null quando a busca está indisponível.
export async function pesquisarPreco(termo: string, escopo: Escopo, regiao: string): Promise<Achado[] | null> {
  const palavras = termo.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const sobre = (t: string) => palavras.length === 0 || palavras.some((w) => t.toLowerCase().includes(w));
  const onde = escopo === "brasil" ? "" : ` ${regiao}`;
  const [org, shop] = await Promise.all([
    serper("search", `${termo} preço supermercado oferta${onde}`),
    // lojas online são nacionais: só entram quando a pesquisa é do Brasil todo
    escopo === "brasil" ? serper("shopping", `${termo} supermercado`) : Promise.resolve<Record<string, unknown>>({}),
  ]);
  if (!org || !shop) return null;
  const achados: Achado[] = [];
  for (const o of ((org.organic as Org[]) ?? [])) {
    const texto = `${o.title ?? ""} ${o.snippet ?? ""}`;
    const preco = primeiroPreco(texto);
    if (preco == null || !o.link || !sobre(texto)) continue;
    const orig = origemDe(o.link);
    achados.push({ product_name: (o.title ?? termo).slice(0, 160), price: preco, source_kind: orig.kind, source_name: orig.name, source_url: o.link, snippet: (o.snippet ?? "").slice(0, 240) || null });
  }
  for (const s of ((shop.shopping as Shop[]) ?? [])) {
    const preco = typeof s.price === "number" ? s.price : primeiroPreco(String(s.price ?? ""));
    if (preco == null || preco < 0.3 || preco > 2000 || !s.title || !sobre(s.title)) continue;
    achados.push({ product_name: s.title.slice(0, 160), price: preco, source_kind: "loja_online", source_name: s.source ?? "loja online", source_url: s.link ?? null, snippet: null });
  }
  return achados.slice(0, 12);
}
