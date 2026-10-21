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

export const JANELA_DIAS = 7;

const MESES: Record<string, number> = { jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, ago: 8, aug: 8, set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12 };

// Data de publicação que o Google mostra no resultado ("há 2 dias", "2 days ago",
// "14 de out. de 2025", "Oct 14, 2025"). Devolve a data (AAAA-MM-DD) ou null
// quando não dá para saber, e nesse caso o resultado não entra na pesquisa.
export function dataDoResultado(texto: string | undefined, hoje: string): string | null {
  const t = (texto ?? "").toLowerCase().trim();
  if (!t) return null;
  const base = new Date(`${hoje}T12:00:00Z`);
  const voltar = (dias: number) => new Date(base.getTime() - dias * 86400000).toISOString().slice(0, 10);
  if (/\b(hoje|today|minut|hora|hour|segundo|second)/.test(t)) return hoje;
  if (/\b(ontem|yesterday)\b/.test(t)) return voltar(1);
  let m = t.match(/(\d+)\s*(dia|day|semana|week|m[eê]s|mes|month|ano|year)/);
  if (m) {
    const n = Number(m[1]);
    const u = m[2];
    const dias = /dia|day/.test(u) ? n : /semana|week/.test(u) ? n * 7 : /m[eê]s|mes|month/.test(u) ? n * 30 : n * 365;
    return voltar(dias);
  }
  m = t.match(/(\d{1,2})\s*(?:de\s*)?([a-zç]{3})[a-zç]*\.?\s*(?:de\s*)?(\d{4})/);
  if (m && MESES[m[2]]) return `${m[3]}-${String(MESES[m[2]]).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  m = t.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MESES[m[1]]) return `${m[3]}-${String(MESES[m[1]]).padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  return null;
}

async function serper(rota: "search" | "shopping", q: string, semana = false): Promise<Record<string, unknown> | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(`https://google.serper.dev/${rota}`, { method: "POST", signal: controller.signal, headers: { "X-API-KEY": key, "content-type": "application/json" }, body: JSON.stringify({ q, gl: "br", hl: "pt-br", num: 20, ...(semana ? { tbs: "qdr:w" } : {}) }) });
    return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

type Org = { title?: string; link?: string; snippet?: string; date?: string };
type Shop = { title?: string; source?: string; link?: string; price?: string | number };

// Procura o preço de um produto na internet. `regiao` é a cidade ou o estado
// (vazio para o Brasil todo). Devolve null quando a busca está indisponível.
export async function pesquisarPreco(termo: string, escopo: Escopo, regiao: string): Promise<Achado[] | null> {
  const palavras = termo.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const sobre = (t: string) => palavras.length === 0 || palavras.some((w) => t.toLowerCase().includes(w));
  const onde = escopo === "brasil" ? "" : ` ${regiao}`;
  const [org, shop] = await Promise.all([
    serper("search", `${termo} preço supermercado oferta${onde}`, true),
    // lojas online são nacionais: só entram quando a pesquisa é do Brasil todo
    escopo === "brasil" ? serper("shopping", `${termo} supermercado`) : Promise.resolve<Record<string, unknown>>({}),
  ]);
  if (!org || !shop) return null;
  const achados: Achado[] = [];
  const hoje = new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
  const limite = new Date(Date.parse(`${hoje}T12:00:00Z`) - JANELA_DIAS * 86400000).toISOString().slice(0, 10);
  const anoAtual = Number(hoje.slice(0, 4));
  for (const o of ((org.organic as Org[]) ?? [])) {
    const texto = `${o.title ?? ""} ${o.snippet ?? ""}`;
    const preco = primeiroPreco(texto);
    if (preco == null || !o.link || !sobre(texto)) continue;
    // só entra o que tem data de publicação dentro da janela; sem data ou antigo, fora
    const publicado = dataDoResultado(o.date, hoje);
    if (!publicado || publicado < limite) continue;
    // texto que cita ano anterior ("oferta 2025") também é descartado
    if ((texto.match(/\b20\d{2}\b/g) ?? []).some((a) => Number(a) < anoAtual)) continue;
    const orig = origemDe(o.link);
    const quando = `Publicado em ${publicado.slice(8, 10)}/${publicado.slice(5, 7)}. `;
    achados.push({ product_name: (o.title ?? termo).slice(0, 160), price: preco, source_kind: orig.kind, source_name: orig.name, source_url: o.link, snippet: (quando + (o.snippet ?? "")).slice(0, 240) });
  }
  for (const s of ((shop.shopping as Shop[]) ?? [])) {
    const preco = typeof s.price === "number" ? s.price : primeiroPreco(String(s.price ?? ""));
    if (preco == null || preco < 0.3 || preco > 2000 || !s.title || !sobre(s.title)) continue;
    achados.push({ product_name: s.title.slice(0, 160), price: preco, source_kind: "loja_online", source_name: s.source ?? "loja online", source_url: s.link ?? null, snippet: "Preço da loja no dia da pesquisa." });
  }
  return achados.slice(0, 12);
}
