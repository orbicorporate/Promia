import Link from "next/link";
import { Package, Award, Palette, ImageIcon } from "lucide-react";
import { cn } from "@/components/ui";

const ABAS = [
  { key: "produtos", label: "Produtos e fotos", Icone: Package, href: (s: string) => `/${s}/produtos` },
  { key: "emblemas", label: "Emblemas", Icone: Award, href: (s: string) => `/${s}/emblemas` },
  { key: "arquivos", label: "Meus arquivos", Icone: ImageIcon, href: (s: string) => `/${s}/arquivos` },
  { key: "marca", label: "Marca e logo", Icone: Palette, href: (s: string) => `/${s}/mercado` },
] as const;

// Abas da Biblioteca: tudo que o mercado usa para montar o encarte.
export function BibliotecaAbas({ slug, ativa }: { slug: string; ativa: "produtos" | "emblemas" | "arquivos" }) {
  return (
    <nav aria-label="Biblioteca" className="flex flex-wrap gap-2">
      {ABAS.map(({ key, label, Icone, href }) => {
        const on = key === ativa;
        return (
          <Link
            key={key}
            href={href(slug)}
            aria-current={on ? "page" : undefined}
            className={cn("inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition", on ? "bg-[var(--ink)] text-[var(--bg)] shadow-md" : "bg-[var(--glass-strong)] text-[var(--ink-2)] ring-1 ring-[var(--line)] hover:text-[var(--ink)]")}
          >
            <Icone className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
