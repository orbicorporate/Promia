import { NextRequest, NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { fetchPublicImage } from "@/lib/net";

export const runtime = "nodejs";

// Repassa a foto de um produto pelo próprio Promia. Sem isso, fotos de
// sites que não liberam CORS aparecem na tela mas somem do PNG gerado no
// navegador. Só para quem está logado e só para imagens.
export async function GET(req: NextRequest) {
  const who = await getViewer();
  if (who.status !== "ok") return new NextResponse(null, { status: 401 });

  const target = req.nextUrl.searchParams.get("u");
  if (!target) return new NextResponse(null, { status: 400 });

  const image = await fetchPublicImage(target);
  if (!image) return new NextResponse(null, { status: 404 });

  return new NextResponse(image.body, {
    headers: {
      "content-type": image.contentType,
      "cache-control": "private, max-age=86400",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'",
    },
  });
}
