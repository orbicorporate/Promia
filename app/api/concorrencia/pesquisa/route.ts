import { NextResponse } from "next/server";
import { readJson, requireMarketAccess, serverError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPaulo } from "@/lib/dates";
import { bestMatch } from "@/lib/competition/match";
import { UFS, nomeUf, pesquisarPreco, type Escopo } from "@/lib/competition/pesquisa-online";

export const maxDuration = 60;

// POST /api/concorrencia/pesquisa { marketId, termos, escopo, uf }: procura o
// preço de cada produto na internet e guarda como pesquisa de campo.
export async function POST(req: Request) {
  const body = await readJson(req);
  const access = await requireMarketAccess(body.marketId);
  if (!access.ok) return access.response;
  const marketId = body.marketId as string;
  const termos = [...new Set((Array.isArray(body.termos) ? body.termos : []).map((t: unknown) => String(t).trim().slice(0, 80)).filter(Boolean))].slice(0, 5) as string[];
  if (termos.length === 0) return NextResponse.json({ error: "Escreva pelo menos um produto para pesquisar." }, { status: 400 });
  const escopo: Escopo = body.escopo === "estado" || body.escopo === "brasil" ? body.escopo : "cidade";
  const uf = String(body.uf ?? "").toUpperCase();

  const admin = createAdminClient();
  const { data: market } = await admin.from("markets").select("city").eq("id", marketId).single();
  const cidade = (market?.city ?? "").replace(/\s*[-\/,]\s*[A-Za-z]{2}\s*$/, "").trim();
  let regiao = "";
  if (escopo === "cidade") {
    if (!cidade) return NextResponse.json({ error: "Coloque a cidade do mercado em Mercado, ou pesquise por estado." }, { status: 400 });
    regiao = UFS.includes(uf) ? `${cidade} ${uf}` : cidade;
  } else if (escopo === "estado") {
    if (!UFS.includes(uf)) return NextResponse.json({ error: "Escolha o estado da pesquisa." }, { status: 400 });
    regiao = nomeUf(uf);
  }

  const { data: catalog } = await admin.from("products").select("id, name, brand").eq("market_id", marketId).eq("active", true).limit(20000);
  const hoje = todayInSaoPaulo();
  let total = 0;
  for (const termo of termos) {
    const achados = await pesquisarPreco(termo, escopo, regiao);
    if (achados === null) return NextResponse.json({ error: "A pesquisa na internet está indisponível agora. Tente de novo." }, { status: 503 });
    // refazer a pesquisa substitui a anterior do mesmo produto e alcance
    await admin.from("price_research").delete().eq("market_id", marketId).eq("term", termo).eq("scope", escopo);
    if (achados.length === 0) continue;
    const m = bestMatch(termo, catalog ?? []);
    const productId = m && m.score >= 0.6 ? m.item.id : null;
    const { error } = await admin.from("price_research").insert(achados.map((a) => ({ market_id: marketId, term: termo, product_id: productId, scope: escopo, region: regiao || "Brasil", observed_on: hoje, ...a })));
    if (error) return serverError("concorrencia/pesquisa", error, "Não consegui salvar a pesquisa.");
    total += achados.length;
  }
  return NextResponse.json({ found: total });
}
