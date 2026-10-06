// Posição de preço: produto de atração (o que o cliente compara entre
// mercados) acompanha o concorrente; produto de margem segura o preço.
// Preço sugerido sempre termina em ,99 / ,89 / ,49 como o varejo usa.

const ATRACAO = /\b(arroz|feijao|oleo|acucar|cafe|leite|cerveja|refrigerante|coca|ovo|ovos|carne|picanha|alcatra|patinho|frango|linguica|papel higienico|sabao|detergente|margarina|manteiga|farinha|macarrao|banana|tomate|batata|cebola)\b/;

export type PriceRole = "atracao" | "margem";

export function priceRole(name: string, category?: string | null): PriceRole {
  const n = `${name} ${category ?? ""}`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return ATRACAO.test(n) ? "atracao" : "margem";
}

// arredonda para baixo até um final de preço do varejo
export function retailPrice(value: number): number {
  if (value <= 0) return 0;
  const reais = Math.floor(value);
  const cents = value - reais;
  const endings = [0.99, 0.89, 0.79, 0.49];
  for (const e of endings) if (cents >= e - 0.0001) return Math.round((reais + e) * 100) / 100;
  return reais > 0 ? Math.round((reais - 1 + 0.99) * 100) / 100 : Math.round(value * 100) / 100;
}

export type PriceAdvice = { kind: "baixar" | "anunciar" | "manter" | "subir"; suggested: number | null; text: string };

export function adviseOnPrice(ours: number | null, theirs: number, role: PriceRole): PriceAdvice {
  if (ours == null) return { kind: "manter", suggested: null, text: "Sem preço no catálogo." };
  const diff = ours / theirs - 1;
  if (role === "atracao") {
    if (diff > 0.02) {
      const s = retailPrice(theirs - 0.05);
      return { kind: "baixar", suggested: s, text: "Produto que o cliente compara. Acompanhe o concorrente." };
    }
    if (diff < -0.03) return { kind: "anunciar", suggested: null, text: "Você é mais barato num produto que o cliente compara. Coloque no encarte." };
    return { kind: "manter", suggested: null, text: "Preço alinhado." };
  }
  if (diff > 0.12) return { kind: "baixar", suggested: retailPrice(theirs * 1.05), text: "Diferença grande demais, o cliente percebe." };
  if (diff < -0.1) return { kind: "subir", suggested: retailPrice(theirs * 0.97), text: "Espaço para ganhar margem sem perder a vantagem." };
  return { kind: "manter", suggested: null, text: "Preço alinhado." };
}
