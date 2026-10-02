import Anthropic from "@anthropic-ai/sdk";

// Um lugar só pra decidir qual modelo faz o quê (mesma ideia do
// lib/aiModel.ts do Orbibox). Trocar de modelo é mudar uma linha aqui.

// Gerente inteligente: análise de catálogo e recomendações.
export const GERENTE_MODEL = "claude-sonnet-5-5";

// Busca de foto: tarefa curta e repetida centenas de vezes, então o modelo
// rápido e barato. Se ele recusar a ferramenta de busca, cai no reserva.
export const IMAGE_SEARCH_MODEL = "claude-haiku-4-5-20251001";
export const IMAGE_SEARCH_FALLBACK_MODEL = "claude-sonnet-5-5";

let client: Anthropic | null = null;

export function anthropic(): Anthropic | null {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    // chaves que não pertencem a um workspace exigem dizer qual usar
    const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
    client = new Anthropic({
      apiKey,
      defaultHeaders: workspaceId ? { "anthropic-workspace-id": workspaceId } : undefined,
    });
  }
  return client;
}
