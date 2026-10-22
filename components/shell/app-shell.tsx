"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useState } from "react";
import { Home, LayoutGrid, Store, Plus, LogOut, ChevronLeft, CalendarDays, Ellipsis, ChartColumn, Crosshair, MapPinned, Library, Sparkles } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { MarketMark } from "./market-mark";
import { PromiaLogo } from "./logo";
import { cn } from "@/components/ui/cn";

export type ShellMarket = { name: string; slug: string; logoUrl: string | null; colorPrimary: string | null };

// "mobile": aparece na barra de baixo do celular; o resto fica em "Mais"
const NAV = [
  { key: "inicio", label: "Início", icon: Home, href: (s: string) => `/${s}`, mobile: true, hint: "" },
  { key: "encartes", label: "Encartes", icon: LayoutGrid, href: (s: string) => `/${s}/encartes`, mobile: true, hint: "" },
  { key: "pautas", label: "Pautas", icon: CalendarDays, href: (s: string) => `/${s}/pautas`, mobile: false, hint: "O que postar em cada dia" },
  { key: "gerente", label: "Gerente", icon: Sparkles, href: (s: string) => `/${s}/gerente`, mobile: false, hint: "Converse e receba ideias com os seus dados" },
  { key: "vendas", label: "Vendas", icon: ChartColumn, href: (s: string) => `/${s}/vendas`, mobile: false, hint: "Curva ABC, alta e queda, efeito dos encartes" },
  { key: "concorrencia", label: "Concorrência", icon: Crosshair, href: (s: string) => `/${s}/concorrencia`, mobile: false, hint: "Preços dos concorrentes e mercados por perto" },
  { key: "bairro", label: "Bairro e público", icon: MapPinned, href: (s: string) => `/${s}/bairro`, mobile: false, hint: "Públicos, setores para implantar e gôndolas" },
  { key: "biblioteca", label: "Biblioteca", icon: Library, href: (s: string) => `/${s}/produtos`, mobile: true, hint: "" },
  { key: "mercado", label: "Mercado", icon: Store, href: (s: string) => `/${s}/mercado`, mobile: false, hint: "Logo, cores, contatos e promoções fixas" },
] as const;

const GROUP_START: Record<string, string> = { gerente: "Inteligência", biblioteca: "Biblioteca", mercado: "Cadastro" };

function activeKey(pathname: string, slug: string) {
  const rest = pathname.slice(slug.length + 1);
  if (rest.startsWith("/produtos") || rest.startsWith("/emblemas") || rest.startsWith("/arquivos")) return "biblioteca";
  const hit = NAV.find((n) => n.key !== "inicio" && rest.startsWith(`/${n.key}`));
  return hit?.key ?? "inicio";
}

