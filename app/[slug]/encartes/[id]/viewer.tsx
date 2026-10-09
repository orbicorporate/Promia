"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Download, FileDown, Share2, Pencil, Copy, Trash2, Check, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink, Sheet, cn } from "@/components/ui";
import { plural } from "@/lib/plural";

const noop = () => () => {};

export function EncarteViewer({
  id,
  slug,
  name,
  pages,
  version,
  width,
  height,
  products,
  celebrate,
}: {
  id: string;
  slug: string;
  name: string;
  pages: number;
  version: string;
  width: number;
  height: number;
  products: number;
  celebrate: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [page, setPage] = useState(1);
  const [dir, setDir] = useState(1);
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const canShare = useSyncExternalStore(
    noop,
    () => "share" in navigator && "canShare" in navigator,
    () => false
  );
  const shown = useRef(false);

  const src = (p: number, download = false) => `/api/encartes/${id}/imagem?pagina=${p}&v=${encodeURIComponent(version)}${download ? "&download=1" : ""}`;

  useEffect(() => {
    if (celebrate && !shown.current) {
      shown.current = true;
      toast.success("Encarte pronto. Baixe ou compartilhe direto daqui.");
      router.replace(`/${slug}/encartes/${id}`, { scroll: false });
    }
  }, [celebrate, id, router, slug]);

  // pré-carrega as páginas vizinhas para a troca ser instantânea
  useEffect(() => {
    for (const p of [page + 1, page - 1]) {
      if (p >= 1 && p <= pages) {
        const img = new Image();
        img.src = src(p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pages]);

  function go(delta: number) {
    const next = Math.min(pages, Math.max(1, page + delta));
    if (next === page) return;
    setDir(delta);
    setPage(next);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function share() {
    setBusy("share");
    try {
      const files: File[] = [];
      for (let p = 1; p <= Math.min(pages, 10); p++) {
        const res = await fetch(src(p));
        if (!res.ok) throw new Error();
        const blob = await res.blob();
        files.push(new File([blob], `${name.replace(/[^\w\- ]+/g, "").trim() || "encarte"}-${p}.png`, { type: "image/png" }));
      }
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title: name });
      } else {
        toast.message("Este aparelho não compartilha imagens direto. Use Baixar.");
      }
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") toast.error("Não consegui preparar as imagens para compartilhar.");
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy("delete");
    try {
      const res = await fetch(`/api/encartes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Não consegui apagar o encarte.");
        return;
      }
      toast.success("Encarte apagado.");
      router.push(`/${slug}/encartes`);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div className="space-y-4">
        <div
          className="relative mx-auto w-full touch-pan-y overflow-hidden rounded-[24px] bg-[var(--line)] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] ring-1 ring-[var(--line)]"
          style={{ aspectRatio: `${width} / ${height}`, maxWidth: `calc(78vh * ${width / height})` }}
        >
          {!loaded[page] && <div className="esqueleto absolute inset-0 rounded-none" />}
          <AnimatePresence initial={false} custom={dir}>
            <motion.img
              key={page}
              src={src(page)}
              alt={`Página ${page} de ${pages} do encarte ${name}`}
              onLoad={() => setLoaded((l) => ({ ...l, [page]: true }))}
              custom={dir}
              initial={reduce ? false : { opacity: 0, x: dir * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -24, transition: { duration: 0.2 } }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              drag={pages > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                // distância ou velocidade: um peteleco rápido também troca de página
                if (info.offset.x < -60 || info.velocity.x < -400) go(1);
                else if (info.offset.x > 60 || info.velocity.x > 400) go(-1);
              }}
              className="absolute inset-0 h-full w-full cursor-grab select-none object-cover active:cursor-grabbing"
              draggable={false}
            />
          </AnimatePresence>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => go(-1)} disabled={page <= 1} className="vidro grid size-11 place-items-center rounded-full disabled:opacity-40" aria-label="Página anterior">
              <ChevronLeft className="size-5" />
            </button>
            <div className="flex items-center" role="tablist" aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  role="tab"
                  aria-selected={p === page}
                  aria-label={`Página ${p}`}
                  onClick={() => {
                    setDir(p > page ? 1 : -1);
                    setPage(p);
                  }}
                  className="grid h-11 w-7 place-items-center"
                >
                  <span className={cn("h-2 w-6 rounded-full transition-[transform,background-color]", p === page ? "scale-x-100 bg-[var(--ink)]" : "scale-x-[0.34] bg-[var(--line-strong)]")} />
                </button>
              ))}
            </div>
            <button onClick={() => go(1)} disabled={page >= pages} className="vidro grid size-11 place-items-center rounded-full disabled:opacity-40" aria-label="Próxima página">
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>

      <aside className="vidro space-y-3 rounded-[24px] p-4 lg:sticky lg:top-8">
        <p className="px-1 text-sm text-[var(--ink-2)]">
          {plural(products, "produto", "produtos")} em {plural(pages, "página", "páginas")}
        </p>
        {canShare && (
          <Button size="lg" className="w-full" onClick={share} loading={busy === "share"} icon={<Share2 className="size-5" />}>
            Compartilhar
          </Button>
        )}
        <a
          href={src(page, true)}
          download
          className={cn(
            "flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-medium transition active:scale-[0.97]",
            canShare ? "vidro hover:bg-[var(--glass-strong)]" : "bg-[var(--ink)] text-[var(--bg)]"
          )}
        >
          <Download className="size-5" /> Baixar imagem{pages > 1 ? ` (página ${page})` : ""}
        </a>
        <a
          href={`/api/encartes/${id}/pdf?v=${encodeURIComponent(version)}`}
          className="vidro flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-medium transition hover:bg-[var(--glass-strong)] active:scale-[0.97]"
        >
          <FileDown className="size-5" /> Baixar PDF para imprimir
        </a>
        <a
          href={`/api/encartes/${id}/cartazes`}
          className="vidro flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl font-medium transition hover:bg-[var(--glass-strong)] active:scale-[0.97]"
        >
          <Printer className="size-5" /> Cartazes de gôndola (A4)
        </a>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <ButtonLink href={`/${slug}/encartes/${id}/editar`} variant="fantasma" size="sm" className="flex-col h-auto py-2.5 gap-1" icon={<Pencil className="size-[18px]" />}>
            Editar
          </ButtonLink>
          <ButtonLink href={`/${slug}/encartes/novo?copiar=${id}`} variant="fantasma" size="sm" className="flex-col h-auto py-2.5 gap-1" icon={<Copy className="size-[18px]" />}>
            Duplicar
          </ButtonLink>
          <Button variant="fantasma" size="sm" className="flex-col h-auto py-2.5 gap-1 hover:text-[var(--perigo)]" onClick={() => setConfirmDelete(true)} icon={<Trash2 className="size-[18px]" />}>
            Apagar
          </Button>
        </div>
      </aside>

      <Sheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Apagar este encarte?"
        description="As imagens deixam de existir. Os produtos e preços do catálogo continuam como estão."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="vidro" onClick={() => setConfirmDelete(false)}>
              Manter
            </Button>
            <Button variant="perigo" onClick={remove} loading={busy === "delete"} icon={<Check className="size-4" />}>
              Apagar encarte
            </Button>
          </div>
        }
      >
        <p className="text-sm text-[var(--ink-2)]">{name}</p>
      </Sheet>
    </div>
  );
}
