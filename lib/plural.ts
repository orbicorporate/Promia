// "1 produto", "3 produtos": evita o "produto(s)" nas telas
export function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}
