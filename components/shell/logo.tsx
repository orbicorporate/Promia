// Marca do Promia: a palavra com a sacola no "m". Duas versões do mesmo logo:
// escura (para fundos claros, o padrão) e clara (para fundos escuros).
export function PromiaLogo({ className = "h-8", tom = "escuro" }: { className?: string; tom?: "escuro" | "claro" }) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/logo/promia-${tom}.png`} alt="Promia" className="h-full w-auto" width={900} height={324} decoding="async" />
    </span>
  );
}
