import Link from "next/link";

// Cabeçalho simples, igual em todas as telas: onde estou, como volto, sair.
export function AppHeader({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="text-sm text-neutral-500 hover:text-neutral-800">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-xl font-semibold text-neutral-900 truncate">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      <form action="/sair" method="post">
        <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900 px-2 py-1">
          Sair
        </button>
      </form>
    </header>
  );
}
