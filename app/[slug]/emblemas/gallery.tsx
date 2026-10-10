"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Copy, Download, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, EmptyState, Field, Glass, Input, Segmented, Select, Sheet, cn } from "@/components/ui";
import { emblemaPng, emblemaThumb, VARIANTE_LABEL, VARIANTE_USO, type Emblema, type Variante } from "@/lib/emblemas/catalog";
import { FILTRO_VAZIO, filtrarEmblemas, filtrarPlanejados, filtroAtivo, type Filtro, type Janela } from "@/lib/emblemas/filtro";
import type { Planejado } from "@/lib/emblemas/planejados";
import { EM_CODIGO, VARIACOES } from "@/lib/emblemas/planejados";
import { quandoTexto } from "@/lib/emblemas/quando";
import { FERIADOS, TIPOS, TIPO_HINT, TIPO_LABEL, type Feriado, type TipoOferta } from "@/lib/emblemas/tipos";

type Aba = "prontos" | "faltam";
type Fundo = "claro" | "escuro" | "mercado";

const JANELAS: { value: Janela; label: string }[] = [
  { value: "qualquer", label: "Qualquer data" },
  { value: "hoje", label: "Hoje" },
  { value: "7", label: "Próximos 7 dias" },
  { value: "30", label: "Próximos 30 dias" },
  { value: "data", label: "Escolher uma data" },
];

const PRIORIDADE = {
  1: { titulo: "Prioridade alta", dica: "Aparecem toda semana ou mês, ou movem muito dinheiro", tone: "perigo" as const },
  2: { titulo: "Prioridade média", dica: "Algumas vezes por ano ou departamentos de apoio", tone: "atencao" as const },
  3: { titulo: "Prioridade baixa", dica: "Nicho ou complemento", tone: "neutro" as const },
};

function fundoClasse(f: Fundo) {
  return f === "claro" ? "bg-[#f3f1ec]" : f === "escuro" ? "bg-[#17201b]" : "";
}

