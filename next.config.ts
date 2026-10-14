import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As fontes do encarte (assets/fonts/*.woff) são lidas com readFile por
  // lib/encarte/fonts.ts nas rotas de imagem, PDF e prévia; sem isso o
  // Vercel poda esses arquivos do bundle da função serverless. Os recortes dos
  // fundos de arte (8,8 MB) também vão no bundle: sem isso cada função nova
  // baixava as imagens do próprio site antes de desenhar a primeira prévia.
  outputFileTracingIncludes: {
    "/api/encartes/**": ["./assets/fonts/*.woff", "./public/fundos/arte/*.webp"],
  },
};

export default nextConfig;
