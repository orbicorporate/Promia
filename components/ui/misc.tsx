import { cn } from "./cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("esqueleto", className)} aria-hidden />;
}

export function Badge({
  tone = "neutro",
  className,
  children,
}: {
  tone?: "neutro" | "ok" | "atencao" | "perigo" | "ia";
  className?: string;
  children: React.ReactNode;
}) {
  const tones = {
    neutro: "bg-[var(--line)] text-[var(--ink-2)]",
    ok: "bg-[var(--folha-soft)] text-[var(--folha)]",
    atencao: "bg-[color-mix(in_srgb,var(--banana)_35%,transparent)] text-[var(--banana-ink)] dark:text-[var(--banana)]",
    perigo: "bg-[color-mix(in_srgb,var(--perigo)_14%,transparent)] text-[var(--perigo)]",
    ia: "bg-[color-mix(in_srgb,var(--uva)_14%,transparent)] text-[var(--uva)]",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", tones, className)}>{children}</span>;
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center px-6 py-10 gap-3", className)}>
      {icon && <div className="grid size-14 place-items-center rounded-2xl vidro text-[var(--ink-2)]">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="max-w-sm text-sm text-[var(--ink-2)]">{children}</div>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-bold">{title}</h2>
        {description && <p className="text-sm text-[var(--ink-2)] mt-0.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
