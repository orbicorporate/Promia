import { ImageResponse } from "next/og";
import { loadEncarteFonts } from "./fonts";
import { renderModelo } from "./modelos";
import { renderEncartePage } from "./render";
import type { EncarteData } from "./types";

// Desenha uma página do encarte em PNG. Renderiza até o fim antes de
// devolver (em vez de mandar o stream do ImageResponse direto), para um
// erro de desenho virar uma resposta 500 de verdade e não um PNG cortado.
// `data` já deve ter as imagens em data URI (lib/encarte/images.ts).

export type EncartePng = { png: Uint8Array; width: number; height: number; pageIndex: number; pageCount: number };

export async function renderEncartePng(data: EncarteData, pageIndex: number): Promise<EncartePng | null> {
  const page = (data.modelo ? renderModelo(data, pageIndex) : null) ?? renderEncartePage(data, pageIndex);
  if (!page) return null;
  const fonts = await loadEncarteFonts();
  const response = new ImageResponse(page.element, { width: page.width, height: page.height, fonts });
  const png = new Uint8Array(await response.arrayBuffer());
  if (png.byteLength === 0) throw new Error("Renderização do encarte voltou vazia.");
  return { png, width: page.width, height: page.height, pageIndex: page.pageIndex, pageCount: page.pageCount };
}
