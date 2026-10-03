// Marca do Promia: uma etiqueta de oferta com o furo do barbante.
export function PromiaLogo({ className = "h-8" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-full w-auto" aria-hidden>
        <path d="M6 8a4 4 0 0 1 4-4h14.5a4 4 0 0 1 2.9 1.2l8.4 8.9a4 4 0 0 1 0 5.6L21.7 34a4 4 0 0 1-5.7.1L7.2 25.6A4 4 0 0 1 6 22.7Z" fill="#FFCF3A" />
        <path d="M6 8a4 4 0 0 1 4-4h14.5a4 4 0 0 1 2.9 1.2l8.4 8.9a4 4 0 0 1 0 5.6L21.7 34a4 4 0 0 1-5.7.1L7.2 25.6A4 4 0 0 1 6 22.7Z" fill="none" stroke="#B8240F" strokeOpacity=".25" />
        <circle cx="13" cy="11" r="2.6" fill="#E8EFE9" stroke="#B8240F" strokeWidth="1.4" />
        <text x="22" y="26" textAnchor="middle" fontFamily="var(--font-titulo)" fontWeight="800" fontSize="15" fill="#B8240F">%</text>
      </svg>
      <span className="font-display text-[1.35em] font-extrabold leading-none tracking-tight">Promia</span>
    </span>
  );
}