export function AppShell({
  market,
  isMaster,
  children,
}: {
  market: ShellMarket;
  isMaster: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = activeKey(pathname, market.slug);
  const creating = pathname.endsWith("/encartes/novo");
  const [more, setMore] = useState(false);
  const moreActive = NAV.some((n) => !n.mobile && n.key === active);

  return (
    <div className="min-h-dvh lg:pl-[272px]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[var(--ink)] focus:px-4 focus:py-3 focus:text-[var(--bg)]">
        Pular para o conteúdo
      </a>
      {/* barra lateral no computador */}
      <aside className="hidden lg:flex fixed inset-y-4 left-4 w-[248px] flex-col vidro rounded-[28px] p-4 z-30">
        <div className="px-2 pt-1 pb-5">
          <PromiaLogo className="h-10" />
        </div>
        <Link href={`/${market.slug}/mercado`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-[var(--line)] transition">
          <MarketMark name={market.name} logoUrl={market.logoUrl} color={market.colorPrimary} size={40} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{market.name}</span>
            <span className="block text-xs text-[var(--ink-3)]">Seu mercado</span>
          </span>
        </Link>
        <Link
          href={`/${market.slug}/encartes/novo`}
          className="relative mt-4 flex h-12 items-center justify-center gap-2 overflow-hidden rounded-full font-semibold text-white [background-image:linear-gradient(135deg,#e8284f_0%,#b3122f_55%,#8c0c26_100%)] shadow-[0_14px_30px_-14px_rgba(179,18,47,0.8)] transition before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2 before:bg-gradient-to-b before:from-white/30 before:to-transparent hover:-translate-y-px active:scale-[0.97]"
        >
          <Plus className="size-5" /> Novo encarte
        </Link>
        <nav className="rolagem -mx-1 mt-5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-1" aria-label="Principal">
          {NAV.map((item, idx) => {
            const Icon = item.icon;
            const on = item.key === active && !creating;
            // grupos: dia a dia, inteligência, cadastro
            const group = GROUP_START[item.key];
            return (
              <div key={item.key} className="contents">
              {group && <span className={cn("px-3 pb-1 text-xs font-medium text-[var(--ink-3)]", idx > 0 && "pt-3")}>{group}</span>}
              <Link
                href={item.href(market.slug)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors",
                  on ? "text-[var(--ink)]" : "text-[var(--ink-2)] hover:text-[var(--ink)]"
                )}
              >
                {on && (
                  <motion.span layoutId="nav-lateral" className="absolute inset-0 rounded-xl bg-[var(--glass-strong)] ring-1 ring-[var(--line)]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
                <Icon className="relative size-5" />
                <span className="relative">{item.label}</span>
              </Link>
              </div>
            );
          })}
        </nav>
        <div className="mt-3 space-y-1 border-t border-[var(--line)] pt-3">
          {isMaster && (
            <Link href="/master" className="flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-[var(--ink-2)] hover:bg-[var(--line)]">
              <ChevronLeft className="size-4" /> Painel Promia
            </Link>
          )}
          <form action="/sair" method="post">
            <button className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-sm text-[var(--ink-2)] hover:bg-[var(--line)]">
              <LogOut className="size-4" /> Sair
            </button>
          </form>
        </div>
      </aside>

      {/* topo no celular */}
      <header className="lg:hidden sticky top-0 z-30 px-4 pt-[calc(env(safe-area-inset-top)+10px)] pb-2">
        <div className="vidro flex items-center gap-3 rounded-2xl px-3 py-2">
          {isMaster ? (
            <Link href="/master" className="grid size-11 place-items-center rounded-lg hover:bg-[var(--line)]" aria-label="Voltar ao painel Promia">
              <ChevronLeft className="size-5" />
            </Link>
          ) : null}
          <MarketMark name={market.name} logoUrl={market.logoUrl} color={market.colorPrimary} size={32} />
          <span className="min-w-0 flex-1 truncate font-semibold">{market.name}</span>
          <form action="/sair" method="post">
            <button className="grid size-11 place-items-center rounded-lg text-[var(--ink-2)] hover:bg-[var(--line)]" aria-label="Sair">
              <LogOut className="size-[18px]" />
            </button>
          </form>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="outline-none pb-nav px-4 sm:px-6 lg:px-10 pt-2 lg:pt-8">
        <div className="mx-auto max-w-[1120px]">{children}</div>
      </main>

      {/* navegação flutuante no celular */}
      <nav
        aria-label="Principal"
        className="lg:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]"
      >
        <div className="vidro-forte mx-auto flex max-w-md items-center justify-between rounded-[26px] p-1.5">
          {NAV.filter((n) => n.mobile).slice(0, 2).map((item) => (
            <NavItem key={item.key} item={item} slug={market.slug} on={item.key === active && !creating} />
          ))}
          <Link
            href={`/${market.slug}/encartes/novo`}
            aria-label="Novo encarte"
            className="grid size-14 -my-4 place-items-center rounded-full [background-image:linear-gradient(135deg,#e8284f_0%,#b3122f_55%,#8c0c26_100%)] text-white shadow-[0_14px_30px_-10px_rgba(179,18,47,0.8)] ring-4 ring-[var(--bg)] transition active:scale-95"
          >
            <Plus className="size-7" />
          </Link>
          {NAV.filter((n) => n.mobile).slice(2).map((item) => (
            <NavItem key={item.key} item={item} slug={market.slug} on={item.key === active && !creating} />
          ))}
          <button
            type="button"
            onClick={() => setMore(true)}
            aria-label="Mais opções"
            className={cn("relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] text-xs font-medium transition-colors active:scale-95", moreActive ? "text-[var(--ink)]" : "text-[var(--ink-3)]")}
          >
            {moreActive && <span className="absolute inset-0 rounded-[20px] bg-[var(--line)]" />}
            <Ellipsis className="relative size-[22px]" />
            <span className="relative">Mais</span>
          </button>
        </div>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Mais">
        <ul className="space-y-2">
          {NAV.filter((n) => !n.mobile).map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.key}>
                <Link href={n.href(market.slug)} onClick={() => setMore(false)} className="flex items-center gap-3 rounded-2xl bg-[var(--glass-strong)] p-3 ring-1 ring-[var(--line)] active:scale-[0.99]">
                  <span className="grid size-11 place-items-center rounded-xl bg-[var(--line)]">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{n.label}</span>
                    <span className="block text-sm text-[var(--ink-2)]">{n.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </div>
  );
}

function NavItem({ item, slug, on }: { item: (typeof NAV)[number]; slug: string; on: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href(slug)}
      aria-current={on ? "page" : undefined}
      className={cn("relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px] text-xs font-medium transition-colors active:scale-95", on ? "text-[var(--ink)]" : "text-[var(--ink-3)]")}
    >
      {on && <motion.span layoutId="nav-baixo" className="absolute inset-0 rounded-[20px] bg-[var(--line)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
      <Icon className="relative size-[22px]" strokeWidth={on ? 2.3 : 1.9} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}
