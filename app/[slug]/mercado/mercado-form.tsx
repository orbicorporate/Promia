"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ImagePlus, Trash2, Plus, X, Phone, MapPin, Clock, AtSign } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Glass, Input, Select, Textarea, cn } from "@/components/ui";
import { DEFAULT_LEGAL_NOTE } from "@/lib/encarte/text";

type Promo = { id: string; weekday: number; name: string; category_hint: string | null; active: boolean };

export type MarketForm = {
  id: string;
  name: string;
  tagline: string;
  niche: string;
  logoUrl: string | null;
  colorPrimary: string;
  colorSecondary: string;
  whatsapp: string;
  phone: string;
  instagram: string;
  address: string;
  city: string;
  openingHours: string;
  legalNote: string;
};

const DIAS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const SUGESTOES: [number, string, string][] = [
  [3, "Quarta do Hortifrúti", "hortifruti"],
  [4, "Quinta da Carne", "açougue"],
  [2, "Terça da Limpeza", "limpeza"],
  [5, "Sexta da Cerveja", "bebidas"],
];

// Cores mais marcantes do logo, para o dono escolher com um toque.
function extractColors(img: HTMLImageElement): string[] {
  const c = document.createElement("canvas");
  const size = 64;
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    return [];
  }
  const buckets = new Map<string, { r: number; g: number; b: number; count: number; weight: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 160) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (max > 238 && sat < 0.12) continue; // branco
    if (max < 28) continue; // preto
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bk = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, weight: 0 };
    bk.r += r;
    bk.g += g;
    bk.b += b;
    bk.count += 1;
    bk.weight += 1 + sat * 2; // cor viva pesa mais que cinza
    buckets.set(key, bk);
  }
  const hex = (v: number) => Math.round(Math.min(255, v)).toString(16).padStart(2, "0");
  const out: string[] = [];
  for (const b of [...buckets.values()].sort((x, y) => y.weight - x.weight)) {
    const color = `#${hex(b.r / b.count)}${hex(b.g / b.count)}${hex(b.b / b.count)}`;
    if (!out.some((o) => distance(o, color) < 60)) out.push(color);
    if (out.length >= 5) break;
  }
  return out;
}

function distance(a: string, b: string) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

function readable(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#14201a" : "#ffffff";
}

