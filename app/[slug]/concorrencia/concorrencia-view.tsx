"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MapPin, Star, Search, Camera, ArrowRight, ExternalLink, TrendingDown, TrendingUp, Check, Megaphone, AtSign, Swords, CalendarClock, ShoppingBasket, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toJpeg } from "@/lib/client/image";
import { Button, Field, Glass, Input, Segmented, Select, cn } from "@/components/ui";
import type { CompareRow } from "@/lib/competition/compare";
import { plural } from "@/lib/plural";
import { distanceKm } from "@/lib/competition/places";
import type { Cadencia, Movimento, Placar } from "@/lib/competition/insights";
import type { PinConcorrente } from "./mapa";

const MapaConcorrentes = dynamic(() => import("./mapa").then((m) => m.MapaConcorrentes), { ssr: false, loading: () => <div className="h-[360px] animate-pulse rounded-[20px] bg-[var(--line)] sm:h-[420px]" /> });
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const adsUrl = (nome: string) => `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=${encodeURIComponent(nome)}&search_type=keyword_unordered`;
const instaUrl = (nome: string, cidade: string | null) => `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${nome} ${cidade ?? ""}`)}`;

type Competitor = { id: string; name: string; address: string | null; rating: number | null; reviews: number | null; category: string | null; latitude: number | null; longitude: number | null };
type Coords = { latitude: number; longitude: number };
const RAIOS = [1, 2, 3, 5, 10];
const km = (n: number) => `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
type Flyer = { id: string; competitor_name: string; observed_on: string; items: number; valid_until: string | null };

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const pct = (n: number) => `${n > 0 ? "+" : ""}${(n * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
type Filtro = "acao" | "todos" | "anunciar";

export function ConcorrenciaView({
  slug,
  marketId,
  hasAddress,
  origem,
  competitors,
  flyers,
  compare,
  unmatched,
  whatsapp,
  placar,
  cesta,
  movimentos,
  cadencia,
}: {
  slug: string;
  marketId: string;
  hasAddress: boolean;
  origem: { name: string; address: string | null; city: string | null };
  competitors: Competitor[];
  flyers: Flyer[];
  compare: { rows: CompareRow[]; index: number | null; cheaper: number; pricier: number };
  unmatched: number;
  whatsapp: { numero: string; cadastrado: boolean } | null;
  placar: Placar[];
  cesta: { itens: number; indice: number } | null;
  movimentos: Movimento[];
  cadencia: Cadencia[];
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
  const [radiusKm, setRadiusKm] = useState(3);
  const [ativo, setAtivo] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const radiusKey = `promia:raio:${marketId}`;

  // raio escolhido da última vez e coordenadas do endereço do mercado analisado
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(radiusKey));
      if (RAIOS.includes(saved)) queueMicrotask(() => setRadiusKm(saved));
    } catch {}
    if (!hasAddress) return;
    let alive = true;
    fetch("/api/concorrencia/origem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId }) })
      .then((r) => r.json())
      .then((d) => {
        if (alive && d?.origin) setCoords(d.origin);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [marketId, hasAddress, radiusKey]);

  function pickRadius(r: number) {
    setRadiusKm(r);
    try {
      localStorage.setItem(radiusKey, String(r));
    } catch {}
  }

  // distância de cada concorrente ao endereço do mercado; fora do raio some da lista
  const perto = useMemo(() => {
    const withDist = competitors.map((c) => ({
      ...c,
      dist: coords && c.latitude != null && c.longitude != null ? distanceKm(coords, { latitude: c.latitude, longitude: c.longitude }) : null,
    }));
    const dentro = withDist.filter((c) => c.dist == null || c.dist <= radiusKm).sort((a, b) => (a.dist ?? 99) - (b.dist ?? 99));
    return { dentro, fora: withDist.length - dentro.length };
  }, [competitors, coords, radiusKm]);
  const pins = useMemo<PinConcorrente[]>(() => {
    const por = new Map(placar.map((x) => [x.name, x]));
    return perto.dentro
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => {
        const x = por.get(c.name);
        const cor = !x ? "#8a948f" : x.indice > 0.01 ? "#d6213c" : x.indice < -0.01 ? "#1f8a4c" : "#f0a30a";
        const nota = !x ? "Sem encarte lido ainda" : x.indice > 0.01 ? `Mais barato que você em ${x.maisCaro} de ${x.comuns} produtos` : x.indice < -0.01 ? `Mais caro que você em ${x.maisBarato} de ${x.comuns} produtos` : "Preços parecidos com os seus";
        return { id: c.id, name: c.name, latitude: c.latitude!, longitude: c.longitude!, dist: c.dist, rating: c.rating, reviews: c.reviews, address: c.address, cor, nota };
      });
  }, [perto.dentro, placar]);
  const responder = compare.rows.filter((r) => r.role === "atracao" && r.advice.kind === "baixar");
  const enderecoCompleto = [origem.address, origem.city].filter(Boolean).join(", ");

  async function findCompetitors() {
    setSearching(true);
    try {
      const res = await fetch("/api/concorrencia/buscar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ marketId, radiusKm }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) return toast.error(d.error || "Não consegui buscar.");
      if (d.origin) setCoords(d.origin);
      toast.success(d.found ? `${plural(d.found, "mercado encontrado", "mercados encontrados")} em até ${radiusKm} km.` : `Nenhum mercado encontrado em até ${radiusKm} km.`);
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            {responder.length > 0 ? (
              <Link href={`/${slug}/encartes/novo?produtos=${responder.map((r) => r.productId).slice(0, 30).join(",")}&titulo=${encodeURIComponent("Cobrimos qualquer preço")}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[var(--perigo)] hover:underline">
                Responder com encarte <ArrowRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink-3)]">{compare.pricier === 1 ? "produto" : "produtos"}</p>
            )}
          </div>
          {cesta && (
            <div className="vidro rounded-[22px] p-5">
              <p className="flex items-center gap-1.5 text-sm text-[var(--ink-2)]"><ShoppingBasket className="size-4" /> Cesta que o cliente compara</p>
              <p className={cn("mt-1 font-display text-4xl font-extrabold tabular", cesta.indice > 0.01 ? "text-[var(--perigo)]" : cesta.indice < -0.01 ? "text-[var(--folha)]" : "")}>{pct(cesta.indice)}</p>
              <p className="mt-1 text-sm text-[var(--ink-3)]">{cesta.indice > 0.01 ? "acima" : cesta.indice < -0.01 ? "abaixo" : "alinhado"} dos concorrentes em {plural(cesta.itens, "item", "itens")} de atração</p>
            </div>
          )}
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
          {whatsapp && (
            <div className="rounded-2xl bg-[#e7f7ec] p-3.5 text-sm ring-1 ring-[#bfe5cb]">
              <p className="flex items-center gap-1.5 font-semibold text-[#14532d]"><MessageCircle className="size-4" /> Ou mande pelo WhatsApp <span className="rounded-full bg-[#14532d] px-2 py-0.5 text-[11px] font-semibold text-white">Beta</span></p>
              <p className="mt-1 text-[#14532d]/85">
                {whatsapp.cadastrado
                  ? "Mande a foto do encarte para o número do Promia, com o nome do mercado na legenda. A comparação volta na conversa em cerca de 30 segundos."
                  : "Cadastre o WhatsApp do seu mercado em Mercado. Só ele pode mandar encartes para o Promia."}
              </p>
              <a href={`https://wa.me/${whatsapp.numero}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1f8a4c] px-4 font-semibold text-white transition hover:-translate-y-px">
                Abrir conversa <ArrowRight className="size-4" />
              </a>
            </div>
          )}
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
              <p className="text-sm text-[var(--ink-2)]">{hasAddress ? "Concorrentes em volta do endereço abaixo." : "Coloque o endereço em Mercado para achar."}</p>
            </div>
            <Button size="sm" variant="vidro" onClick={findCompetitors} loading={searching} disabled={!hasAddress} icon={<Search className="size-4" />}>
              {competitors.length ? "Atualizar" : "Buscar"}
            </Button>
          </div>
          {hasAddress && (
            <div className="space-y-3 rounded-2xl bg-white/60 p-3.5 ring-1 ring-[var(--line)]">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--tomate)] text-white"><MapPin className="size-5" aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--ink-3)]">Ponto de partida: o mercado analisado</p>
                  <p className="font-semibold">{origem.name}</p>
                  <p className="text-sm text-[var(--ink-2)]">{enderecoCompleto}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${origem.name} ${enderecoCompleto}`)}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--folha)] hover:underline">
                    Ver no mapa <ExternalLink className="size-3" aria-hidden />
                  </a>
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-[var(--ink-3)]">Raio da busca</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Raio da busca">
                  {RAIOS.map((r) => (
                    <button key={r} type="button" onClick={() => pickRadius(r)} aria-pressed={radiusKm === r} className={cn("h-10 rounded-full px-3.5 text-sm font-semibold ring-1 transition", radiusKm === r ? "bg-[var(--ink)] text-[var(--bg)] ring-transparent" : "bg-white/70 ring-[var(--line)] hover:bg-white")}>
                      {r} km
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-[var(--ink-2)]">
                  Mostrando mercados em até <strong className="font-semibold">{radiusKm} km</strong> deste endereço
                  {perto.fora > 0 ? `. ${plural(perto.fora, "mercado fica", "mercados ficam")} fora do raio e não aparece${perto.fora > 1 ? "m" : ""}. Aumente o raio para ver.` : "."}
                  {!coords && competitors.length > 0 ? " Calculando as distâncias..." : ""}
                </p>
              </div>
            </div>
          )}
          {coords && pins.length > 0 && (
            <div className="space-y-2">
              <MapaConcorrentes origem={{ name: origem.name, latitude: coords.latitude, longitude: coords.longitude }} pins={pins} raioKm={radiusKm} ativo={ativo} onPick={setAtivo} />
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--ink-2)]">
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#d6213c]" /> mais barato que você</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#1f8a4c]" /> mais caro que você</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#f0a30a]" /> parecido</span>
                <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[#8a948f]" /> sem encarte lido</span>
              </p>
            </div>
          )}
          {perto.dentro.length === 0 ? (
            <p className="text-sm text-[var(--ink-3)]">{competitors.length ? `Nenhum concorrente em até ${radiusKm} km. Aumente o raio.` : "Nenhum concorrente ainda."}</p>
          ) : (
            <ul className="rolagem max-h-[340px] divide-y divide-[var(--line)] overflow-y-auto">
              {perto.dentro.map((c) => (
                <li key={c.id} onMouseEnter={() => setAtivo(c.id)} className={cn("flex items-start justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors", ativo === c.id && "bg-[color-mix(in_srgb,var(--tomate)_8%,transparent)]")}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-[var(--ink-3)]">{c.dist != null ? <strong className="font-semibold text-[var(--ink-2)]">{km(c.dist)} · </strong> : null}{c.address}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    {c.rating != null && (
                      <span className="flex items-center gap-1 tabular text-[var(--ink-2)]" title={`${c.reviews ?? 0} avaliações`}>
                        <Star className="size-4 fill-[var(--banana)] text-[#c99a00]" /> {c.rating.toLocaleString("pt-BR")}
                      </span>
                    )}
                    <a href={adsUrl(c.name)} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)] hover:text-[var(--ink)]" aria-label={`Ver anúncios de ${c.name} no Facebook e Instagram`} title="Anúncios ativos (Facebook e Instagram)">
                      <Megaphone className="size-4" />
                    </a>
                    <a href={instaUrl(c.name, origem.city)} target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-xl text-[var(--ink-3)] hover:bg-[var(--line)] hover:text-[var(--ink)]" aria-label={`Achar o Instagram de ${c.name}`} title="Achar o Instagram">
                      <AtSign className="size-4" />
                    </a>
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

      {(placar.length > 0 || movimentos.length > 0) && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
          {placar.length > 0 && (
            <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="placar">
              <h2 id="placar" className="flex items-center gap-2 text-lg font-bold"><Swords className="size-5 text-[var(--tomate)]" /> Você contra cada um</h2>
              <ul className="space-y-3">
                {placar.map((x) => {
                  const mais = x.indice > 0.01;
                  const menos = x.indice < -0.01;
                  const larg = Math.min(100, Math.abs(x.indice) * 400);
                  return (
                    <li key={x.name}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-medium">{x.name}</span>
                        <span className={cn("shrink-0 font-semibold tabular", mais ? "text-[var(--perigo)]" : menos ? "text-[var(--folha)]" : "text-[var(--ink-2)]")}>{pct(x.indice)}</span>
                      </div>
                      <span className="mt-1 block h-2 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden>
                        <span className="block h-full rounded-full" style={{ width: `${Math.max(4, larg)}%`, background: mais ? "#d6213c" : menos ? "#1f8a4c" : "#f0a30a" }} />
                      </span>
                      <p className="mt-1 text-xs text-[var(--ink-3)]">
                        {mais ? "Você está mais caro" : menos ? "Você está mais barato" : "Preços parecidos"} em {x.comuns} produtos em comum (mais barato em {x.maisBarato}, mais caro em {x.maisCaro}). Visto em {dm(x.visto)}.
                      </p>
                    </li>
                  );
                })}
              </ul>
              {cadencia.length > 0 && (
                <div className="space-y-1 rounded-2xl bg-white/60 p-3 text-sm ring-1 ring-[var(--line)]">
                  <p className="flex items-center gap-1.5 font-medium"><CalendarClock className="size-4" /> Quando eles soltam encarte</p>
                  {cadencia.map((c) => (
                    <p key={c.competitor} className="text-[var(--ink-2)]">{c.competitor} costuma publicar na {DIAS[c.dia]} ({c.vezes} de {c.total} encartes). Solte o seu um dia antes.</p>
                  ))}
                </div>
              )}
            </Glass>
          )}
          {movimentos.length > 0 && (
            <Glass as="section" className="space-y-3 p-5 sm:p-6" aria-labelledby="mudou">
              <h2 id="mudou" className="text-lg font-bold">O que mudou nos concorrentes</h2>
              <p className="text-sm text-[var(--ink-2)]">Mesmo produto, preço novo contra o anterior.</p>
              <ul className="divide-y divide-[var(--line)]">
                {movimentos.map((m, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{m.product}</span>
                      <span className="block truncate text-xs text-[var(--ink-3)]">{m.competitor}, {dm(m.em)}: de {brl(m.antes)} para {brl(m.agora)}</span>
                    </span>
                    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold tabular", m.change < 0 ? "bg-[#fde3e6] text-[var(--perigo)]" : "bg-[#dff3e6] text-[var(--folha)]")}>{m.change < 0 ? "▼" : "▲"} {pct(m.change)}</span>
                  </li>
                ))}
              </ul>
            </Glass>
          )}
        </div>
      )}

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
