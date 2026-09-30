import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // os templates de tabloide (lib/tabloidTemplates/*.html) são lidos com
  // fs.readFileSync em runtime (ver app/api/tabloides/[id]/render), então
  // sem isso o Vercel poda esses arquivos do bundle da função serverless
  // por não conseguir rastrear a dependência automaticamente.
  outputFileTracingIncludes: {
    "/api/tabloides/*/render": ["./lib/tabloidTemplates/*.html"],
  },
};

export default nextConfig;
