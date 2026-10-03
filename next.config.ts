import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // As fontes do encarte (assets/fonts/*.woff) são lidas com readFile por
  // lib/encarte/fonts.ts nas rotas de imagem, PDF e prévia; sem isso o
  // Vercel poda esses arquivos do bundle da função serverless.
  outputFileTracingIncludes: {
    "/api/encartes/**": ["./assets/fonts/*.woff"],
  },
};

export default nextConfig;
