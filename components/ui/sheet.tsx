"use client";

import { useEffect, useId } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "./cn";

// Folha que sobe de baixo no celular e vira um painel central no
// computador. Fecha com Esc, clique fora ou o botão.
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const id = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby={id}>
          <motion.div
            className="absolute inset-0 bg-[rgba(10,20,15,0.35)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "vidro-forte relative w-full sm:mx-4 max-h-[92dvh] flex flex-col rounded-t-[28px] sm:rounded-[28px]",
              wide ? "sm:max-w-3xl" : "sm:max-w-lg"
            )}
            initial={reduce ? { opacity: 0 } : { y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[var(--line-strong)] sm:hidden" aria-hidden />
            <div className="flex items-start justify-between gap-4 px-6 pt-4 sm:pt-6">
              <div>
                <h2 id={id} className="text-xl font-bold">
                  {title}
                </h2>
                {description && <p className="text-sm text-[var(--ink-2)] mt-1">{description}</p>}
              </div>
              <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-[var(--line)]" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            <div className="rolagem overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-[var(--line)] px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:pb-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