export function MercadoForm({ initial, promotions }: { initial: MarketForm; promotions: Promo[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const [promos, setPromos] = useState(promotions);
  const [novo, setNovo] = useState({ weekday: 3, name: "", categoryHint: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);

  useEffect(() => {
    if (!f.logoUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setPalette(extractColors(img));
    img.src = f.logoUrl;
  }, [f.logoUrl]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (k: keyof MarketForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function api(method: string, url: string, body: unknown) {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Não consegui salvar.");
    return data;
  }

  async function save() {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, logoUrl, ...rest } = f;
      await api("PATCH", "/api/mercado", { marketId: id, ...rest, onboarded: true });
      setSaved(f);
      toast.success("Mercado salvo. Os próximos encartes já saem assim.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    setUploading(true);
    try {
      const prep = await api("POST", "/api/mercado/logo", { marketId: f.id, fileName: file.name });
      const { error } = await createClient().storage.from("midia").uploadToSignedUrl(prep.path, prep.token, file, { contentType: file.type });
      if (error) throw new Error("Não consegui enviar o logo. Tente de novo.");
      const r = await api("PUT", "/api/mercado/logo", { marketId: f.id, path: prep.path });
      setF((x) => ({ ...x, logoUrl: r.url }));
      setSaved((x) => ({ ...x, logoUrl: r.url }));
      toast.success("Logo aplicado. Toque numa cor do logo para usar no encarte.");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function removeLogo() {
    try {
      await api("PATCH", "/api/mercado", { marketId: f.id, removeLogo: true });
      setF((x) => ({ ...x, logoUrl: null }));
      setSaved((x) => ({ ...x, logoUrl: null }));
      setPalette([]);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function addPromo(p = novo) {
    if (!p.name.trim()) return toast.error("Dê um nome à promoção.");
    try {
      const r = await api("POST", "/api/mercado/promocoes", { marketId: f.id, ...p });
      setPromos((x) => [...x, r.promotion]);
      setNovo({ weekday: 3, name: "", categoryHint: "" });
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function removePromo(id: string) {
    const prev = promos;
    setPromos((x) => x.filter((p) => p.id !== id));
    try {
      await api("DELETE", "/api/mercado/promocoes", { marketId: f.id, id });
    } catch (err) {
      setPromos(prev);
      toast.error((err as Error).message);
    }
  }

  const primary = /^#[0-9a-f]{6}$/i.test(f.colorPrimary) ? f.colorPrimary : "#12201a";
  const secondary = /^#[0-9a-f]{6}$/i.test(f.colorSecondary) ? f.colorSecondary : "#ffcf3a";
  const contato = [f.whatsapp && `WhatsApp ${f.whatsapp}`, f.instagram && (f.instagram.startsWith("@") ? f.instagram : `@${f.instagram}`)].filter(Boolean).join("  ·  ");

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-20 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Glass className="space-y-5 p-5 sm:p-6">
          <h2 className="text-xl font-bold">Identidade</h2>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={cn(
                "group relative grid size-28 shrink-0 place-items-center overflow-hidden rounded-[22px] bg-white ring-1 ring-[var(--line)] transition hover:ring-2 hover:ring-[var(--uva)]",
                uploading && "varredura"
              )}
              aria-label="Enviar logo"
            >
              {f.logoUrl ? (
                <img src={f.logoUrl} alt="Logo do mercado" className="h-full w-full object-contain p-2" />
              ) : (
                <span className="flex flex-col items-center gap-1 text-xs text-[#6f8178]">
                  <ImagePlus className="size-7" />
                  Enviar logo
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
                e.target.value = "";
              }}
            />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm text-[var(--ink-2)]">PNG com fundo transparente fica melhor. O logo vai no topo de todo encarte.</p>
              <div className="flex gap-2">
                <Button size="sm" variant="vidro" loading={uploading} onClick={() => fileRef.current?.click()} icon={<ImagePlus className="size-4" />}>
                  {f.logoUrl ? "Trocar logo" : "Enviar logo"}
                </Button>
                {f.logoUrl && (
                  <Button size="sm" variant="fantasma" onClick={removeLogo} icon={<Trash2 className="size-4" />}>
                    Tirar
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField label="Cor principal" hint="Barra do topo e rodapé" value={f.colorPrimary} onChange={(v) => setF((x) => ({ ...x, colorPrimary: v }))} palette={palette} />
            <ColorField label="Cor de apoio" hint="Detalhes e selos" value={f.colorSecondary} onChange={(v) => setF((x) => ({ ...x, colorSecondary: v }))} palette={palette} />
            <Field label="Nome do mercado" htmlFor="m-nome">
              <Input id="m-nome" value={f.name} onChange={set("name")} maxLength={80} />
            </Field>
            <Field label="Frase do mercado" hint="Aparece embaixo do nome" htmlFor="m-frase">
              <Input id="m-frase" value={f.tagline} onChange={set("tagline")} maxLength={80} placeholder="O preço baixo do bairro" />
            </Field>
            <Field label="Tipo de loja" hint="Ajuda a IA a sugerir ofertas certas" className="sm:col-span-2" htmlFor="m-nicho">
              <Input id="m-nicho" value={f.niche} onChange={set("niche")} maxLength={80} placeholder="Supermercado de bairro, atacarejo, hortifrúti..." />
            </Field>
          </div>
        </Glass>

        <Glass className="scroll-mt-24 space-y-5 p-5 sm:p-6" id="contatos">
          <h2 className="text-xl font-bold">Contatos no rodapé</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp" htmlFor="m-zap">
              <IconInput icon={<Phone className="size-4" />} id="m-zap" value={f.whatsapp} onChange={set("whatsapp")} inputMode="tel" placeholder="(15) 99876-5432" />
            </Field>
            <Field label="Instagram" htmlFor="m-ig">
              <IconInput icon={<AtSign className="size-4" />} id="m-ig" value={f.instagram.replace(/^@/, "")} onChange={(e) => setF((x) => ({ ...x, instagram: e.target.value }))} placeholder="seumercado" />
            </Field>
            <Field label="Telefone fixo" htmlFor="m-tel">
              <IconInput icon={<Phone className="size-4" />} id="m-tel" value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="opcional" />
            </Field>
            <Field label="Horário" htmlFor="m-hora">
              <IconInput icon={<Clock className="size-4" />} id="m-hora" value={f.openingHours} onChange={set("openingHours")} placeholder="Seg a sáb 7h às 21h, dom 7h às 13h" />
            </Field>
            <Field label="Endereço" htmlFor="m-end">
              <IconInput icon={<MapPin className="size-4" />} id="m-end" value={f.address} onChange={set("address")} placeholder="Rua das Flores, 120" />
            </Field>
            <Field label="Cidade" htmlFor="m-cid">
              <Input id="m-cid" value={f.city} onChange={set("city")} placeholder="Sorocaba" />
            </Field>
          </div>
        </Glass>

        <Glass className="scroll-mt-24 space-y-4 p-5 sm:p-6" id="promocoes">
          <div>
            <h2 className="text-xl font-bold">Promoções fixas da semana</h2>
            <p className="text-sm text-[var(--ink-2)]">O Promia lembra na véspera e sugere o tema certo para o encarte.</p>
          </div>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {promos
                .slice()
                .sort((a, b) => a.weekday - b.weekday)
                .map((p) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--glass-strong)] px-4 py-2.5 ring-1 ring-[var(--line)]"
                  >
                    <span className="w-16 text-sm text-[var(--ink-3)]">{DIAS[p.weekday]}</span>
                    <span className="flex-1 font-medium">{p.name}</span>
                    <button onClick={() => removePromo(p.id)} className="grid size-11 place-items-center rounded-full text-[var(--ink-3)] hover:bg-[var(--line)] hover:text-[var(--perigo)]" aria-label={`Remover ${p.name}`}>
                      <X className="size-4" />
                    </button>
                  </motion.li>
                ))}
            </AnimatePresence>
          </ul>
          {promos.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGESTOES.map(([d, n, c]) => (
                <button key={n} onClick={() => addPromo({ weekday: d, name: n, categoryHint: c })} className="vidro flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm hover:bg-[var(--glass-strong)]">
                  <Plus className="size-4" /> {n}
                </button>
              ))}
            </div>
          )}
          <form
            className="grid gap-2 sm:grid-cols-[130px_1fr_auto]"
            onSubmit={(e) => {
              e.preventDefault();
              addPromo();
            }}
          >
            <Select value={novo.weekday} onChange={(e) => setNovo((x) => ({ ...x, weekday: Number(e.target.value) }))} aria-label="Dia da semana">
              {DIAS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </Select>
            <Input value={novo.name} onChange={(e) => setNovo((x) => ({ ...x, name: e.target.value }))} placeholder="Nome, ex. Quarta Verde" maxLength={60} aria-label="Nome da promoção" />
            <Button type="submit" variant="vidro" icon={<Plus className="size-4" />}>
              Adicionar
            </Button>
          </form>
        </Glass>

        <Glass className="space-y-3 p-5 sm:p-6">
          <h2 className="text-xl font-bold">Aviso no rodapé</h2>
          <Textarea value={f.legalNote} onChange={set("legalNote")} maxLength={240} placeholder={DEFAULT_LEGAL_NOTE} rows={3} />
          <p className="text-xs text-[var(--ink-3)]">Em branco, o encarte usa o aviso padrão acima.</p>
        </Glass>
      </div>

      <aside className="order-first mx-auto w-full max-w-sm space-y-4 xl:order-none xl:sticky xl:top-8 xl:max-w-none xl:self-start">
        <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)] ring-1 ring-[var(--line)]">
          <div className="flex items-center gap-3 px-4 py-3 transition-colors duration-500" style={{ background: primary, color: readable(primary) }}>
            {f.logoUrl ? (
              <img src={f.logoUrl} alt="" className="size-11 rounded-lg bg-white/90 object-contain p-1" />
            ) : (
              <span className="grid size-11 place-items-center rounded-lg font-display text-xl font-extrabold" style={{ background: secondary, color: readable(secondary) }}>
                {(f.name || "M").charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-extrabold leading-tight">{f.name || "Seu mercado"}</p>
              {f.tagline && <p className="truncate text-xs opacity-80">{f.tagline}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 bg-[#f4f1e8] p-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-lg bg-white p-2">
                <div className="aspect-square rounded bg-[#eef0ec]" />
                <span className="mt-1.5 inline-block rounded px-1.5 text-xs font-extrabold" style={{ background: "#ffcf3a", color: "#b8240f" }}>
                  R$ 9,99
                </span>
              </div>
            ))}
          </div>
          <div className="px-4 py-2.5 text-[11px] leading-snug transition-colors duration-500" style={{ background: primary, color: readable(primary) }}>
            <p className="font-semibold">{contato || "WhatsApp e Instagram aparecem aqui"}</p>
            <p className="opacity-80">{[f.address, f.city].filter(Boolean).join(", ") || "Endereço da loja"}</p>
          </div>
        </div>
        <p className="px-1 text-center text-xs text-[var(--ink-3)]">Topo e rodapé de todos os encartes</p>
      </aside>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 24, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
            exit={{ y: 12, opacity: 0, transition: { duration: 0.18 } }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+92px)] z-30 px-4 lg:bottom-6 lg:left-[272px]"
          >
            <div className="vidro-forte mx-auto flex max-w-md items-center gap-3 rounded-2xl p-2 pl-4">
              <span className="flex-1 text-sm text-[var(--ink-2)]">Alterações não salvas</span>
              <Button variant="fantasma" size="sm" onClick={() => setF(saved)}>
                Desfazer
              </Button>
              <Button onClick={save} loading={saving}>
                Salvar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconInput({ icon, ...rest }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-3)]">{icon}</span>
      <Input {...rest} className="pl-10" />
    </div>
  );
}

function ColorField({ label, hint, value, onChange, palette }: { label: string; hint: string; value: string; onChange: (v: string) => void; palette: string[] }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <label className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-[14px] ring-1 ring-[var(--line-strong)]" style={{ background: valid ? value : "repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0/12px 12px" }}>
          <input type="color" value={valid ? value : "#12201a"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
        </label>
        <Input value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="#1a7f3c" maxLength={7} className="font-mono uppercase" />
      </div>
      {palette.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className={cn("size-7 rounded-full ring-2 ring-offset-2 ring-offset-[var(--bg)] transition hover:scale-110", value.toLowerCase() === c ? "ring-[var(--ink)]" : "ring-transparent")}
              style={{ background: c }}
              aria-label={`Usar ${c}`}
            />
          ))}
        </div>
      )}
    </Field>
  );
}
