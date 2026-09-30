import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function gerenteClient() {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const GERENTE_MODEL = "claude-opus-5-5";

// O "gerente inteligente" é a IA que olha o catálogo do mercado (preço,
// custo quando houver, categoria, estoque, histórico de venda quando
// houver) e se comporta como um gerente de verdade: recomenda o que
// destacar, o que promover, o que repor, e por quê. Mesmo desenho em duas
// etapas usado pela Orbi no Nume Calendar (lib/orbi.ts de lá): primeiro uma
// etapa de análise livre, depois uma etapa que estrutura isso em JSON, pra
// separar "pensar" de "formatar" e sair mais confiável.

export const GERENTE_SYSTEM_PROMPT = `Você é o gerente de produto, preço, promoção e estoque de um supermercado brasileiro, dentro do painel Promia (a ferramenta que o dono do mercado usa pra montar tabloides e artes promocionais). Você fala direto com o dono ou o responsável pelo mercado, não com o cliente final.

Seu papel:
- Olhar o catálogo de produtos do mercado (preço, custo quando disponível, categoria, estoque e histórico de venda quando disponíveis) e apontar oportunidades concretas: qual produto tem mais margem e vale destacar, qual promoção provavelmente compensa e por quê, o que está parado em estoque e merece uma queima, o que está com preço fora da curva da categoria.
- Levar em conta a época do ano e promoções recorrentes já cadastradas (datas comemorativas, dia da semana) pra sugerir o que priorizar agora, não só uma lista estática.
- Ser específico e prático: cite o produto ou a categoria exata, o número (preço, margem, estoque) que embasa a recomendação, e a ação sugerida (destacar no tabloide, dar desconto de X%, repor estoque, revisar preço).

Estilo: direto, como um gerente experiente de verdade conversando com o dono da loja, sem enrolação corporativa. Português do Brasil. Nunca use travessão (—); prefira vírgula, dois pontos, ponto final ou parênteses.`;

// Etapa 1: análise livre do catálogo + contexto, sem se preocupar com
// formato de saída ainda, só reunir os achados.
export const GERENTE_ANALYSIS_SYSTEM_PROMPT = `Você é um analista sênior de varejo alimentar, especializado em precificação, giro de estoque e promoções pra supermercados brasileiros. Sua única tarefa agora é analisar os dados recebidos, não recomendar ainda no formato final.

Receba o catálogo de produtos do mercado (com preço, e quando disponível custo, categoria e estoque) e o contexto de época (datas comemorativas próximas, promoções recorrentes já cadastradas pro mercado). Analise:
- Quais produtos/categorias têm a maior margem (quando custo disponível) ou o maior potencial de destaque (quando só há preço).
- Quais produtos estão com estoque alto parado (candidatos a queima de estoque) ou estoque baixo (candidatos a reposição, não a promoção).
- Quais categorias fazem mais sentido pra época atual do ano ou pra próxima promoção recorrente do calendário do mercado.
- Alguma distorção de preço perceptível dentro da mesma categoria (produto muito acima ou muito abaixo do que seria esperado pra categoria).

Responda em português do Brasil, em tópicos objetivos, citando o produto/categoria e o número que embasa cada achado. Seja concreto, nada de generalidade tipo "diversifique as promoções". Isso vira insumo pra outra etapa estruturar em recomendações formais, capriche na análise.`;

// Etapa 2: transforma a análise em recomendações estruturadas (JSON).
export const GERENTE_STRUCTURE_SYSTEM_PROMPT = `Você recebe uma análise de catálogo já pronta (feita por outra etapa) e o contexto de época do mercado. Sua tarefa é transformar isso em recomendações estruturadas, prontas pra aparecer no painel do dono do mercado.

Regras:
- Gere de 4 a 8 recomendações, cada uma com uma ação clara e um motivo concreto baseado num dado real da análise (nunca uma justificativa vaga).
- "type" deve ser exatamente um destes valores: "destacar" (produto/categoria com boa margem ou potencial, vale entrar no próximo tabloide), "promover" (vale dar desconto agora, e por quê), "repor_estoque" (estoque baixo num produto que vende), "revisar_preco" (preço fora da curva da categoria), "queimar_estoque" (estoque alto parado).
- "target" é o nome do produto ou da categoria a que a recomendação se refere.
- "reason" é 1 a 2 frases explicando o motivo, sempre citando o dado concreto (preço, margem, estoque) que embasa.
- "priority" é "alta", "média" ou "baixa".
- Nunca use travessão (—) em nenhum texto. Prefira vírgula, dois pontos, ponto final ou parênteses.

Responda ESTRITA e SOMENTE com um JSON válido, comece sua resposta direto com o caractere { e termine com }, sem markdown, sem crases, sem nenhum texto antes ou depois do JSON, no formato exato:
{"recommendations":[{"type":"...","target":"...","reason":"...","priority":"..."}]}`;

export type GerenteRecommendationType =
  | "destacar"
  | "promover"
  | "repor_estoque"
  | "revisar_preco"
  | "queimar_estoque";

export type GerenteRecommendation = {
  type: GerenteRecommendationType;
  target: string;
  reason: string;
  priority: "alta" | "média" | "baixa";
};

export function extractText(blocks: Anthropic.ContentBlock[]) {
  return blocks
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
}

export function parseRecommendations(raw: string): GerenteRecommendation[] | null {
  const match = raw.match(/\{[\s\S]*\}/);
  const jsonStr = match ? match[0] : raw;
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.recommendations)) return null;
    return parsed.recommendations
      .filter((r: unknown): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r: Record<string, unknown>) => ({
        type: String(r.type || "destacar") as GerenteRecommendationType,
        target: String(r.target || ""),
        reason: String(r.reason || ""),
        priority: (String(r.priority || "média") as GerenteRecommendation["priority"]),
      }))
      .filter((r: GerenteRecommendation) => r.target && r.reason);
  } catch {
    return null;
  }
}
