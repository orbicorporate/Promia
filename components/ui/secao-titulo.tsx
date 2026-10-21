import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

// Cores do Promia para as bolinhas de ícone das telas de análise.
export const BOLA = {
  verde: "bg-[#138a4c] text-white shadow-[0_8px_18px_-8px_rgba(19,138,76,0.9)]",
  tomate: "bg-[#ef4127] text-white shadow-[0_8px_18px_-8px_rgba(239,65,39,0.9)]",
  uva: "bg-[#6b4dff] text-white shadow-[0_8px_18px_-8px_rgba(107,77,255,0.9)]",
  banana: "bg-[#ffcf3a] text-[#5a3f00] shadow-[0_8px_18px_-8px_rgba(255,207,58,1)]",
  azul: "bg-[#1c8fe0] text-white shadow-[0_8px_18px_-8px_rgba(28,143,224,0.9)]",
  cinza: "bg-[#6f8178] text-white shadow-[0_8px_18px_-8px_rgba(111,129,120,0.9)]",
} as const;
export type CorBola = keyof typeof BOLA;

export function Bola({ Icone, cor, className }: { Icone: LucideIcon; cor: CorBola; className?: string }) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", BOLA[cor], className)}>
      <Icone className="size-5" aria-hidden />
    </span>
  );
}

export function SecaoTitulo({ id, Icone, cor, children, sub }: { id?: string; Icone: LucideIcon; cor: CorBola; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Bola Icone={Icone} cor={cor} />
      <div className="min-w-0">
        <h2 id={id} className="font-display text-xl font-extrabold leading-tight">{children}</h2>
        {sub && <p className="mt-0.5 text-base text-[var(--ink-2)]">{sub}</p>}
      </div>
    </div>
  );
}
