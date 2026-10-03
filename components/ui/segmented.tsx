"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "./cn";

// Seletor em pílula, com o marcador deslizando até a opção escolhida.
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; icon?: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
  label: string;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cn("vidro inline-flex rounded-2xl p-1 gap-1", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-center justify-center gap-1.5 rounded-xl font-medium transition-colors",
              size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
              active ? "text-[var(--bg)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-[var(--ink)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
