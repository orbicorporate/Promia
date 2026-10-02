"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      setOpen(false);
      router.refresh();
    } catch {
      setErro("Sem conexão agora. Confira a internet e tente de novo.");
    } finally {
      setCarregando(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm"
      >
        + Novo mercado
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 max-w-md"
    >
      <h2 className="text-sm font-medium text-neutral-900">Novo mercado</h2>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Nome do mercado</label>
        <input
          name="name"
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Nicho (opcional, ex.: supermercado de bairro)</label>
        <input name="niche" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <hr className="border-neutral-100" />
      <p className="text-xs text-neutral-500">Login do responsável pelo mercado</p>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Nome</label>
        <input name="ownerName" className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Email</label>
        <input
          name="ownerEmail"
          type="email"
          required
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm text-neutral-600">Senha (mínimo 8 caracteres)</label>
        <input
          name="ownerPassword"
          type="password"
          required
          minLength={8}
          className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={carregando}
          className="bg-neutral-900 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          {carregando ? "Criando..." : "Criar mercado"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-neutral-500 px-3 py-2"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
