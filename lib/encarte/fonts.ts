import { readFile } from "node:fs/promises";
import path from "node:path";
import { FONT_DISPLAY, FONT_TEXT } from "./render";
import { FONT_ALFA, FONT_ANTON, FONT_BALOO, FONT_LILITA, FONT_PINCEL } from "./modelos/tipografia";

// Fontes do encarte, lidas do disco uma vez e guardadas no módulo. Só .woff
// (o renderizador do next/og não lê woff2). Os arquivos entram no bundle
// das rotas por outputFileTracingIncludes em next.config.ts.

export type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 700 | 800; style: "normal" };

const FILES: { name: string; file: string; weight: OgFont["weight"] }[] = [
  { name: FONT_DISPLAY, file: "bricolage-grotesque-latin-400-normal.woff", weight: 400 },
  { name: FONT_DISPLAY, file: "bricolage-grotesque-latin-600-normal.woff", weight: 600 },
  { name: FONT_DISPLAY, file: "bricolage-grotesque-latin-700-normal.woff", weight: 700 },
  { name: FONT_DISPLAY, file: "bricolage-grotesque-latin-800-normal.woff", weight: 800 },
  { name: FONT_TEXT, file: "instrument-sans-latin-400-normal.woff", weight: 400 },
  { name: FONT_TEXT, file: "instrument-sans-latin-500-normal.woff", weight: 500 },
  { name: FONT_TEXT, file: "instrument-sans-latin-600-normal.woff", weight: 600 },
  { name: FONT_LILITA, file: "lilita-one-latin-400-normal.woff", weight: 400 },
  { name: FONT_ALFA, file: "alfa-slab-one-latin-400-normal.woff", weight: 400 },
  { name: FONT_ANTON, file: "anton-latin-400-normal.woff", weight: 400 },
  { name: FONT_PINCEL, file: "caveat-brush-latin-400-normal.woff", weight: 400 },
  { name: FONT_BALOO, file: "baloo-2-latin-800-normal.woff", weight: 800 },
];

let cached: Promise<OgFont[]> | null = null;

export function loadEncarteFonts(): Promise<OgFont[]> {
  if (!cached) {
    const dir = path.join(process.cwd(), "assets", "fonts");
    cached = Promise.all(
      FILES.map(async (f) => {
        const buf = await readFile(path.join(dir, f.file));
        const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
        return { name: f.name, data, weight: f.weight, style: "normal" as const };
      })
    ).catch((err) => {
      cached = null; // tenta de novo na próxima requisição
      throw err;
    });
  }
  return cached;
}
