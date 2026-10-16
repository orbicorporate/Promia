"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type Variant = "primario" | "vidro" | "fantasma" | "perigo" | "ia" | "rosa";
type Size = "md" | "lg" | "sm";

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap transition-[transform,background,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // cereja em degradê, brilho no topo e uma faixa de luz que cruza o botão no hover
  primario:
    "overflow-hidden text-white [background-image:linear-gradient(135deg,#e8284f_0%,#b3122f_55%,#8c0c26_100%)] shadow-[0_12px_28px_-12px_rgba(179,18,47,0.75)] hover:-translate-y-px hover:shadow-[0_16px_32px_-12px_rgba(179,18,47,0.85)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/30 before:to-transparent after:pointer-events-none after:absolute after:inset-y-0 after:-left-1/3 after:w-1/4 after:-skew-x-12 after:bg-white/35 after:opacity-0 motion-safe:after:transition-all motion-safe:after:duration-700 hover:after:left-[110%] hover:after:opacity-100 focus-visible:after:left-[110%] focus-visible:after:opacity-100",
  vidro: "vidro text-[var(--ink)] hover:bg-[var(--glass-strong)]",
  fantasma: "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--line)]",
  perigo: "bg-[var(--perigo)] text-white hover:brightness-110",
  rosa: "bg-[#e11d74] text-white shadow-[0_12px_28px_-12px_rgba(225,29,116,0.75)] hover:bg-[#c8135f] hover:-translate-y-px",
  ia: "text-white [background-image:var(--ai)] shadow-[0_12px_30px_-12px_rgba(107,77,255,0.7)] hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-[14px]",
  lg: "h-13 px-6 text-base rounded-2xl min-h-[52px]",
};

// botão principal (cereja) é sempre em pílula
const redondo = (variant: Variant, size: Size) => (variant === "primario" ? sizes[size].replace(/rounded-\S+/, "rounded-full") : sizes[size]);

type Common = { variant?: Variant; size?: Size; loading?: boolean; icon?: React.ReactNode; className?: string; children?: React.ReactNode };

export function Button({
  variant = "primario",
  size = "md",
  loading,
  icon,
  className,
  children,
  ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], redondo(variant, size), className)} disabled={loading || rest.disabled} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primario",
  size = "md",
  icon,
  className,
  children,
  ...rest
}: Common & { href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={cn(base, variants[variant], redondo(variant, size), className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
