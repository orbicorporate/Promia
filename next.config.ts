import type { NextConfig } from "next";

// Imagens fixas do app (miniaturas de logos, fundos e combinações): o navegador
// guarda por um dia e confere em segundo plano, em vez de perguntar ao servidor
// a cada visita. Os arquivos mudam de vez em quando, por isso não é "imutável".
const cacheLongo = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/emblemas/t/:path*", headers: cacheLongo },
      { source: "/miniaturas/:path*", headers: cacheLongo },
      { source: "/fundos/:path*", headers: cacheLongo },
    ];
  },
  // As fontes do encarte (assets/fonts/*.woff) são lidas com readFile por
  // lib/encarte/fonts.ts nas rotas de imagem, PDF e prévia; sem isso o
  // Vercel poda esses arquivos do bundle da função serverless. Os recortes dos
  // fundos de arte (8,8 MB) também vão no bundle: sem isso cada função nova
  // baixava as imagens do próprio site antes de desenhar a primeira prévia.
  outputFileTracingIncludes: {
    "/api/encartes/**": ["./assets/fonts/*.woff", "./public/fundos/arte/*.webp", "./public/emblemas/t/*.webp"],
  },
};

export default nextConfig;
