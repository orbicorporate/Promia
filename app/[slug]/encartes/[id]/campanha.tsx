"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles, Copy, Check, MessageCircle, Printer, RotateCw, Clapperboard, Megaphone, CalendarDays, Store, Download } from "lucide-react";
import { toast } from "sonner";
import { Button, Glass, Segmented, cn } from "@/components/ui";
import type { CampaignContent } from "@/lib/ai/campaign";

type Tab = "posts" | "whatsapp" | "video" | "loja";

const FORMAT_LABEL = { feed: "Feed", story: "Story", reels: "Reels" } as const;

function fmtDay(iso: string) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" }).replace(".", "");
}

function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      size="sm"
      variant="vidro"
      icon={done ? <Check className="size-4 text-[var(--folha)]" /> : <Copy className="size-4" />}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          toast.error("Não consegui copiar. Selecione o texto e copie.");
        }
      }}
    >
      {done ? "Copiado" : label}
    </Button>
  );
}

export function CampaignPanel({ encarteId, imageHref, initial }: { encarteId: string; imageHref: string; initial: CampaignContent | null }) {
  const [campaign, setCampaign] = useState(initial);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<Tab>("posts");

  async function generate() {
    setRunning(true);
    try {
      const res = await fetch(`/api/encartes/${encarteId}/campanha`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Não consegui criar a campanha.");
        return;
      }
      setCampaign(data.campaign);
      setTab("posts");
      toast.success("Campanha pronta.");
    } catch {
      toast.error("Sem conexão agora. Tente de novo.");
    } finally {
      setRunning(false);
    }
  }

  if (!campaign) {
    return (
      <Glass as="section" data-trabalhando={running} className={cn("borda-ia p-6 sm:p-8", running && "varredura")} aria-labelledby="campanha">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 id="campanha" className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="size-5 text-[var(--uva)]" /> Campanha completa
            </h2>
            <p className="mt-1 text-[var(--ink-2)]">
              {running
                ? "A IA está escrevendo a campanha. Leva uns 30 segundos."
                : "Legendas para 3 posts, mensagem de WhatsApp, roteiro de vídeo, texto de carro de som, calendário e cartazes para a gôndola, tudo a partir deste encarte."}
            </p>
          </div>
          <Button variant="ia" size="lg" onClick={generate} loading={running} icon={<Sparkles className="size-5" />}>
            {running ? "Criando" : "Criar campanha"}
          </Button>
        </div>
      </Glass>
    );
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(campaign.whatsapp)}`;

  return (
    <Glass as="section" className="space-y-5 p-5 sm:p-6" aria-labelledby="campanha">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 id="campanha" className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-[var(--uva)]" /> Campanha
          </h2>
          {campaign.resumo && <p className="mt-1 text-[var(--ink-2)]">{campaign.resumo}</p>}
        </div>
        <Button size="sm" variant="fantasma" onClick={generate} loading={running} icon={<RotateCw className="size-4" />}>
          Refazer
        </Button>
      </div>

      <div className="rolagem -mx-1 overflow-x-auto px-1">
        <Segmented
          label="Parte da campanha"
          value={tab}
          onChange={setTab}
          options={[
            { value: "posts", label: "Posts", icon: <Megaphone className="size-4" /> },
            { value: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="size-4" /> },
            { value: "video", label: "Vídeo e áudio", icon: <Clapperboard className="size-4" /> },
            { value: "loja", label: "Loja", icon: <Store className="size-4" /> },
          ]}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        >
          {tab === "posts" && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-3">
              {campaign.posts.map((p, i) => (
                <article key={i} className="flex flex-col gap-3 rounded-2xl bg-[var(--glass-strong)] p-4 ring-1 ring-[var(--line)]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[var(--line)] px-2.5 py-0.5 text-xs font-medium">{FORMAT_LABEL[p.formato]}</span>
                    <span className="text-xs text-[var(--ink-3)]">{p.quando}</span>
                  </div>
                  <h3 className="font-semibold">{p.titulo}</h3>
                  <p className="flex-1 whitespace-pre-line text-[15px] leading-relaxed text-[var(--ink-2)]">{p.legenda}</p>
                  {p.hashtags.length > 0 && <p className="text-sm text-[var(--uva)]">{p.hashtags.join(" ")}</p>}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <CopyButton text={`${p.legenda}${p.hashtags.length ? `\n\n${p.hashtags.join(" ")}` : ""}`} label="Copiar legenda" />
                    <a href={imageHref} download className="inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium text-[var(--ink-2)] hover:bg-[var(--line)] hover:text-[var(--ink)]">
                      <Download className="size-4" /> Arte
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}

          {tab === "whatsapp" && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="max-w-xl rounded-2xl rounded-tl-md bg-[#dcf8c6] p-4 text-[15px] leading-relaxed whitespace-pre-line text-[#111b21] shadow-sm">{campaign.whatsapp}</div>
              <div className="flex flex-wrap gap-2 md:flex-col">
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[#25d366] px-5 font-medium text-[#0b3d1f] transition hover:brightness-105 active:scale-[0.97]">
                  <MessageCircle className="size-5" /> Enviar no WhatsApp
                </a>
                <CopyButton text={campaign.whatsapp} />
              </div>
            </div>
          )}

          {tab === "video" && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="font-semibold">{campaign.video.titulo || "Vídeo de 15 segundos"}</h3>
                <ol className="space-y-2">
                  {campaign.video.cenas.map((c, i) => (
                    <li key={i} className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl bg-[var(--glass-strong)] p-3 ring-1 ring-[var(--line)]">
                      <span className="tabular text-sm font-semibold text-[var(--uva)]">{c.tempo}</span>
                      <span className="space-y-1 text-sm">
                        {c.imagem && <span className="block text-[var(--ink-3)]">{c.imagem}</span>}
                        {c.fala && <span className="block font-medium">&ldquo;{c.fala}&rdquo;</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Carro de som ou rádio</h3>
                <p className="rounded-2xl bg-[var(--glass-strong)] p-4 text-[15px] leading-relaxed whitespace-pre-line ring-1 ring-[var(--line)]">{campaign.carroDeSom}</p>
                <CopyButton text={campaign.carroDeSom} />
              </div>
            </div>
          )}

          {tab === "loja" && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  <CalendarDays className="size-5 text-[var(--ink-3)]" /> Calendário
                </h3>
                <ol className="space-y-2">
                  {campaign.calendario.map((c, i) => (
                    <li key={i} className="flex gap-3 rounded-2xl bg-[var(--glass-strong)] p-3 text-sm ring-1 ring-[var(--line)]">
                      <span className="w-24 shrink-0 font-semibold capitalize">{fmtDay(c.data)}</span>
                      <span className="text-[var(--ink-2)]">{c.acao}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Store className="size-5 text-[var(--ink-3)]" /> Na loja
                </h3>
                <ul className="space-y-2">
                  {campaign.dicasLoja.map((d, i) => (
                    <li key={i} className="rounded-2xl bg-[var(--glass-strong)] p-3 text-sm ring-1 ring-[var(--line)]">
                      {d}
                    </li>
                  ))}
                </ul>
                <a
                  href={`/api/encartes/${encarteId}/cartazes`}
                  className="inline-flex h-11 items-center gap-2 rounded-[14px] bg-[var(--ink)] px-5 font-medium text-[var(--bg)] transition active:scale-[0.97]"
                >
                  <Printer className="size-5" /> Baixar cartazes de gôndola (PDF)
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Glass>
  );
}
