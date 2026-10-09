"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, Search, Camera, ArrowRight, ExternalLink, TrendingDown, TrendingUp, Check } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toJpeg } from "@/lib/client/image";
import { Button, Field, Glass, Input, Segmented, Select, cn } from "@/components/ui";
import type { CompareRow } from "@/lib/competition/compare";
import { plural } from "@/lib/plural";

type Competitor = { id: string; name: string; address: string | null; rating: number | null; reviews: number | null; category: string | null };
type Flyer = { id: string; competitor_name: string; observed_on: string; items: number; valid_until: string | null };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
type Filtro = "acao" | "todos" | "anunciar";

export function ConcorrenciaView({
  slug,
  marketId,
  hasAddress,
  competitors,
  flyers,
  compare,
  unmatched,
}: {
  slug: string;
  marketId: string;
  hasAddress: boolean;
  competitors: Competitor[];
  flyers: Flyer[];
  compare: { rows: CompareRow[]; index: number | null; cheaper: number; pricier: number };
  unmatched: number;
}) {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [reading, setReading] = useState(false);
  const [competitorId, setCompetitorId] = useState(competitors[0]?.id ?? "");
  const [competitorName, setCompetitorName] = useState("");
  // quando a busca traz os primeiros concorrentes, já deixa o mais próximo escolhido
  const [seenFirst, setSeenFirst] = useState(competitors[0]?.id ?? "");
  if ((competitors[0]?.id ?? "") !== seenFirst) {
    setSeenFirst(competitors[0]?.id ?? "");
    if (!competitorId && !competitorName.trim() && competitors[0]) setCompetitorId(competitors[0].id);
  }
  const [filtro, setFiltro] = useState<Filtro>("acao");
  const [applied, setApplied] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  async function findCompetitors() {
    setSearching(true);
    try {
      const res = await fetch("/api/concorrencia/buscar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.error || "Não consegui buscar.");
      toast.success(d.found ? `${plural(d.found, "mercado encontrado", "mercados encontrados")} por perto.` : "Nenhum mercado encontrado por perto.");
      router.refresh();
    } finally {
      setSearching(false);
    }
  }

  async function readFlyer(file: File) {
    if (!competitorId && !competitorName.trim()) return toast.error("Escolha ou escreva de qual mercado é o encarte.");
    setReading(true);
    try {
      const jpg = await toJpeg(file, 2000);
      const prep = await fetch("/api/concorrencia/encarte", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, acao: "envio", fileName: jpg.type === "image/jpeg" ? "foto.jpg" : file.name }) });
      const p = await prep.json().catch(() => ({}));
      if (!prep.ok) return toast.error(p.error || "Não consegui preparar o envio.");
      const { error } = await createClient().storage.from("imports").uploadToSignedUrl(p.path, p.token, jpg, { contentType: jpg.type });
      if (error) return toast.error("Não consegui enviar a foto.");
      const res = await fetch("/api/concorrencia/encarte", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ marketId, acao: "ler", path: p.path, competitorId: competitorId || null, competitorName: competitorId ? null : competitorName }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.error || "Não consegui ler o encarte.");
      toast.success(`${d.items} preços lidos de ${d.competitor}, ${d.matched} comparados com o seu catálogo.`);
      router.refresh();
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function applyPrice(r: CompareRow) {
    if (r.advice.suggested == null) return;
    const res = await fetch(`/api/produtos/${r.productId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ price: r.advice.suggested }) });
    if (!res.ok) return toast.error("Não consegui mudar o preço.");
    setApplied((a) => ({ ...a, [r.productId]: r.advice.suggested! }));
    toast.success(`${r.name} agora sai a ${brl(r.advice.suggested)}.`);
  }

  const rows = useMemo(() => {
    if (filtro === "todos") return compare.rows;
    if (filtro === "anunciar") return compare.rows.filter((r) => r.advice.kind === "anunciar");
    return compare.rows.filter((r) => r.advice.kind === "baixar" || r.advice.kind === "subir");
  }, [compare.rows, filtro]);
  const anunciar = compare.rows.filter((r) => r.advice.kind === "anunciar");

  return (
    <div className="space-y-6">
      {compare.index != null && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="vidro rounded-[22px] p-5">
            <p className="text-sm text-[var(--ink-2)]">Seu preço contra o concorrente mais barato</p>
            <p className={cn("mt-1 flex items-center gap-2 font-display text-4xl font-extrabold tabular", compare.index > 0.01 ? "text-[var(--perigo)]" : compare.index < -0.01 ? "text-[var(--folha)]" : "")}>
              {compare.index > 0.01 ? <TrendingUp className="size-7" /> : compare.index < -0.01 ? <TrendingDown className="size-7" /> : null}
              {pct(compare.index)}
            </p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">em {plural(compare.rows.length, "produto", "produtos")} em comum</p>
          </div>
          <div className="vidro rounded-[22px] p-5">
            <p className="text-sm text-[var(--ink-2)]">Você é mais caro em</p>
            <p className="mt-1 font-display text-4xl font-extrabold tabular">{compare.pricier}</p>
            <p className="mt-1 text-sm text-[var(--ink-3)]">{compare.pricier === 1 ? "produto" : "produtos"}</p>
          </div>
          <div className="vidro rounded-[22px] p-5">
            <p className="text-sm text-[var(--ink-2)]">Você é mais barato em</p>
            <p className="mt-1 font-display text-4xl font-extrabold tabular">{compare.cheaper}</p>
            {anunciar.length > 0 ? (
              <Link href={`/${slug}/encartes/novo?produtos=${anunciar.map((r) => r.productId).slice(0, 30).join(",")}&titulo=${encodeURIComponent("Menor preço da região")}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--folha)] hover:underline">
                Anunciar no encarte <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink-3)]">{compare.cheaper === 1 ? "produto" : "produtos"}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="ler">
          <div>
            <h2 id="ler" className="flex items-center gap-2 text-lg font-bold">
              <Camera className="size-5 text-[var(--uva)]" /> Encarte do concorrente
            </h2>
            <p className="text-sm text-[var(--ink-2)]">Foto do encarte impresso, print do Instagram ou do WhatsApp. A IA lê produtos e preços e compara com os seus.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="De qual mercado" htmlFor="c-sel">
              <Select id="c-sel" value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}>
                {competitors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="">Outro mercado</option>
              </Select>
            </Field>
            {!competitorId && (
              <Field label="Nome do mercado" htmlFor="c-nome">
                <Input id="c-nome" value={competitorName} onChange={(e) => setCompetitorName(e.target.value)} placeholder="Ex.: Supermercado Central" maxLength={120} />
              </Field>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && readFlyer(e.target.files[0])} />
          <Button size="lg" className="w-full" variant="ia" loading={reading} icon={<Camera className="size-5" />} onClick={() => fileRef.current?.click()}>
            {reading ? "Lendo o encarte, leva uns 30 segundos" : "Fotografar ou enviar encarte"}
          </Button>
          {flyers.length > 0 && (
            <ul className="space-y-1.5 text-sm">
              {flyers.slice(0, 5).map((f) => (
                <li key={f.id} className="flex justify-between gap-3 text-[var(--ink-2)]">
                  <span className="truncate">{f.competitor_name}</span>
                  <span className="shrink-0 tabular text-[var(--ink-3)]">
                    {f.items} preços, {dm(f.observed_on)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="perto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="perto" className="flex items-center gap-2 text-lg font-bold">
                <MapPin className="size-5 text-[var(--tomate)]" /> Mercados por perto
              </h2>
              <p className="text-sm text-[var(--ink-2)]">{hasAddress ? "Achados pelo endereço do seu mercado." : "Coloque o endereço em Mercado para achar."}</p>
            </div>
            <Button size="sm" variant="vidro" onClick={findCompetitors} loading={searching} disabled={!hasAddress} icon={<Search className="size-4" />}>
              {competitors.length ? "Atualizar" : "Buscar"}
            </Button>
          </div>
          {competitors.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">Nenhum concorrente ainda.</p>
          ) : (
            <ul className="rolagem max-h-[340px] divide-y divide-[var(--line)] overflow-y-auto">
              {competitors.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-[var(--ink-3)]">{c.address}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    {c.rating != null && (
                      <span className="flex items-center gap-1 tabular text-[var(--ink-2)]" title={`${c.reviews ?? 0} avaliações`}>
                        <Star className="size-4 fill-[var(--banana)] text-[#c99a00]" /> {c.rating.toLocaleString("pt-BR")}
                      </span>
                    )}
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.name} ${c.address ?? ""}`)}`} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)] hover:text-[var(--ink)]" aria-label={`Ver ${c.name} no mapa`}>
                      <ExternalLink className="size-4" />
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Glass>
      </div>

      {compare.rows.length > 0 && (
        <Glass as="section" className="space-y-4 p-5 sm:p-6" aria-labelledby="precos">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="precos" className="text-lg font-bold">Preços comparados</h2>
              <p className="text-sm text-[var(--ink-2)]">
                Produtos que o cliente compara (arroz, óleo, carne, cerveja...) acompanham o concorrente. Os outros seguram a margem.
                {unmatched > 0 && ` ${plural(unmatched, "preço lido não achou", "preços lidos não acharam")} produto igual no seu catálogo.`}
              </p>
            </div>
            <Segmented
              label="Filtro"
              size="sm"
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "acao", label: "Pedem ajuste" },
                { value: "anunciar", label: "Anunciar" },
                { value: "todos", label: "Todos" },
              ]}
            />
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">Nada neste filtro.</p>
          ) : (
            <div className="rolagem overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--ink-3)]">
                    <th className="py-2 pr-3 font-medium">Produto</th>
                    <th className="py-2 pr-3 text-right font-medium">Seu preço</th>
                    <th className="py-2 pr-3 text-right font-medium">Concorrente</th>
                    <th className="py-2 pr-3 text-right font-medium">Diferença</th>
                    <th className="py-2 font-medium">Sugestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {rows.map((r) => {
                    const done = applied[r.productId];
                    return (
                      <tr key={r.productId} className="align-top">
                        <td className="py-2.5 pr-3">
                          <span className="block font-medium">{r.name}</span>
                          <span className="block text-xs text-[var(--ink-3)]">
                            {r.role === "atracao" ? "Atração" : "Margem"} · {r.competitor}, {dm(r.observedOn)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular">{done ? brl(done) : r.ours == null ? "sem preço" : brl(r.ours)}</td>
                        <td className="py-2.5 pr-3 text-right tabular">{brl(r.theirs)}</td>
                        <td className={cn("py-2.5 pr-3 text-right font-semibold tabular", (r.diff ?? 0) > 0.01 ? "text-[var(--perigo)]" : (r.diff ?? 0) < -0.01 ? "text-[var(--folha)]" : "text-[var(--ink-2)]")}>
                          {r.diff == null ? "" : `${(r.diff ?? 0) > 0.01 ? "▲" : (r.diff ?? 0) < -0.01 ? "▼" : ""} ${pct(r.diff)}`}
                        </td>
                        <td className="py-2.5">
                          <span className="block text-xs text-[var(--ink-2)]">{r.advice.text}</span>
                          {r.advice.suggested != null &&
                            (done ? (
                              <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[var(--folha)]">
                                <Check className="size-4" /> Aplicado
                              </span>
                            ) : (
                              <Button size="sm" variant="vidro" className="mt-1" onClick={() => applyPrice(r)}>
                                Usar {brl(r.advice.suggested)}
                              </Button>
                            ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Glass>
      )}
    </div>
  );
}
