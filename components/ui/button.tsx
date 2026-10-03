"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "./cn";

type Variant = "primario" | "vidro" | "fantasma" | "perigo" | "ia";
type Size = "md" | "lg" | "sm";

const base =
  "relative inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap transition-[transform,background,box-shadow,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primario:
    "bg-[var(--ink)] text-[var(--bg)] shadow-[0_10px_24px_-12px_rgba(18,32,26,0.6)] hover:shadow-[0_14px_30px_-12px_rgba(18,32,26,0.7)] hover:-translate-y-px",
  vidro: "vidro text-[var(--ink)] hover:bg-[var(--glass-strong)]",
  fantasma: "text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--line)]",
  perigo: "bg-[var(--perigo)] text-white hover:brightness-110",
  ia: "text-white [background-image:var(--ai)] shadow-[0_12px_30px_-12px_rgba(107,77,255,0.7)] hover:-translate-y-px",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-[14px]",
  lg: "h-13 px-6 text-base rounded-2xl min-h-[52px]",
};

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
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={loading || rest.disabled} {...rest}>
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
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
