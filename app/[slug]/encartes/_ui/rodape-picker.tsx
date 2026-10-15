"use client";

import { Check } from "lucide-react";
import { cn } from "@/components/ui";
import {
  RODAPE_COR_HEX,
  RODAPE_COR_LABEL,
  RODAPE_CORES,
  RODAPE_ESTILO_LABEL,
  RODAPE_ESTILOS,
  RODAPE_PADRAO,
  RODAPE_TEXTO_MAX,
  type RodapeOpcoes,
} from "@/lib/encarte/rodape";

// Rodapé do encarte: o desenho, a cor e uma frase no lugar do endereço.

export function RodapePicker({ valor, onChange, endereco }: { valor: RodapeOpcoes; onChange: (v: RodapeOpcoes) => void; endereco: string }) {
  const set = (parcial: Partial<RodapeOpcoes>) => onChange({ ...valor, ...parcial });
  const padrao = valor.estilo === RODAPE_PADRAO.estilo && valor.cor === RODAPE_PADRAO.cor && valor.texto === RODAPE_PADRAO.texto;
  return (
    <div className="space-y-3 rounded-2xl bg-[var(--glass-strong)] p-3.5 ring-1 ring-[var(--line)]">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Rodapé</h4>
        <button type="button" onClick={() => onChange({ ...RODAPE_PADRAO })} disabled={padrao} className="text-xs text-[var(--ink-3)] underline-offset-2 enabled:hover:text-[var(--ink)] enabled:hover:underline disabled:opacity-40">
          Padrão
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Estilo do rodapé">
        {RODAPE_ESTILOS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => set({ estilo: e })}
            aria-pressed={valor.estilo === e}
            className={cn("h-9 rounded-full px-3.5 text-[13px] font-medium ring-1 transition active:scale-95", valor.estilo === e ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--line)] text-[var(--ink-2)] ring-transparent hover:text-[var(--ink)]")}
          >
            {RODAPE_ESTILO_LABEL[e]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Cor do rodapé">
        {RODAPE_CORES.map((c) => {
          const on = valor.cor === c;
          return c === "tema" ? (
            <button
              key={c}
              type="button"
              onClick={() => set({ cor: c })}
              aria-pressed={on}
              title="Acompanha o tema e o logo"
              className={cn("h-7 rounded-full px-3 text-xs font-medium ring-1 transition active:scale-95", on ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--line)] text-[var(--ink-2)] ring-transparent hover:text-[var(--ink)]")}
            >
              Cor do tema
            </button>
          ) : (
            <button
              key={c}
              type="button"
              onClick={() => set({ cor: c })}
              aria-label={RODAPE_COR_LABEL[c]}
              aria-pressed={on}
              title={RODAPE_COR_LABEL[c]}
              className={cn("grid size-6 place-items-center rounded-full ring-1 ring-[var(--line-strong)] transition active:scale-90", on && "ring-2 ring-[var(--ink)] ring-offset-1")}
              style={{ background: RODAPE_COR_HEX(c) }}
            >
              {on && <Check className="size-3.5" strokeWidth={3} style={{ color: c === "branco" || c === "dourado" ? "#141a24" : "#fff" }} aria-hidden />}
            </button>
          );
        })}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-[var(--ink-2)]">Frase no lugar do endereço</span>
        <input
          value={valor.texto}
          onChange={(e) => set({ texto: e.target.value.slice(0, RODAPE_TEXTO_MAX) })}
          maxLength={RODAPE_TEXTO_MAX}
          placeholder={endereco || "Ex.: Ofertas válidas enquanto durarem os estoques"}
          className="h-10 w-full rounded-xl bg-[var(--line)] px-3 text-sm text-[var(--ink)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--ink-3)] focus:ring-[var(--ink)]"
        />
      </label>
    </div>
  );
}
