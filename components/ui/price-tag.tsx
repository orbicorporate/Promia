import { cn } from "./cn";

// A etiqueta de oferta: o mesmo elemento visual do encarte, usado na
// interface sempre que um preço é o assunto principal.
export function PriceTag({
  value,
  unit,
  size = "md",
  className,
}: {
  value: number | null | undefined;
  unit?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (value == null) {
    return <span className={cn("text-sm text-[var(--ink-3)]", className)}>sem preço</span>;
  }
  const [int, cents] = value.toFixed(2).split(".");
  const intFmt = Number(int).toLocaleString("pt-BR");
  const s = {
    sm: { box: "px-2 py-0.5 rounded-lg", rs: "text-[10px]", int: "text-lg", cents: "text-[11px]" },
    md: { box: "px-2.5 py-1 rounded-xl", rs: "text-xs", int: "text-2xl", cents: "text-sm" },
    lg: { box: "px-4 py-2 rounded-2xl", rs: "text-sm", int: "text-5xl", cents: "text-xl" },
  }[size];
  return (
    <span
      className={cn(
        "inline-flex items-start gap-0.5 bg-[var(--banana)] text-[var(--tomate-ink)] font-display font-extrabold leading-none tabular shadow-[0_3px_0_#c99a00]",
        s.box,
        className
      )}
      aria-label={`R$ ${int},${cents}${unit && unit !== "un" ? ` por ${unit}` : ""}`}
    >
      <span className={cn(s.rs, "mt-0.5")}>R$</span>
      <span className={s.int}>{intFmt}</span>
      <span className="flex flex-col items-start">
        <span className={s.cents}>,{cents}</span>
        {unit && unit !== "un" && <span className="text-[10px] font-semibold opacity-80">/{unit}</span>}
      </span>
    </span>
  );
}
