"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toJpeg } from "@/lib/client/image";
import { Button, Glass } from "@/components/ui";
import type { Arquivo } from "@/lib/server/arquivos";

const api = (method: string, body: unknown) => fetch("/api/mercado/arquivos", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

export function ArquivosView({ marketId, inicial }: { marketId: string; inicial: Arquivo[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [lista, setLista] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [apagando, setApagando] = useState<string | null>(null);

  async function enviar(files: FileList) {
    setEnviando(true);
    let ok = 0;
    try {
      for (const original of Array.from(files).slice(0, 10)) {
        // PNG fica como está (pode ter transparência); o resto vira JPEG leve
        const file = original.type === "image/png" ? original : await toJpeg(original, 2400);
        const prep = await api("POST", { marketId, fileName: file.name });
        const p = await prep.json().catch(() => ({}));
        if (!prep.ok) { toast.error(p.error ?? "Não consegui enviar."); break; }
        const { error } = await createClient().storage.from("midia").uploadToSignedUrl(p.path, p.token, file, { contentType: file.type });
        if (error) { toast.error("O envio falhou. Tente de novo."); break; }
        const conf = await api("PUT", { marketId, path: p.path });
        const c = await conf.json().catch(() => ({}));
        if (!conf.ok) { toast.error(c.error ?? "Não consegui usar essa imagem."); continue; }
        setLista((l) => [{ path: c.path, nome: c.path.split("/").pop(), url: c.url, criadoEm: new Date().toISOString() }, ...l]);
        ok++;
      }
      if (ok) toast.success(ok === 1 ? "Imagem enviada." : `${ok} imagens enviadas.`);
      router.refresh();
    } catch {
      toast.error("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
      if (input.current) input.current.value = "";
    }
  }

  async function apagar(a: Arquivo) {
    setApagando(a.path);
    try {
      const res = await api("DELETE", { marketId, path: a.path });
      if (!res.ok) return toast.error("Não consegui apagar.");
      setLista((l) => l.filter((x) => x.path !== a.path));
      toast.success("Imagem apagada.");
      router.refresh();
    } finally {
      setApagando(null);
    }
  }

  return (
    <div className="space-y-5">
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files?.length && enviar(e.target.files)} />
      <Glass className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#6b4dff] text-white"><ImagePlus className="size-5" /></span>
          <p className="max-w-xl text-[var(--ink-2)]">
            Envie até 10 imagens por vez (JPG, PNG ou WebP). Para fundo de encarte, prefira imagens grandes, na vertical para story e A4, e na horizontal ou quadrada para o feed.
          </p>
        </div>
        <Button size="lg" variant="ia" loading={enviando} icon={<ImagePlus className="size-5" />} onClick={() => input.current?.click()}>
          {enviando ? "Enviando" : "Enviar imagens"}
        </Button>
      </Glass>

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-center text-[var(--ink-3)]">Você ainda não enviou nenhuma imagem.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {lista.map((a) => (
            <li key={a.path}>
              <Glass className="overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt="" loading="lazy" className="aspect-[4/5] w-full bg-[var(--line)] object-cover" />
                <div className="flex items-center justify-between gap-2 p-2.5">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--folha)]"><Check className="size-4" /> Pronta</span>
                  <button onClick={() => apagar(a)} disabled={apagando === a.path} aria-label="Apagar imagem" className="grid size-9 place-items-center rounded-full text-[var(--perigo)] transition hover:bg-[var(--perigo)]/10 disabled:opacity-50">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </Glass>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
