"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Upload, Loader2 } from "lucide-react";
import { Button, Input, Sheet } from "@/components/ui";
import { ImportProducts } from "../../_ui/import-products";

export function SearchBox({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString());
      if (q.trim()) next.set("q", q.trim());
      else next.delete("q");
      next.delete("pagina");
      start(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
  }, [q, sp, pathname, router]);

  return (
    <div className="relative flex-1">
      {pending ? (
        <Loader2 className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 animate-spin text-[var(--ink-3)]" />
      ) : (
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--ink-3)]" />
      )}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, marca, código ou EAN" className="pl-10" aria-label="Buscar produtos" type="search" />
    </div>
  );
}

export function ImportButton({ marketId, openInitially, primary }: { marketId: string; openInitially: boolean; primary?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(openInitially);
  return (
    <>
      <Button variant={primary ? "primario" : "vidro"} icon={<Upload className="size-4" />} onClick={() => setOpen(true)}>
        Enviar planilha
      </Button>
      <Sheet
        open={open}
        onClose={() => {
          setOpen(false);
          if (openInitially) router.replace("?", { scroll: false });
        }}
        title="Atualizar produtos pela planilha"
        description="Produtos com o mesmo código são atualizados; os novos entram no catálogo e vão para a fila de fotos."
        wide
      >
        <ImportProducts marketId={marketId} onImported={() => router.refresh()} />
      </Sheet>
    </>
  );
}
