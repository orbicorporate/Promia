// Quando a resposta da IA vem cortada (limite de tokens) ou com um objeto
// quebrado no meio, o JSON inteiro não abre. Aqui se varre o texto e se
// aproveita cada objeto completo da lista pedida, além dos campos simples
// de texto do topo.

function scanObjects(text: string, from: number): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  let esc = false;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        out.push(text.slice(start, i + 1));
        start = -1;
      }
      if (depth < 0) break; // fechou a lista e o objeto de fora
    } else if (ch === "]" && depth === 0) break;
  }
  return out;
}

export function salvageList(text: string, key: string, scalarKeys: string[] = []): Record<string, unknown> | null {
  const at = text.search(new RegExp(`"${key}"\\s*:\\s*\\[`));
  if (at < 0) return null;
  const items: unknown[] = [];
  for (const raw of scanObjects(text, text.indexOf("[", at) + 1)) {
    try {
      items.push(JSON.parse(raw));
    } catch {
      // objeto quebrado: pula
    }
  }
  if (items.length === 0) return null;
  const out: Record<string, unknown> = { [key]: items };
  for (const k of scalarKeys) {
    const m = text.match(new RegExp(`"${k}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
    if (m) {
      try {
        out[k] = JSON.parse(`"${m[1]}"`);
      } catch {
        /* ignora */
      }
    }
  }
  return out;
}
