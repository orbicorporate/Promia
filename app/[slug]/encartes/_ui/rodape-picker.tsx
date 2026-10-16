"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, cn } from "@/components/ui";
import {
  RODAPE_CAMPO_MAX,
  RODAPE_COR_HEX,
  RODAPE_COR_LABEL,
  RODAPE_CORES,
  RODAPE_ESTILO_LABEL,
  RODAPE_ESTILOS,
  RODAPE_PADRAO,
  RODAPE_PARTE_LABEL,
  RODAPE_PARTES,
  RODAPE_TEXTO_MAX,
  resolverRodape,
  type RodapeEstilo,
  type RodapeOpcoes,
  type RodapeParte,
} from "@/lib/encarte/rodape";

// Editor do rodapé: desenho, cor, o que aparece, os textos (só deste encarte,
// sem mexer no cadastro) e o rodapé padrão do mercado.

export type MercadoRodapeInfo = { nome: string; whatsapp: string; instagram: string; endereco: string; horario: string };

// Nos fundos de arte o rodapé é parte da imagem: só dá para escolher como o texto entra sobre a faixa.
const ESTILOS_ARTE: { id: RodapeEstilo; label: string }[] = [
  { id: "barra", label: "Na faixa" },
  { id: "centro", label: "Centro" },
  { id: "pilula", label: "Pílula" },
];

const mesmo = (a: RodapeOpcoes, b: RodapeOpcoes) => JSON.stringify(resolverRodape(a)) === JSON.stringify(resolverRodape(b));

const campo = "h-10 w-full rounded-xl bg-[var(--line)] px-3 text-sm text-[var(--ink)] outline-none ring-1 ring-transparent transition placeholder:text-[var(--ink-3)] focus:ring-[var(--ink)]";

