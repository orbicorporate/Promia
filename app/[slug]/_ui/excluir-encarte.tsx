"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, Sheet } from "@/components/ui";

// Lixeira no canto do cartão do encarte, com confirmação antes de apagar
export function ExcluirEncarte({ id, nome }: { id: string; nome: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [apagando, setApagando] = useState(false);

  async function apagar() {
    setApagando(true);
    try {
      const res = await fetch(`/api/encartes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Não consegui apagar o encarte.");
        return;
      }
      toast.success("Encarte apagado.");
      setAberto(false);
      router.refresh();
    } finally {
      setApagando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label={`Apagar ${nome}`}
        className="absolute right-2.5 top-2.5 z-10 grid size-10 place-items-center rounded-full bg-white/85 text-[var(--ink-2)] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.5)] ring-1 ring-black/5 backdrop-blur transition hover:bg-[#b3122f] hover:text-white focus-visible:bg-[#b3122f] focus-visible:text-white active:scale-90 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <Trash2 className="size-[18px]" aria-hidden />
      </button>
      <Sheet
        open={aberto}
        onClose={() => setAberto(false)}
        title="Apagar este encarte?"
        description={`"${nome}" será apagado. Os produtos e preços do catálogo continuam como estão.`}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="vidro" onClick={() => setAberto(false)}>
              Manter
            </Button>
            <Button variant="perigo" onClick={apagar} loading={apagando} icon={<Check className="size-4" />}>
              Apagar encarte
            </Button>
          </div>
        }
      >
        <></>
      </Sheet>
    </>
  );
}
