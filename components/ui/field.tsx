"use client";

import { Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "./cn";

export const inputClass =
  "w-full h-11 rounded-[14px] bg-[var(--glass-strong)] border border-[var(--line)] px-3.5 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none transition focus:border-[var(--uva)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--uva)_18%,transparent)]";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--ink-2)]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-[var(--perigo)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClass, "h-auto min-h-24 py-3 leading-relaxed", className)} {...rest} />;
}

type Opcao = { value: string; label: string; dot?: string };

function lerOpcoes(children: React.ReactNode): Opcao[] {
  const out: Opcao[] = [];
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const p = c.props as { value?: string | number; children?: React.ReactNode; "data-dot"?: string };
    const label = Children.toArray(p.children).join("");
    out.push({ value: String(p.value ?? label), label, dot: p["data-dot"] });
  });
  return out;
}

type SelectProps = {
  id?: string;
  value: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  children: React.ReactNode;
  "aria-label"?: string;
  disabled?: boolean;
};

// Seletor próprio (no lugar do select nativo): painel de vidro, marca o item atual,
// aceita bolinha de cor em cada opção via data-dot e funciona só com o teclado.
export function Select({ id, value, onChange, className, children, disabled, ...rest }: SelectProps) {
  const opcoes = lerOpcoes(children);
  const atual = opcoes.find((o) => o.value === String(value));
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; max: number } | null>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const uid = useId();

  function abrir() {
    const idx = opcoes.findIndex((o) => o.value === String(value));
    setAtivo(idx < 0 ? 0 : idx);
    setAberto(true);
  }
  function escolher(v: string) {
    onChange?.({ target: { value: v } });
    setAberto(false);
    botao.current?.focus();
  }

  useLayoutEffect(() => {
    if (!aberto || !botao.current) return;
    const r = botao.current.getBoundingClientRect();
    const abaixo = window.innerHeight - r.bottom - 12;
    const acima = r.top - 12;
    const sobe = abaixo < 220 && acima > abaixo;
    setPos(
      sobe
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6, max: Math.min(320, acima) }
        : { left: r.left, width: r.width, top: r.bottom + 6, max: Math.min(320, abaixo) },
    );
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => {
      const t = e.target as Node;
      if (botao.current?.contains(t) || lista.current?.contains(t)) return;
      setAberto(false);
    };
    const fecha = (e: Event) => {
      if (lista.current?.contains(e.target as Node)) return;
      setAberto(false);
    };
    document.addEventListener("pointerdown", fora);
    window.addEventListener("resize", fecha);
    window.addEventListener("scroll", fecha, true);
    return () => {
      document.removeEventListener("pointerdown", fora);
      window.removeEventListener("resize", fecha);
      window.removeEventListener("scroll", fecha, true);
    };
  }, [aberto]);

  useEffect(() => {
    if (aberto) lista.current?.children[ativo]?.scrollIntoView({ block: "nearest" });
  }, [ativo, aberto, pos]);

  function tecla(e: React.KeyboardEvent) {
    if (!aberto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setAberto(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => Math.min(opcoes.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setAtivo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setAtivo(opcoes.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (opcoes[ativo]) escolher(opcoes[ativo].value);
    } else if (e.key === "Tab") {
      setAberto(false);
    } else if (e.key.length === 1) {
      const i = opcoes.findIndex((o) => o.label.toLowerCase().startsWith(e.key.toLowerCase()));
      if (i >= 0) setAtivo(i);
    }
  }

  return (
    <>
      <button
        ref={botao}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${uid}-lista`}
        aria-label={rest["aria-label"]}
        disabled={disabled}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={tecla}
        className={cn(inputClass, "flex items-center gap-2.5 pr-3 text-left disabled:opacity-50", aberto && "border-[var(--uva)] ring-4 ring-[color-mix(in_srgb,var(--uva)_18%,transparent)]", className)}
      >
        {atual?.dot && <span className="size-2.5 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: atual.dot }} aria-hidden />}
        <span className="min-w-0 flex-1 truncate">{atual?.label ?? ""}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-[var(--ink-3)] transition-transform duration-200", aberto && "rotate-180")} aria-hidden />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {aberto && pos && (
              <motion.ul
                ref={lista}
                id={`${uid}-lista`}
                role="listbox"
                initial={{ opacity: 0, y: pos.top != null ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: "fixed", left: pos.left, width: Math.max(pos.width, 180), top: pos.top, bottom: pos.bottom, maxHeight: pos.max }}
                className="vidro-forte rolagem z-[100] overflow-y-auto rounded-2xl p-1.5 shadow-[0_24px_50px_-18px_rgba(0,0,0,0.45)]"
              >
                {opcoes.map((o, i) => {
                  const sel = o.value === String(value);
                  return (
                    <li
                      key={o.value + i}
                      role="option"
                      aria-selected={sel}
                      onPointerEnter={() => setAtivo(i)}
                      onClick={() => escolher(o.value)}
                      className={cn(
                        "flex min-h-10 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-[15px] text-[var(--ink)] transition-colors",
                        i === ativo && "bg-[color-mix(in_srgb,var(--uva)_10%,transparent)]",
                        sel && "font-semibold",
                      )}
                    >
                      {o.dot && <span className="size-2.5 shrink-0 rounded-full ring-2 ring-white/70" style={{ background: o.dot }} aria-hidden />}
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {sel && <Check className="size-4 shrink-0 text-[var(--uva)]" aria-hidden />}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