export function RodapePicker({
  marketId,
  valor,
  onChange,
  mercado,
  arte,
  padraoSalvo,
  onPadraoSalvo,
}: {
  marketId: string;
  valor: RodapeOpcoes;
  onChange: (v: RodapeOpcoes) => void;
  mercado: MercadoRodapeInfo;
  arte: boolean;
  padraoSalvo: Partial<RodapeOpcoes> | null;
  onPadraoSalvo: (v: Partial<RodapeOpcoes> | null) => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const set = (parcial: Partial<RodapeOpcoes>) => onChange({ ...valor, ...parcial });
  const base = resolverRodape(padraoSalvo);
  const igualAoPadrao = mesmo(valor, base);
  const estilos = arte ? ESTILOS_ARTE : RODAPE_ESTILOS.map((e) => ({ id: e, label: RODAPE_ESTILO_LABEL[e] }));
  const estiloAtual = arte && !ESTILOS_ARTE.some((e) => e.id === valor.estilo) ? "barra" : valor.estilo;
  const mostrarCor = !arte || estiloAtual === "pilula";
  const escondida = (p: RodapeParte) => valor.ocultar.includes(p);
  const alternar = (p: RodapeParte) => set({ ocultar: escondida(p) ? valor.ocultar.filter((x) => x !== p) : [...valor.ocultar, p] });

  async function chamar(metodo: "PUT" | "DELETE") {
    setSalvando(true);
    try {
      const res = await fetch("/api/mercado/rodape-padrao", {
        method: metodo,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, rodape: valor }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Não consegui salvar.");
      if (metodo === "PUT") {
        onPadraoSalvo(resolverRodape(valor));
        toast.success("Rodapé salvo como padrão. Todo encarte novo já começa com ele.");
      } else {
        onPadraoSalvo(null);
        toast.success("Padrão do mercado removido.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-[var(--glass-strong)] p-4 ring-1 ring-[var(--line)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold">Rodapé</h4>
          <p className="text-xs text-[var(--ink-3)]">{arte ? "Neste fundo o rodapé é parte da arte. Dá para mudar como o texto entra e o que aparece." : "Escolha o desenho, o que aparece e os textos."}</p>
        </div>
        <button type="button" onClick={() => onChange({ ...base })} disabled={igualAoPadrao} className="shrink-0 text-xs text-[var(--ink-3)] underline-offset-2 enabled:hover:text-[var(--ink)] enabled:hover:underline disabled:opacity-40">
          {padraoSalvo ? "Voltar ao padrão do mercado" : "Padrão"}
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[var(--ink-2)]">Desenho</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Estilo do rodapé">
          {estilos.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => set({ estilo: e.id })}
              aria-pressed={estiloAtual === e.id}
              className={cn("h-9 rounded-full px-3.5 text-[13px] font-medium ring-1 transition active:scale-95", estiloAtual === e.id ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--line)] text-[var(--ink-2)] ring-transparent hover:text-[var(--ink)]")}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {mostrarCor && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[var(--ink-2)]">Cor</p>
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
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-[var(--ink-2)]">O que aparece</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Partes do rodapé">
          {RODAPE_PARTES.map((p) => {
            const off = escondida(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => alternar(p)}
                aria-pressed={!off}
                className={cn("inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium ring-1 transition active:scale-95", off ? "bg-transparent text-[var(--ink-3)] line-through ring-[var(--line-strong)]" : "bg-[var(--line)] text-[var(--ink)] ring-transparent")}
              >
                {off ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
                {RODAPE_PARTE_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[var(--ink-2)]">Textos <span className="font-normal text-[var(--ink-3)]">(só deste encarte, o cadastro do mercado não muda)</span></p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-xs text-[var(--ink-3)]">Nome</span>
            <input value={valor.nome} onChange={(e) => set({ nome: e.target.value.slice(0, RODAPE_CAMPO_MAX.nome) })} maxLength={RODAPE_CAMPO_MAX.nome} placeholder={mercado.nome} className={campo} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--ink-3)]">WhatsApp</span>
            <input value={valor.whatsapp} onChange={(e) => set({ whatsapp: e.target.value.slice(0, RODAPE_CAMPO_MAX.whatsapp) })} maxLength={RODAPE_CAMPO_MAX.whatsapp} inputMode="tel" placeholder={mercado.whatsapp || "(11) 99999-0000"} className={campo} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--ink-3)]">Instagram</span>
            <input value={valor.instagram} onChange={(e) => set({ instagram: e.target.value.slice(0, RODAPE_CAMPO_MAX.instagram) })} maxLength={RODAPE_CAMPO_MAX.instagram} placeholder={mercado.instagram ? `@${mercado.instagram.replace(/^@/, "")}` : "@seumercado"} className={campo} />
          </label>
          <label className="space-y-1">
            <span className="text-xs text-[var(--ink-3)]">Horário</span>
            <input value={valor.horario} onChange={(e) => set({ horario: e.target.value.slice(0, RODAPE_CAMPO_MAX.horario) })} maxLength={RODAPE_CAMPO_MAX.horario} placeholder={mercado.horario || "Seg a Sáb, 8h às 20h"} className={campo} />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-xs text-[var(--ink-3)]">Endereço ou frase</span>
            <input value={valor.texto} onChange={(e) => set({ texto: e.target.value.slice(0, RODAPE_TEXTO_MAX) })} maxLength={RODAPE_TEXTO_MAX} placeholder={mercado.endereco || "Ex.: Ofertas válidas enquanto durarem os estoques"} className={campo} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3">
        <Button size="sm" variant="rosa" icon={<Save className="size-4" />} loading={salvando} disabled={!!padraoSalvo && igualAoPadrao} onClick={() => chamar("PUT")}>
          {padraoSalvo && igualAoPadrao ? "Padrão do mercado salvo" : "Salvar como padrão do mercado"}
        </Button>
        {padraoSalvo ? (
          <button type="button" disabled={salvando} onClick={() => chamar("DELETE")} className="text-xs text-[var(--ink-3)] underline-offset-2 hover:text-[var(--ink)] hover:underline">
            Remover padrão
          </button>
        ) : (
          <span className="text-xs text-[var(--ink-3)]">Todo encarte novo começa com este rodapé.</span>
        )}
      </div>
    </div>
  );
}

export { RODAPE_PADRAO };
