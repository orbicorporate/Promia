import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // os templates de tabloide (lib/tabloidTemplates/*.html) são lidos com
  // fs.readFileSync em runtime (ver app/api/tabloides/[id]/render), então
  // sem isso o Vercel poda esses arquivos do bundle da função serverless
  // por não conseguir rastrear a dependência automaticamente.
  //
  // Mesmo motivo para as fontes do encarte (assets/fonts/*.woff), lidas com
  // readFile por lib/encarte/fonts.ts nas rotas de imagem, PDF e prévia.
  outputFileTracingIncludes: {
    "/api/tabloides/*/render": ["./lib/tabloidTemplates/*.html"],
    "/api/encartes/**": ["./assets/fonts/*.woff"],
  },
};

export default nextConfig;
