"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Search, ExternalLink, AtSign, ShoppingCart, Info } from "lucide-react";
import { toast } from "sonner";
import { Button, Field, Glass, Input, SecaoTitulo, Select, cn } from "@/components/ui";
import { UFS, nomeUf } from "@/lib/competition/pesquisa-online";

export type Achado = { id: string; term: string; product_name: string; price: number; own_price: number | null; source_kind: string; source_name: string; source_url: string | null; scope: string; region: string | null; snippet: string | null; observed_on: string };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const ORIGEM: Record<string, { rotulo: string; Icone: typeof Globe; cor: string }> = {
  site: { rotulo: "Pesquisa em site", Icone: Globe, cor: "bg-[#e8f0fe] text-[#1a4fa3]" },
  rede_social: { rotulo: "Rede social", Icone: AtSign, cor: "bg-[#fde8f3] text-[#a3185f]" },
  loja_online: { rotulo: "Loja online", Icone: ShoppingCart, cor: "bg-[#fff1dc] text-[#9a5a00]" },
};
const ALCANCE: Record<string, string> = { cidade: "Cidade", estado: "Estado", brasil: "Brasil" };

export function PesquisaOnline({ marketId, cidade, ufInicial, achados }: { marketId: string; cidade: string | null; ufInicial: string; achados: Achado[] }) {
  const router = useRouter();
  const [termos, setTermos] = useState("");
  const [escopo, setEscopo] = useState<"cidade" | "estado" | "brasil">(cidade ? "cidade" : "estado");
  const [uf, setUf] = useState(ufInicial);
  const [busy, setBusy] = useState(false);

  async function pesquisar() {
    const lista = termos.split(/[,\n;]/).map((t) => t.trim()).filter(Boolean);
    if (lista.length === 0) return toast.error("Escreva o produto que você quer pesquisar.");
    setBusy(true);
    try {
      const res = await fetch("/api/concorrencia/pesquisa", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, termos: lista, escopo, uf }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(j.error ?? "Não consegui pesquisar agora.");
      toast[j.found ? "success" : "info"](j.found ? `${j.found} preços encontrados na internet.` : "Não achei preços com esses termos. Tente um nome mais simples.");
      router.refresh();
    } catch {
      toast.error("Sem conexão. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  // agrupa por produto pesquisado
  const grupos = new Map<string, Achado[]>();
  for (const a of achados) grupos.set(a.term, [...(grupos.get(a.term) ?? []), a]);

  return (
    <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="pesquisa">
      <SecaoTitulo id="pesquisa" Icone={Globe} cor="uva" sub="Você escolhe o produto e o alcance, e o Promia procura preços em sites, redes sociais e lojas online. É uma pesquisa de campo para você se basear, não substitui o preço de gôndola de ninguém.">Pesquisa de preços na internet</SecaoTitulo>

      <div className="flex gap-2.5 rounded-2xl bg-[var(--line)]/50 p-3.5 text-sm text-[var(--ink-2)]">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>
          Só entram preços publicados nos últimos 7 dias, e os mais antigos somem da lista. Cada preço mostra de onde veio (site, rede social ou loja online) e a data. Os preços podem ser de outra marca, tamanho ou região, ou estar desatualizados, então abra o link para conferir antes de tomar decisão.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Field label="Produtos (separe por vírgula, até 5)" htmlFor="p-termos">
          <Input id="p-termos" value={termos} onChange={(e) => setTermos(e.target.value)} placeholder="Ex.: arroz 5kg, óleo de soja, leite integral" maxLength={200} onKeyDown={(e) => e.key === "Enter" && !busy && pesquisar()} />
        </Field>
        <Field label="Alcance" htmlFor="p-escopo">
          <Select id="p-escopo" value={escopo} onChange={(e) => setEscopo(e.target.value as typeof escopo)}>
            <option value="cidade" disabled={!cidade}>{cidade ? `Minha cidade (${cidade})` : "Minha cidade (cadastre em Mercado)"}</option>
            <option value="estado">Meu estado</option>
            <option value="brasil">Brasil todo (inclui lojas online)</option>
          </Select>
        </Field>
        {escopo !== "brasil" && (
          <Field label="Estado" htmlFor="p-uf">
            <Select id="p-uf" value={uf} onChange={(e) => setUf(e.target.value)}>
              <option value="">Escolha</option>
              {UFS.map((u) => (
                <option key={u} value={u}>{u} - {nomeUf(u)}</option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <Button size="lg" className="w-full sm:w-auto" variant="ia" loading={busy} icon={<Search className="size-5" />} onClick={pesquisar}>
        {busy ? "Pesquisando na internet, leva até 1 minuto" : "Pesquisar preços"}
      </Button>

      {grupos.size === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--ink-3)]">Nenhuma pesquisa ainda. Escreva um produto acima e toque em Pesquisar preços.</p>
      ) : (
        <div className="space-y-5">
          {[...grupos.entries()].map(([termo, lista]) => (
            <div key={termo}>
              <h3 className="font-semibold">{termo}</h3>
              <p className="text-xs text-[var(--ink-3)]">
                Pesquisa de {dm(lista[0].observed_on)}, alcance: {ALCANCE[lista[0].scope] ?? lista[0].scope}
                {lista[0].region && lista[0].scope !== "brasil" ? ` (${lista[0].region})` : ""}
              </p>
              <ul className="mt-2 grid gap-2 lg:grid-cols-2">
                {lista.map((a) => {
                  const o = ORIGEM[a.source_kind] ?? ORIGEM.site;
                  return (
                    <li key={a.id} className="rounded-2xl bg-white/70 p-3.5 ring-1 ring-[var(--line)]">
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", o.cor)}>
                          <o.Icone className="size-3.5" /> {o.rotulo}: {a.source_name}
                        </span>
                        <span className="tabular shrink-0 text-lg font-extrabold">{brl(a.price)}</span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-[var(--ink-2)]">{a.product_name}</p>
                      {a.own_price != null && (
                        <p className="mt-1 text-xs text-[var(--ink-3)]">Seu preço: {brl(a.own_price)} ({a.price > a.own_price ? "abaixo" : a.price < a.own_price ? "acima" : "igual"} da referência)</p>
                      )}
                      {a.source_url && (
                        <a href={a.source_url} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[var(--uva)] hover:underline">
                          Abrir a fonte <ExternalLink className="size-3" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Glass>
  );
}
