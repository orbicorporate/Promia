"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileSpreadsheet, Loader2, Upload, CheckCircle2, Download, AlertTriangle } from "lucide-react";
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

const fmt = (iso: string) => iso.split("-").reverse().join("/");

function baixarModelo() {
  const csv = "\uFEFFCódigo;Código de barras;Produto;Quantidade;Valor total\n1;7891234567890;Arroz Tipo 1 5kg;120;3108,00\n2;;Banana Prata kg;85,5;597,65\n";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = "modelo-relatorio-de-vendas.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function ImportForm({ marketId, today, onDone }: { marketId: string; today: string; onDone: () => void }) {
  const router = useRouter();
  const p = presets(today);
  const [de, setDe] = useState(p[0].de);
  const [ate, setAte] = useState(p[0].ate);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ rows: number; matched: number; de: string; ate: string; daRelatorio: boolean; substituiu: boolean; semLigacao: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send(file: File) {
    if (!de || !ate || de > ate) return toast.error("Confira o período do relatório.");
    if (!/\.(xlsx|xls|csv|txt)$/i.test(file.name)) return toast.error("Esse arquivo não serve. Envie o Excel (.xlsx ou .xls) ou CSV que o caixa exporta. PDF e foto não dá para ler.");
    if (file.size > 25 * 1024 * 1024) return toast.error("Arquivo grande demais (acima de 25 MB). Exporte um período menor.");
    if (file.size === 0) return toast.error("O arquivo está vazio. Exporte o relatório de novo.");
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
      setResult(data);
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
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
        <span className="grid size-12 place-items-center rounded-2xl bg-[var(--folha)] text-white">{busy ? <Loader2 className="size-5 animate-spin" /> : <FileSpreadsheet className="size-5" />}</span>
        <span className="font-display text-lg font-bold">{busy ? "Lendo o relatório" : "Solte o relatório de vendas aqui"}</span>
        <span className="max-w-md text-sm text-[var(--ink-2)]">Excel ou CSV que o caixa exporta (curva ABC, vendas por produto). Precisa do produto e da quantidade ou do valor vendido. Pode clicar aqui para escolher o arquivo.</span>
      </label>
      <p className="text-sm text-[var(--ink-3)]">
        No caixa, procure em Relatórios por Vendas por produto, Curva ABC ou Mapa de vendas, e exporte em Excel. Não achou o seu? Use o{" "}
        <button type="button" onClick={baixarModelo} className="inline-flex items-center gap-1 font-medium text-[var(--folha)] underline underline-offset-2">
          <Download className="size-3.5" /> modelo pronto
        </button>{" "}
        e cole os dados.
      </p>
      {result && (
        <div className="space-y-2 rounded-2xl bg-[var(--folha-soft)] px-4 py-3 text-sm text-[var(--folha)]" role="status">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-5 shrink-0" /> {result.rows} produtos lidos, {result.matched} ligados ao catálogo.
          </p>
          <p>
            Período gravado: {fmt(result.de)} a {fmt(result.ate)}
            {result.daRelatorio ? " (lido de dentro do relatório)" : ""}.{result.substituiu ? " Substituiu o envio anterior desse mesmo período." : ""}
          </p>
          {result.rows - result.matched > 0 && (
            <p className="flex items-start gap-2 text-[var(--ink-2)]">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                {result.rows - result.matched} sem cadastro no catálogo{result.semLigacao.length ? `, por exemplo ${result.semLigacao.slice(0, 3).join(", ")}` : ""}. Eles entram na soma, mas não aparecem como produto até o cadastro bater pelo código, código de barras ou nome.
              </span>
            </p>
          )}
        </div>
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
        <p className="mt-1 max-w-2xl text-[var(--ink-2)]">Toda semana, exporte as vendas por produto do seu sistema de caixa e envie aqui. Com duas semanas o Promia já mostra o que está subindo e caindo, e como cada encarte mexeu nas vendas.</p>
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
