import { PromiaLogo } from "./logo";

// Tela simples para situações de conta (sem mercado, mercado removido).
export function StatusScreen({ title, children, action }: { title: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5">
      <div className="vidro w-full max-w-sm space-y-4 rounded-[26px] p-7">
        <PromiaLogo className="h-8" />
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        <div className="text-[var(--ink-2)]">{children}</div>
        {action}
      </div>
    </main>
  );
}
