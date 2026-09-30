import Anthropic from "@anthropic-ai/sdk";
import { gerenteClient } from "./gerente";

// Busca automática de imagem de produto: usa a busca na web da própria
// Anthropic (o mesmo mecanismo usado pela Orbi no Nume Calendar) pra achar
// uma referência real do produto. Importante: só tratamos como "imagem
// encontrada" um resultado cuja URL aponta direto pra um arquivo de imagem
// (.jpg/.png/.webp/...), porque é a única garantia que não é um link
// inventado pelo modelo. Qualquer outra coisa (só achou a página do
// produto, não achou nada, ou não tem certeza) cai em "revisar", pro dono
// do mercado confirmar manualmente antes do produto entrar num tabloide.

const IMAGE_EXT_RE = /\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i;

export type ImageSearchResult = {
  imageUrl: string | null;
  sourceUrl: string | null;
  status: "encontrada" | "nao_encontrada" | "revisar";
};

export async function findProductImage(productName: string, brand: string | null): Promise<ImageSearchResult> {
  const client = gerenteClient();
  if (!client) {
    return { imageUrl: null, sourceUrl: null, status: "revisar" };
  }

  const query = brand ? `${productName} ${brand}` : productName;

  try {
    const response = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 }],
      messages: [
        {
          role: "user",
          content: `Encontre uma foto de embalagem/produto pra: "${query}" (produto de supermercado brasileiro). Priorize um link que aponte direto pra um arquivo de imagem.`,
        },
      ],
    });

    const searchBlocks = response.content.filter(
      (b): b is Anthropic.WebSearchToolResultBlock => b.type === "web_search_tool_result"
    );

    const results: Anthropic.WebSearchResultBlock[] = [];
    for (const block of searchBlocks) {
      if (Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.type === "web_search_result") results.push(item);
        }
      }
    }

    const directImage = results.find((r) => IMAGE_EXT_RE.test(r.url));
    if (directImage) {
      return { imageUrl: directImage.url, sourceUrl: directImage.url, status: "encontrada" };
    }

    const bestGuess = results[0];
    if (bestGuess) {
      // achou uma página relevante, mas não um link direto de imagem: fica
      // pra revisão manual em vez de arriscar um hotlink que pode não ser
      // nem uma imagem de verdade.
      return { imageUrl: null, sourceUrl: bestGuess.url, status: "revisar" };
    }

    return { imageUrl: null, sourceUrl: null, status: "nao_encontrada" };
  } catch (err) {
    console.error("[imageSearch] erro ao buscar imagem:", err);
    return { imageUrl: null, sourceUrl: null, status: "revisar" };
  }
}
