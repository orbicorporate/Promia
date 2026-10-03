"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Input, Sheet } from "@/components/ui";

export function NewMarketForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/master/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          niche: form.get("niche"),
          ownerName: form.get("ownerName"),
          ownerEmail: form.get("ownerEmail"),
          ownerPassword: form.get("ownerPassword"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(data.error || "Não consegui criar o mercado. Tente de novo.");
        return;
      }
      toast.success("Mercado criado. Envie o email e a senha para o responsável.");
      setOpen(false);
      router.refresh();
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <Button icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
        Novo mercado
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Novo mercado" description="Cria o mercado e o acesso do responsável.">
        <form id="novo-mercado" onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome do mercado">
            <Input name="name" required maxLength={80} />
          </Field>
          <Field label="Tipo de loja" hint="Opcional, ex. supermercado de bairro">
            <Input name="niche" maxLength={80} />
          </Field>
          <div className="border-t border-[var(--line)] pt-4 text-sm font-semibold">Acesso do responsável</div>
          <Field label="Nome">
            <Input name="ownerName" maxLength={80} />
          </Field>
          <Field label="Email">
            <Input name="ownerEmail" type="email" required autoComplete="off" />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres">
            <Input name="ownerPassword" type="password" required minLength={8} autoComplete="new-password" />
          </Field>
          {erro && <p className="text-sm text-[var(--perigo)]">{erro}</p>}
          <Button type="submit" className="w-full" loading={carregando}>
            Criar mercado
          </Button>
        </form>
      </Sheet>
    </>
  );
}
