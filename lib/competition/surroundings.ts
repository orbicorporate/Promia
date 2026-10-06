// O entorno do mercado pela busca de lugares: quem mora, estuda e trabalha
// perto. Cada tipo de lugar é uma busca; o número de resultados e os mais
// próximos dizem muito sobre o público.

export const SURROUNDING_KINDS = [
  { key: "escolas", q: "escola", label: "Escolas" },
  { key: "faculdades", q: "faculdade universidade", label: "Faculdades" },
  { key: "academias", q: "academia", label: "Academias" },
  { key: "saude", q: "hospital clínica UBS", label: "Saúde" },
  { key: "empresas", q: "empresa escritório indústria", label: "Empresas" },
  { key: "condominios", q: "condomínio residencial", label: "Condomínios" },
  { key: "restaurantes", q: "restaurante lanchonete bar", label: "Restaurantes e bares" },
  { key: "igrejas", q: "igreja", label: "Igrejas" },
] as const;

export type Surrounding = { key: string; label: string; count: number; examples: string[] };

async function places(q: string, location: string): Promise<{ title: string }[] | null> {
  const key = process.env.SERPER_API_KEY?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch("https://google.serper.dev/places", {
      method: "POST",
      signal: controller.signal,
      headers: { "X-API-KEY": key, "content-type": "application/json" },
      body: JSON.stringify({ q: `${q} perto de ${location}`, gl: "br", hl: "pt-br" }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { places?: { title?: string }[] };
    return (json.places ?? []).filter((p): p is { title: string } => !!p.title);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function scanSurroundings(location: string): Promise<Surrounding[] | null> {
  const results = await Promise.all(SURROUNDING_KINDS.map((k) => places(k.q, location)));
  if (results.every((r) => r === null)) return null;
  return SURROUNDING_KINDS.map((k, i) => ({ key: k.key, label: k.label, count: results[i]?.length ?? 0, examples: (results[i] ?? []).slice(0, 4).map((p) => p.title.slice(0, 80)) }));
}
