"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Glass, cn } from "@/components/ui";
import { ESPECIALISTAS, type ChatAcao, type EspecialistaKey } from "@/lib/ai/chat";

type Msg = { role: "user" | "assistant"; content: string; acoes?: ChatAcao[] };

export function ChatView({ marketId, marketName }: { marketId: string; marketName: string }) {
  const [esp, setEsp] = useState<EspecialistaKey>("geral");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);
  const atual = ESPECIALISTAS.find((e) => e.key === esp)!;

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, enviando]);

  async function enviar(pergunta: string) {
    const q = pergunta.trim();
    if (!q || enviando) return;
    const historico: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs(historico);
    setTexto("");
    setEnviando(true);
    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId, especialista: esp, messages: historico.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "O gerente não respondeu. Tente de novo.");
        setMsgs(msgs);
        setTexto(q);
        return;
      }
      setMsgs([...historico, { role: "assistant", content: data.resposta, acoes: data.acoes ?? [] }]);
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
      setMsgs(msgs);
      setTexto(q);
    } finally {
      setEnviando(false);
    }
  }

  function trocar(k: EspecialistaKey) {
    if (k === esp) return;
    setEsp(k);
    setMsgs([]);
  }

  return (
    <Glass className="flex min-h-[60dvh] flex-col gap-4 p-4 sm:p-6">
      <div className="rolagem -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Especialista">
        {ESPECIALISTAS.map((e) => (
          <button
            key={e.key}
            type="button"
            role="tab"
            aria-selected={esp === e.key}
            onClick={() => trocar(e.key)}
            className={cn("h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition active:scale-[0.97]", esp === e.key ? "bg-[var(--ink)] text-[var(--bg)]" : "bg-[var(--glass-strong)] ring-1 ring-[var(--line)] hover:bg-[var(--line)]")}
          >
            {e.nome}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4" aria-live="polite">
        {msgs.length === 0 && (
          <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[var(--folha-soft)] text-[var(--folha)]" aria-hidden>
              <Sparkles className="size-7" />
            </span>
            <div>
              <h2 className="text-xl font-bold">{esp === "geral" ? `Como posso ajudar o ${marketName} hoje?` : `${atual.nome}: ${atual.foco}`}</h2>
              <p className="mt-1 text-sm text-[var(--ink-2)]">Pergunte do seu jeito. Ou toque em uma sugestão.</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {atual.exemplos.map((ex) => (
                <button key={ex} type="button" onClick={() => enviar(ex)} className="rounded-2xl bg-[var(--glass-strong)] px-4 py-3 text-left text-[15px] ring-1 ring-[var(--line)] transition hover:bg-[var(--line)] active:scale-[0.99]">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-md bg-[var(--ink)] px-4 py-2.5 text-[15px] text-[var(--bg)]">{m.content}</p>
            </div>
          ) : (
            <div key={i} className="flex max-w-[92%] flex-col items-start gap-2">
              <p className="whitespace-pre-line rounded-2xl rounded-bl-md bg-[var(--glass-strong)] px-4 py-3 text-[15px] leading-relaxed ring-1 ring-[var(--line)]">{m.content}</p>
              {m.acoes && m.acoes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {m.acoes.map((a) => (
                    <Link key={a.href} href={a.href} className="inline-flex h-10 items-center rounded-full bg-[var(--folha)] px-4 text-sm font-semibold text-white transition active:scale-[0.97]">
                      {a.rotulo}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {enviando && (
          <div className="flex" role="status" aria-label="O gerente está pensando">
            <span className="flex gap-1 rounded-2xl rounded-bl-md bg-[var(--glass-strong)] px-4 py-3.5 ring-1 ring-[var(--line)]">
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-2 animate-pulse rounded-full bg-[var(--ink-3)]" style={{ animationDelay: `${d * 150}ms` }} />
              ))}
            </span>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="sticky bottom-3 flex items-end gap-2 rounded-3xl bg-[var(--glass-strong)] p-2 ring-1 ring-[var(--line)] backdrop-blur"
      >
        {msgs.length > 0 && (
          <button type="button" onClick={() => setMsgs([])} aria-label="Nova conversa" title="Nova conversa" className="grid size-11 shrink-0 place-items-center rounded-full text-[var(--ink-3)] transition hover:bg-[var(--line)]">
            <RotateCcw className="size-5" />
          </button>
        )}
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              enviar(texto);
            }
          }}
          rows={1}
          maxLength={1000}
          placeholder="Pergunte alguma coisa sobre o seu mercado"
          aria-label="Pergunta para o gerente"
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-[var(--ink-3)]"
        />
        <button type="submit" disabled={!texto.trim() || enviando} aria-label="Enviar" className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--bg)] transition active:scale-95 disabled:opacity-40">
          <ArrowUp className="size-5" />
        </button>
      </form>
    </Glass>
  );
}