export function EmblemasGallery({
  hoje,
  temas,
  corMercado,
  emblemas,
  planejados,
}: {
  hoje: string;
  temas: { key: string; name: string }[];
  corMercado: string;
  emblemas: Emblema[];
  planejados: Planejado[];
}) {
  const [aba, setAba] = useState<Aba>("prontos");
  const [f, setF] = useState<Filtro>(FILTRO_VAZIO);
  const [fundo, setFundo] = useState<Fundo>("claro");
  const [aberto, setAberto] = useState<Emblema | null>(null);
  const [variante, setVariante] = useState<Variante | null>(null);
  const [copiado, setCopiado] = useState(false);

  const prontos = useMemo(() => filtrarEmblemas(emblemas, f, hoje), [emblemas, f, hoje]);
  const faltam = useMemo(() => filtrarPlanejados(planejados, f, hoje), [planejados, f, hoje]);
  const set = <K extends keyof Filtro>(k: K, v: Filtro[K]) => setF((cur) => ({ ...cur, [k]: v }));
  const ativo = filtroAtivo(f);
  const lista = aba === "prontos" ? prontos.length : faltam.length;
  const estiloFundo = fundo === "mercado" ? { backgroundColor: `color-mix(in srgb, ${corMercado} 22%, white)` } : undefined;

  async function copiar() {
    const texto = ([1, 2, 3] as const)
      .map((p) => {
        const itens = faltam.filter((x) => x.prioridade === p);
        if (!itens.length) return "";
        return `${PRIORIDADE[p].titulo.toUpperCase()}\n${itens.map((x) => `- ${x.nome} (${TIPO_LABEL[x.tipo]}): ${x.ideia}`).join("\n")}`;
      })
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Lista copiada");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Não consegui copiar. Selecione o texto e copie.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Mostrar"
          value={aba}
          onChange={setAba}
          options={[
            { value: "prontos", label: `Prontos (${emblemas.length})` },
            { value: "faltam", label: `Faltam criar (${planejados.length})` },
          ]}
        />
        {aba === "prontos" ? (
          <Segmented
            label="Fundo da prévia"
            size="sm"
            value={fundo}
            onChange={setFundo}
            options={[
              { value: "claro", label: "Claro" },
              { value: "escuro", label: "Escuro" },
              { value: "mercado", label: "Seu mercado" },
            ]}
          />
        ) : (
          <Button variant="vidro" size="sm" icon={copiado ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copiar} disabled={!faltam.length}>
            Copiar lista para gerar
          </Button>
        )}
      </div>

      <Glass className="space-y-3 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-[var(--ink-3)]" aria-hidden />
          <Input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Buscar por nome, produto ou ideia (churrasco, carne, cerveja)" className="pl-10" aria-label="Buscar emblemas" type="search" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Tipo de oferta" htmlFor="f-tipo">
            <Select id="f-tipo" value={f.tipo} onChange={(e) => set("tipo", e.target.value as TipoOferta | "")}>
              <option value="">Todos os tipos</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tema do encarte" htmlFor="f-tema" hint={aba === "faltam" ? "Os que faltam ainda não têm tema" : undefined}>
            <Select id="f-tema" value={f.tema} onChange={(e) => set("tema", e.target.value)}>
              <option value="">Todos os temas</option>
              {temas.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
              <option value="sem-tema">Sem tema no encarte ainda</option>
            </Select>
          </Field>
          <Field label="Quando usar" htmlFor="f-quando">
            <Select id="f-quando" value={f.janela} onChange={(e) => set("janela", e.target.value as Janela)}>
              {JANELAS.map((j) => (
                <option key={j.value} value={j.value}>
                  {j.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Feriado ou data" htmlFor="f-feriado">
            <Select id="f-feriado" value={f.feriado} onChange={(e) => set("feriado", e.target.value as Feriado | "")}>
              <option value="">Todas</option>
              {FERIADOS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {f.janela === "data" ? (
          <div className="max-w-xs">
            <Field label="Data" htmlFor="f-data">
              <Input id="f-data" type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
            </Field>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--ink-2)]">
          <p role="status" aria-live="polite">
            {lista === 0 ? "Nenhum resultado" : `${lista} ${aba === "prontos" ? (lista === 1 ? "emblema" : "emblemas") : "para criar"}`}
            {f.janela !== "qualquer" && aba === "prontos" ? ". Os do ano todo vêm depois dos que combinam com a data." : ""}
          </p>
          {ativo ? (
            <Button variant="fantasma" size="sm" icon={<X className="size-4" />} onClick={() => setF(FILTRO_VAZIO)}>
              Limpar filtros
            </Button>
          ) : null}
        </div>
      </Glass>

      {aba === "prontos" ? (
        prontos.length === 0 ? (
          <Glass>
            <EmptyState title="Nenhum emblema com esses filtros" action={<Button variant="vidro" onClick={() => setF(FILTRO_VAZIO)}>Limpar filtros</Button>}>
              Tente outro tipo, outra data ou veja na aba Faltam criar se já está na lista.
            </EmptyState>
          </Glass>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {prontos.map((e) => (
              <li key={e.slug}>
                <button
                  type="button"
                  onClick={() => {
                    setVariante(null);
                    setAberto(e);
                  }}
                  className="vidro group block w-full overflow-hidden rounded-[22px] text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                >
                  <span className={cn("grid aspect-[4/3] place-items-center p-3", fundoClasse(fundo))} style={estiloFundo}>
                    <Image src={emblemaThumb(e.slug)} alt={`Emblema ${e.nome}`} width={440} height={330} unoptimized className="max-h-full w-auto object-contain" loading="lazy" />
                  </span>
                  <span className="block space-y-1 p-3">
                    <span className="block truncate font-semibold">{e.nome}</span>
                    <span className="flex flex-wrap items-center gap-1.5">
                      <Badge>{TIPO_LABEL[e.tipo]}</Badge>
                      {e.alternativa ? <Badge tone="ia">Variação</Badge> : null}
                      {e.variantes?.length ? <Badge tone="ok">{e.variantes.length + 1} versões</Badge> : null}
                    </span>
                    <span className="block truncate text-xs text-[var(--ink-3)]">{quandoTexto(e.quando)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-6">
          {([1, 2, 3] as const).map((p) => {
            const itens = faltam.filter((x) => x.prioridade === p);
            if (!itens.length) return null;
            return (
              <section key={p} className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-bold">{PRIORIDADE[p].titulo}</h2>
                  <span className="text-sm text-[var(--ink-3)]">
                    {itens.length} {itens.length === 1 ? "emblema" : "emblemas"}. {PRIORIDADE[p].dica}
                  </span>
                </div>
                <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {itens.map((x) => (
                    <li key={x.nome} className="vidro rounded-2xl p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{x.nome}</span>
                        <Badge tone={PRIORIDADE[p].tone}>{TIPO_LABEL[x.tipo]}</Badge>
                        {x.quando ? <span className="text-xs text-[var(--ink-3)]">{quandoTexto(x.quando)}</span> : null}
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink-2)]">{x.ideia}</p>
                      {x.motivo ? <p className="mt-1 text-xs text-[var(--ink-3)]">{x.motivo}</p> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {faltam.length === 0 ? (
            <Glass>
              <EmptyState title="Nada na lista com esses filtros">Esse tipo ou data já está coberto pelos emblemas prontos.</EmptyState>
            </Glass>
          ) : null}
          {!ativo ? (
            <div className="grid gap-3 lg:grid-cols-2">
              <Glass className="p-4">
                <h2 className="font-bold">Sai em código, sem gerar imagem</h2>
                <p className="mt-1 text-sm text-[var(--ink-2)]">O motor do encarte desenha estas peças nítidas em qualquer tamanho.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {EM_CODIGO.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </Glass>
              <Glass className="p-4">
                <h2 className="font-bold">Variações dos emblemas prontos</h2>
                <p className="mt-1 text-sm text-[var(--ink-2)]">Vale pedir junto com os próximos, para cada emblema servir em qualquer espaço.</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {VARIACOES.map((x) => (
                    <li key={x.nome}>
                      <span className="font-semibold">{x.nome}.</span> <span className="text-[var(--ink-2)]">{x.para}</span>
                    </li>
                  ))}
                </ul>
              </Glass>
            </div>
          ) : null}
        </div>
      )}

      <Sheet open={!!aberto} onClose={() => setAberto(null)} title={aberto?.nome ?? ""} description={aberto ? TIPO_HINT[aberto.tipo] : undefined} wide>
        {aberto ? (
          <div className="space-y-4">
            <div className={cn("grid place-items-center rounded-2xl p-4", fundoClasse(fundo))} style={estiloFundo}>
              <Image key={`${aberto.slug}-${variante ?? "ilustrado"}`} src={emblemaPng(aberto.slug, variante ?? undefined)} alt={`Emblema ${aberto.nome}${variante ? `, versão ${VARIANTE_LABEL[variante].toLowerCase()}` : ""}`} width={640} height={480} unoptimized className="max-h-[46vh] w-auto object-contain" />
            </div>
            {aberto.variantes?.length ? (
              <div className="space-y-1.5">
                <div role="group" aria-label="Versão do emblema" className="flex flex-wrap gap-2">
                  {([null, ...aberto.variantes] as (Variante | null)[]).map((v) => (
                    <button
                      key={v ?? "ilustrado"}
                      type="button"
                      aria-pressed={variante === v}
                      onClick={() => setVariante(v)}
                      className={cn(
                        "h-10 rounded-2xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]",
                        variante === v ? "bg-[var(--ink)] text-[var(--bg)]" : "vidro hover:opacity-80",
                      )}
                    >
                      {v ? VARIANTE_LABEL[v] : "Ilustrado"}
                    </button>
                  ))}
                </div>
                {variante ? <p className="text-xs text-[var(--ink-3)]">{VARIANTE_USO[variante]}</p> : null}
              </div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{TIPO_LABEL[aberto.tipo]}</Badge>
              {aberto.baixaResolucao ? <Badge tone="atencao">Arquivo pequeno</Badge> : null}
              {aberto.alternativa ? <Badge tone="ia">Variação</Badge> : null}
              {aberto.feriados.map((x) => (
                <Badge key={x} tone="atencao">
                  {x}
                </Badge>
              ))}
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--ink-3)]">Quando usar</dt>
                <dd className="font-medium">{quandoTexto(aberto.quando)}</dd>
              </div>
              <div>
                <dt className="text-[var(--ink-3)]">Temas do encarte</dt>
                <dd className="font-medium">
                  {aberto.temas.length ? aberto.temas.map((k) => temas.find((t) => t.key === k)?.name ?? k).join(", ") : "Ainda sem tema próprio"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--ink-3)]">Grupo</dt>
                <dd className="font-medium">{aberto.grupo}</dd>
              </div>
              <div>
                <dt className="text-[var(--ink-3)]">Palavras-chave</dt>
                <dd className="font-medium">{aberto.tags.join(", ")}</dd>
              </div>
            </dl>
            {aberto.versoesPequenas ? <p className="text-xs text-[var(--ink-3)]">As versões Só texto e Uma cor ainda estão em cerca de 400 px de largura. Ilustrado e Horizontal estão em alta resolução, boas para impressão.</p> : null}
            {aberto.baixaResolucao ? <p className="text-xs text-[var(--ink-3)]">Arquivo original com menos de 1000 px de largura. Serve no cabeçalho de story e feed, mas fica mole em A4 impresso. Está na lista para refazer em alta resolução.</p> : null}
            {aberto.nota ? <p className="rounded-xl bg-[color-mix(in_srgb,var(--banana)_30%,transparent)] p-3 text-sm">{aberto.nota}</p> : null}
            <a
              href={emblemaPng(aberto.slug, variante ?? undefined)}
              download={`${aberto.slug}${variante ? `--${variante}` : ""}.png`}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
            >
              <Download className="size-4" aria-hidden />
              Baixar PNG transparente
            </a>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
