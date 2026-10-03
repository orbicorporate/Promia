import { NextResponse } from "next/server";
import { canAccessMarket, getViewer, isUuid } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEncarte, type LoadedEncarte } from "./load";
import { slugify } from "./text";

// Partes comuns das rotas de encarte (imagem, PDF e prévia).

export const NO_STORE = "private, no-store";

export function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "cache-control": NO_STORE } });
}

// Content-Disposition com nome amigável e versão UTF-8 (RFC 6266/5987)
export function contentDisposition(kind: "inline" | "attachment", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export function pageFileName(encarteName: string, pageNumber: number): string {
  return `${slugify(encarteName)}-pagina-${pageNumber}.png`;
}

export function pdfFileName(encarteName: string): string {
  return `${slugify(encarteName)}.pdf`;
}

// Login + acesso ao mercado do encarte. Encarte de outro mercado responde
// 404 (não revela que existe).
export async function loadAuthorizedEncarte(id: string): Promise<{ ok: true; loaded: LoadedEncarte } | { ok: false; response: NextResponse }> {
  if (!isUuid(id)) return { ok: false, response: jsonError(404, "Encarte não encontrado.") };
  const who = await getViewer();
  if (who.status !== "ok") return { ok: false, response: jsonError(401, "Sua sessão expirou. Entre de novo.") };
  let loaded: LoadedEncarte | null;
  try {
    loaded = await loadEncarte(createAdminClient(), id);
  } catch (err) {
    console.error("[encarte] load", err);
    return { ok: false, response: jsonError(500, "Não consegui carregar esse encarte agora. Tente de novo.") };
  }
  if (!loaded || !canAccessMarket(who.viewer, loaded.marketId)) return { ok: false, response: jsonError(404, "Encarte não encontrado.") };
  return { ok: true, loaded };
}

// "?pagina=2" -> 1 (0-based). Ausente = primeira. Inválida = null.
export function parsePageParam(value: string | null): number | null {
  if (value == null || value === "") return 0;
  if (!/^\d{1,4}$/.test(value)) return null;
  const n = Number(value);
  return n >= 1 ? n - 1 : null;
}

export function pngResponse(png: Uint8Array, opts: { fileName: string; download: boolean; pageIndex: number; pageCount: number; extraHeaders?: Record<string, string> }) {
  return new Response(png as BodyInit, {
    status: 200,
    headers: {
      "content-type": "image/png",
      "content-length": String(png.byteLength),
      "content-disposition": contentDisposition(opts.download ? "attachment" : "inline", opts.fileName),
      "cache-control": NO_STORE,
      "x-encarte-pagina": String(opts.pageIndex + 1),
      "x-encarte-paginas": String(opts.pageCount),
      ...opts.extraHeaders,
    },
  });
}
