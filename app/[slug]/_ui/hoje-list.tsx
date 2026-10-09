import Link from "next/link";
import { CalendarHeart, Sparkles, Send, Camera, Tag, BrainCircuit, Repeat, FileSpreadsheet, ArrowRight, TrendingUp, TrendingDown, Scale, PackageX, BarChart3 } from "lucide-react";
import { Glass, cn } from "@/components/ui";
import type { HojeAction } from "@/lib/hoje";

const ICONS = {
  calendario: CalendarHeart,
  campanha: Sparkles,
  postar: Send,
  fotos: Camera,
  preco: Tag,
  gerente: BrainCircuit,
  fixa: Repeat,
  primeiro: FileSpreadsheet,
  alta: TrendingUp,
  queda: TrendingDown,
  concorrencia: Scale,
  parado: PackageX,
  vendas: BarChart3,
} as const;

const TONE = {
  urgente: "bg-[var(--tomate)] text-white",
  oportunidade: "bg-[color-mix(in_srgb,var(--uva)_14%,transparent)] text-[var(--uva)]",
  rotina: "bg-[var(--line)] text-[var(--ink-2)]",
} as const;

// Lista de ações do dia: cada linha é um atalho para resolver a coisa.
export function HojeList({ actions }: { actions: HojeAction[] }) {
  if (actions.length === 0) {
    return (
      <Glass className="flex items-center gap-4 p-5">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--folha-soft)] text-[var(--folha)]">
          <Sparkles className="size-5" />
        </span>
        <p className="text-[var(--ink-2)]">Tudo em dia. Quando surgir uma data, uma oferta para montar ou uma campanha para postar, aparece aqui.</p>
      </Glass>
    );
  }
  return (
    <Glass as="section" className="overflow-hidden" aria-labelledby="hoje">
      <h2 id="hoje" className="px-5 pt-5 text-lg font-bold sm:px-6">
        Para fazer hoje
      </h2>
      <ul className="mt-2 divide-y divide-[var(--line)]">
        {actions.map((a) => {
          const Icon = ICONS[a.icon];
          return (
            <li key={a.id}>
              <Link href={a.href} className="group flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--glass-strong)] active:bg-[var(--line)] sm:px-6">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", TONE[a.tone])}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug">{a.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-[var(--ink-2)]">{a.detail}</span>
                </span>
                <span className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--ink-2)] group-hover:text-[var(--ink)] sm:flex">
                  {a.cta} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <ArrowRight className="size-5 shrink-0 text-[var(--ink-3)] sm:hidden" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Glass>
  );
}
