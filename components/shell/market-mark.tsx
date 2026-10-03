/* eslint-disable @next/next/no-img-element */
import { cn } from "@/components/ui/cn";

// Logo do mercado, ou um monograma com a inicial na cor da marca.
export function MarketMark({
  name,
  logoUrl,
  color,
  size = 40,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <span
        className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[var(--line)]", className)}
        style={{ width: size, height: size }}
      >
        <img src={logoUrl} alt={`Logo ${name}`} className="h-full w-full object-contain p-1" />
      </span>
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "M";
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-xl font-display font-extrabold text-white", className)}
      style={{ width: size, height: size, background: color || "var(--folha)", fontSize: size * 0.46 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
