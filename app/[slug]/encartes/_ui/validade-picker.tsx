"use client";

import { Ban } from "lucide-react";
import { cn } from "@/components/ui";
import { VALIDADE_ESTILOS, VALIDADE_ESTILO_PADRAO, VALIDADE_POSICAO_PADRAO, VALIDADE_POSICOES, type ValidadeEstilo, type ValidadePosicao } from "@/lib/encarte/validade";

// Escolha visual da validade: um mini encarte mostra ONDE ela fica e uma
// amostra mostra COMO ela aparece. Sem texto técnico, só o desenho e um nome curto.

const NOME_POSICAO: Record<ValidadePosicao, string> = {
  abaixo: "Abaixo do logo",
  sobre: "Na emenda",
  canto: "No canto",
  base: "Embaixo",
  oculto: "Sem data",
};

const NOME_ESTILO: Record<ValidadeEstilo, string> = {
  pilula: "Escura",
  selo: "Selo",
  etiqueta: "Dourada",
  claro: "Clara",
  texto: "Só texto",
};

const OURO = "#f5b800";

function MiniEncarte({ pos }: { pos: ValidadePosicao }) {
  const marca = (() => {
    if (pos === "oculto") return null;
    const base = "absolute rounded-[3px] shadow-sm";
    if (pos === "canto") return <span className={cn(base, "right-1 top-1 size-3.5 rounded-full")} style={{ background: OURO }} />;
    const top = pos === "abaixo" ? "37%" : pos === "sobre" ? "calc(32% - 3px)" : "81%";
    return <span className={cn(base, "left-1/2 h-1.5 w-8 -translate-x-1/2")} style={{ top, background: OURO }} />;
  })();
  return (
    <span className="relative block h-[76px] w-[58px] overflow-hidden rounded-lg bg-[var(--line)] ring-1 ring-[var(--line-strong)]" aria-hidden>
      <span className="absolute inset-x-0 top-0 h-[32%] bg-[var(--ink)]/30" />
      <span className="absolute left-1/2 top-[8%] h-[16%] w-[44%] -translate-x-1/2 rounded-[3px] bg-[var(--ink)]/40" />
      <span className="absolute inset-x-1.5 top-[46%] grid grid-cols-3 gap-[3px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-[11px] rounded-[2px] bg-white/80" />
        ))}
      </span>
      <span className="absolute inset-x-0 bottom-0 h-[9%] bg-[var(--ink)]/35" />
      {marca}
      {pos === "oculto" && (
        <span className="absolute inset-0 grid place-items-center">
          <Ban className="size-6 text-[var(--ink-2)]" strokeWidth={2} />
        </span>
      )}
    </span>
  );
}

function AmostraEstilo({ estilo }: { estilo: ValidadeEstilo }) {
  const t = "whitespace-nowrap font-bold leading-none";
  if (estilo === "selo")
    return (
      <span className="grid size-12 place-items-center rounded-full border-[3px] border-[#1b2530] text-[#1b2530]" style={{ background: OURO }}>
        <span className="text-center text-[8px] font-extrabold leading-[1.1]">VÁLIDO<br /><span className="text-[11px]">14/10</span></span>
      </span>
    );
  if (estilo === "etiqueta")
    return (
      <span className={cn(t, "flex h-7 items-center gap-1 rounded-md px-2 text-[#1b2530] shadow-sm")} style={{ background: OURO, borderBottom: "3px solid rgba(0,0,0,0.25)" }}>
        <span className="text-[8px]">VÁLIDO</span>
        <span className="text-[11px]">14/10</span>
      </span>
    );
  if (estilo === "texto")
    return (
      <span className={cn(t, "flex h-7 items-center gap-1 rounded-md bg-[var(--ink)] px-2")}>
        <span className="text-[8px]" style={{ color: OURO }}>VÁLIDO</span>
        <span className="text-[11px] text-white">14/10</span>
      </span>
    );
  if (estilo === "claro")
    return (
      <span className={cn(t, "flex h-7 items-stretch overflow-hidden rounded-full bg-white shadow-sm")} style={{ border: `2px solid ${OURO}` }}>
        <span className="flex items-center px-1.5 text-[8px] text-[#1b2530]" style={{ background: OURO }}>VÁLIDO</span>
        <span className="flex items-center px-1.5 text-[11px] text-[#1b2530]">14/10</span>
      </span>
    );
  return (
    <span className={cn(t, "flex h-7 items-stretch overflow-hidden rounded-md shadow-sm")} style={{ border: `2px solid ${OURO}` }}>
      <span className="flex items-center px-1.5 text-[8px] text-[#1b2530]" style={{ background: OURO }}>VÁLIDO</span>
      <span className="flex items-center bg-[#0c1220] px-1.5 text-[11px] text-white">14/10</span>
    </span>
  );
}

function Opcao({ on, onClick, rotulo, children }: { on: boolean; onClick: () => void; rotulo: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("flex min-h-[44px] shrink-0 flex-col items-center gap-1.5 rounded-xl p-1.5 ring-2 transition active:scale-95", on ? "bg-[var(--glass-strong)] ring-[var(--ink)]" : "ring-transparent hover:bg-[var(--line)]")}
    >
      {children}
      <span className={cn("text-[11px] leading-tight", on ? "font-bold text-[var(--ink)]" : "font-medium text-[var(--ink-2)]")}>{rotulo}</span>
    </button>
  );
}

export function ValidadePicker({
  posicao,
  estilo,
  onPosicao,
  onEstilo,
  semDatas,
}: {
  posicao: ValidadePosicao;
  estilo: ValidadeEstilo;
  onPosicao: (v: ValidadePosicao) => void;
  onEstilo: (v: ValidadeEstilo) => void;
  semDatas: boolean;
}) {
  const padrao = posicao === VALIDADE_POSICAO_PADRAO && estilo === VALIDADE_ESTILO_PADRAO;
  return (
    <div className="space-y-3 rounded-2xl bg-[var(--glass-strong)] p-3 ring-1 ring-[var(--line)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Data de validade</h4>
          <p className="text-xs text-[var(--ink-3)]">O traço dourado mostra onde ela fica. A prévia muda na hora.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onPosicao(VALIDADE_POSICAO_PADRAO);
            onEstilo(VALIDADE_ESTILO_PADRAO);
          }}
          disabled={padrao}
          className="shrink-0 text-xs font-medium text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline disabled:no-underline disabled:opacity-50"
        >
          Voltar ao padrão
        </button>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-[var(--ink-2)]">1. Onde fica</p>
        <div className="rolagem -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {VALIDADE_POSICOES.map((v) => (
            <Opcao key={v} on={posicao === v} onClick={() => onPosicao(v)} rotulo={NOME_POSICAO[v]}>
              <MiniEncarte pos={v} />
            </Opcao>
          ))}
        </div>
      </div>

      {posicao !== "oculto" && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--ink-2)]">2. Como aparece</p>
          <div className="rolagem -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {VALIDADE_ESTILOS.map((v) => (
              <Opcao key={v} on={estilo === v} onClick={() => onEstilo(v)} rotulo={NOME_ESTILO[v]}>
                <span className="grid h-12 min-w-[72px] place-items-center rounded-lg bg-[var(--line)] px-1.5">
                  <AmostraEstilo estilo={v} />
                </span>
              </Opcao>
            ))}
          </div>
        </div>
      )}

      {semDatas && posicao !== "oculto" && <p className="text-xs text-[var(--ink-3)]">Preencha as datas (passo 5) para a validade aparecer na arte.</p>}
    </div>
  );
}
