"use client";

import { AlignCenter, AlignLeft, AlignRight, Check } from "lucide-react";
import { cn } from "@/components/ui";
import {
  VALIDADE_ALINHAMENTOS,
  VALIDADE_COR_HEX,
  VALIDADE_COR_LABEL,
  VALIDADE_CORES,
  VALIDADE_ESTILO_LABEL,
  VALIDADE_ESTILOS,
  VALIDADE_PADRAO,
  VALIDADE_ROTULO_MAX,
  VALIDADE_POSICAO_LABEL,
  VALIDADE_POSICOES,
  type ValidadeAlinhamento,
  type ValidadeOpcoes,
} from "@/lib/encarte/validade";

// Escolha da validade, em duas linhas pequenas: onde ela fica (e para que lado)
// e como ela é (estilo e cor). Sem desenhos nem texto de ajuda.

const ICONE: Record<ValidadeAlinhamento, typeof AlignLeft> = { esquerda: AlignLeft, centro: AlignCenter, direita: AlignRight };

function Grupo<T extends string>({ valor, opcoes, rotulo, onChange }: { valor: T; opcoes: readonly T[]; rotulo: (v: T) => React.ReactNode; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-[var(--line)] p-0.5">
      {opcoes.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={valor === v}
          className={cn("grid h-7 place-items-center rounded-md px-2 text-[11px] font-medium transition active:scale-95", valor === v ? "bg-[var(--glass-strong)] text-[var(--ink)] shadow-sm" : "text-[var(--ink-2)] hover:text-[var(--ink)]")}
        >
          {rotulo(v)}
        </button>
      ))}
    </div>
  );
}

const campo = "h-8 min-w-0 rounded-lg bg-[var(--line)] px-2 text-xs text-[var(--ink)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--ink-3)] focus:ring-[var(--ink)]";

export function ValidadePicker({
  valor,
  onChange,
  de,
  ate,
  onDe,
  onAte,
}: {
  valor: ValidadeOpcoes;
  onChange: (v: ValidadeOpcoes) => void;
  de: string;
  ate: string;
  onDe: (v: string) => void;
  onAte: (v: string) => void;
}) {
  const set = (parcial: Partial<ValidadeOpcoes>) => onChange({ ...valor, ...parcial });
  const padrao = (Object.keys(VALIDADE_PADRAO) as (keyof ValidadeOpcoes)[]).every((k) => valor[k] === VALIDADE_PADRAO[k]);
  const oculto = valor.posicao === "oculto";
  return (
    <div className="space-y-1.5 rounded-xl bg-[var(--glass-strong)] px-2.5 py-2 ring-1 ring-[var(--line)]">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold">Validade</h4>
        <button type="button" onClick={() => onChange({ ...VALIDADE_PADRAO })} disabled={padrao} className="text-[11px] text-[var(--ink-3)] underline-offset-2 enabled:hover:text-[var(--ink)] enabled:hover:underline disabled:opacity-40">
          Voltar ao estilo original
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Grupo valor={valor.posicao} opcoes={VALIDADE_POSICOES} rotulo={(v) => VALIDADE_POSICAO_LABEL[v]} onChange={(posicao) => set({ posicao })} />
      </div>

      {!oculto && (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <Grupo valor={valor.alinhamento} opcoes={VALIDADE_ALINHAMENTOS} rotulo={(v) => { const I = ICONE[v]; return <I className="size-3.5" aria-label={v} />; }} onChange={(alinhamento) => set({ alinhamento })} />
          <Grupo valor={valor.estilo} opcoes={VALIDADE_ESTILOS} rotulo={(v) => VALIDADE_ESTILO_LABEL[v]} onChange={(estilo) => set({ estilo })} />
          <div className="flex items-center gap-1" role="group" aria-label="Cor da validade">
            {VALIDADE_CORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ cor: c })}
                aria-label={VALIDADE_COR_LABEL[c]}
                aria-pressed={valor.cor === c}
                title={VALIDADE_COR_LABEL[c]}
                className={cn("grid size-5 place-items-center rounded-full ring-1 ring-[var(--line-strong)] transition active:scale-90", valor.cor === c && "ring-2 ring-[var(--ink)] ring-offset-1")}
                style={{ background: VALIDADE_COR_HEX[c] }}
              >
                {valor.cor === c && <Check className="size-3" strokeWidth={3} style={{ color: c === "branco" || c === "dourado" ? "#141a24" : "#fff" }} aria-hidden />}
              </button>
            ))}
          </div>
        </div>
      )}

      {!oculto && (
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            value={valor.rotulo}
            onChange={(e) => set({ rotulo: e.target.value.slice(0, VALIDADE_ROTULO_MAX) })}
            maxLength={VALIDADE_ROTULO_MAX}
            placeholder="Texto: VÁLIDO"
            aria-label="Texto da tag de validade (vazio = automático)"
            className={cn(campo, "w-28")}
          />
          <input type="date" value={de} onChange={(e) => onDe(e.target.value)} aria-label="Válido de" className={cn(campo, "w-[7.6rem]")} />
          <span className="text-[11px] text-[var(--ink-3)]">a</span>
          <input type="date" value={ate} min={de || undefined} onChange={(e) => onAte(e.target.value)} aria-label="Válido até" className={cn(campo, "w-[7.6rem]")} />
        </div>
      )}
    </div>
  );
}
