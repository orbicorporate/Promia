"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Glass, Input, Sheet, cn } from "@/components/ui";

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// atalhos de período mais comuns nos relatórios de caixa
function presets(today: string) {
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay();
  const lastSunday = addDays(today, -(dow === 0 ? 7 : dow));
  const firstThisMonth = `${today.slice(0, 8)}01`;
  const lastMonthEnd = addDays(firstThisMonth, -1);
  return [
    { label: "Semana passada", de: addDays(lastSunday, -6), ate: lastSunday },
    { label: "Últimos 7 dias", de: addDays(today, -7), ate: addDays(today, -1) },
    { label: "Mês passado", de: `${lastMonthEnd.slice(0, 8)}01`, ate: lastMonthEnd },
  ];
}

function ImportForm({ marketId, today, onDone }: { marketId: string; today: string; onDone: () => void }) {
  const router = useRouter();
  const p = presets(today);
  const [de, setDe] = useState(p[0].de);
  const [ate, setAte] = useState(p[0].ate);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ rows: number; matched: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(file: File) {
    if (!de || !ate || de > ate) return toast.error("Confira o período do relatório.");
    setBusy(true);
    setResult(null);
    try {
      const up = await fetch("/api/produtos/importar/upload-url", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, fileName: file.name }) });
      const u = await up.json().catch(() => ({}));
      if (!up.ok) return toast.error(u.error || "Não consegui preparar o envio.");
      const { error } = await createClient().storage.from("imports").uploadToSignedUrl(u.path, u.token, file);
      if (error) return toast.error("Não consegui enviar o arquivo. Tente de novo.");
      const res = await fetch("/api/vendas/importar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, path: u.path, fileName: file.name, de, ate }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(data.error || "Não consegui ler o relatório.");
      setResult({ rows: data.rows, matched: data.matched });
      toast.success(`${data.rows} produtos lidos, ${data.matched} ligados ao catálogo.`);
      router.refresh();
      onDone();
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--ink-2)]">Período do relatório</p>
        <div className="flex flex-wrap gap-2">
          {p.map((x) => (
            <button
              key={x.label}
              type="button"
              onClick={() => {
                setDe(x.de);
                setAte(x.ate);
              }}
              aria-pressed={de === x.de && ate === x.ate}
              className={cn("h-10 rounded-full px-4 text-sm font-medium ring-1 transition", de === x.de && ate === x.ate ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-[var(--glass-strong)] text-[var(--ink-2)] ring-[var(--line)]")}
            >
              {x.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
          <Field label="De" htmlFor="v-de">
            <Input id="v-de" type="date" value={de} max={today} onChange={(e) => setDe(e.target.value)} />
          </Field>
          <Field label="Até" htmlFor="v-ate">
            <Input id="v-ate" type="date" value={ate} min={de} max={today} onChange={(e) => setAte(e.target.value)} />
          </Field>
        </div>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f && !busy) send(f);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-[22px] border-2 border-dashed px-6 py-8 text-center transition",
          dragging ? "border-[var(--folha)] bg-[var(--folha-soft)]" : "border-[var(--line-strong)] hover:bg-[var(--glass)]",
          busy && "varredura pointer-events-none"
        )}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.csv" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--folha)] text-white">{busy ? <Loader2 className="size-5 animate-spin" /> : <FileSpreadsheet className="size-5" />}</span>
        <span className="font-display text-lg font-bold">{busy ? "Lendo o relatório" : "Solte o relatório de vendas aqui"}</span>
        <span className="max-w-md text-sm text-[var(--ink-2)]">Excel ou CSV exportado do caixa (curva ABC, vendas por produto). Precisa do produto e da quantidade ou do valor vendido.</span>
      </label>
      {result && (
        <p className="flex items-center gap-2 rounded-2xl bg-[var(--folha-soft)] px-4 py-3 text-sm font-medium text-[var(--folha)]">
          <CheckCircle2 className="size-5" /> {result.rows} produtos lidos, {result.matched} ligados ao catálogo.
        </p>
      )}
    </div>
  );
}

export function VendasImport({ marketId, today, compact }: { marketId: string; today: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!compact) {
    return (
      <Glass className="p-5 sm:p-8">
        <h2 className="text-xl font-bold">Envie o primeiro relatório de vendas</h2>
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Toda semana, exporte as vendas por produto do seu sistema de caixa e envie aqui. Com duas semanas o Promia já mostra o que está subindo e caindo, e quanto cada encarte vendeu a mais.</p>
        <div className="mt-6">
          <ImportForm marketId={marketId} today={today} onDone={() => {}} />
        </div>
      </Glass>
    );
  }
  return (
    <>
      <Button variant="vidro" icon={<Upload className="size-4" />} onClick={() => setOpen(true)}>
        Enviar relatório
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Enviar relatório de vendas" description="Mesmo período enviado de novo substitui o anterior." wide>
        <ImportForm marketId={marketId} today={today} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}
