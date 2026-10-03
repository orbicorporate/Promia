import Link from "next/link";
import { ArrowUpRight, Camera, Palette, Phone, FileSpreadsheet, Sparkles, CheckCircle2, Circle } from "lucide-react";
import { requireMarketPage } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayInSaoPaulo, formatBR } from "@/lib/dates";
import { upcomingOccasions, themeAccent } from "@/lib/occasions";
import { Glass, ButtonLink } from "@/components/ui";
import { GerenteCard, type Rec } from "./_ui/gerente-card";
import { EncarteThumb } from "./_ui/encarte-thumb";

export const metadata = { title: "Início" };

function saudacao() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

const WEEKDAY = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export default async function InicioPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const { market } = await requireMarketPage(slug);
  const admin = createAdminClient();
  const today = todayInSaoPaulo();

  const count = (status?: string) => {
    let q = admin.from("products").select("id", { count: "exact", head: true }).eq("market_id", market.id).eq("active", true);
    if (status) q = q.eq("image_status", status);
    return q;
  };

  const [total, revisar, pendente, semPreco, { data: weekly }, { data: encartes, count: encarteCount }, { data: lastRec }] = await Promise.all([
    count(),
    count("revisar"),
    count("pendente"),
    admin.from("products").select("id", { count: "exact", head: true }).eq("market_id", market.id).eq("active", true).is("price", null),
    admin.from("weekly_promotions").select("weekday, name, category_hint, active").eq("market_id", market.id),
    admin
      .from("tabloids")
      .select("id, name, format, theme_key, valid_from, valid_until, updated_at", { count: "exact" })
      .eq("market_id", market.id)
      .order("updated_at", { ascending: false })
      .limit(3),
    admin.from("ai_recommendations").select("run_id, generated_at").eq("market_id", market.id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  let recs: Rec[] = [];
  if (lastRec) {
    let q = admin.from("ai_recommendations").select("id, type, target, reason, priority").eq("market_id", market.id);
    q = lastRec.run_id ? q.eq("run_id", lastRec.run_id) : q.eq("generated_at", lastRec.generated_at);
    const { data } = await q.limit(8);
    // liga cada recomendação aos produtos do catálogo que ela cita
    const { data: products } = await admin.from("products").select("id, name, category").eq("market_id", market.id).eq("active", true).limit(3000);
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    recs = (data ?? []).map((r) => {
      const t = norm(r.target);
      const matches = (products ?? []).filter((p) => {
        const n = norm(p.name);
        return n.includes(t) || t.includes(n) || (p.category && norm(p.category) === t);
      });
      return { ...r, productIds: matches.slice(0, 12).map((p) => p.id) } as Rec;
    });
  }

  const productCount = total.count ?? 0;
  const occasions = upcomingOccasions(today, weekly ?? [], 21).slice(0, 4);
  const next = occasions[0];

  const steps = [
    { done: !!market.logo_url || !!market.color_primary, label: "Logo e cores do mercado", href: `/${slug}/mercado`, icon: Palette },
    { done: !!(market.whatsapp || market.address), label: "Endereço e WhatsApp no rodapé", href: `/${slug}/mercado#contatos`, icon: Phone },
    { done: productCount > 0, label: "Planilha de produtos", href: `/${slug}/produtos?importar=1`, icon: FileSpreadsheet },
    { done: productCount > 0 && (pendente.count ?? 0) === 0, label: "Fotos dos produtos", href: `/${slug}/produtos?fotos=1`, icon: Camera },
    { done: (encarteCount ?? 0) > 0, label: "Primeiro encarte", href: `/${slug}/encartes/novo`, icon: Sparkles },
  ];
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-8 pt-2">
      <header className="space-y-1">
        <p className="text-[var(--ink-2)]">
          {saudacao()}. Hoje é {WEEKDAY[new Date(`${today}T12:00:00Z`).getUTCDay()]}, {formatBR(today)}.
        </p>
        <h1 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.02]">
          {next ? (
            <>
              {next.date === today ? "Hoje" : `Dia ${formatBR(next.date)}`} tem {next.title}.
            </>
          ) : (
            <>O que vai pro encarte esta semana?</>
          )}
        </h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* ocasiões */}
        <Glass as="section" className="p-5 sm:p-6 space-y-4" aria-labelledby="ocasioes">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ocasioes" className="text-lg font-bold">
              Próximas ocasiões
            </h2>
            <Link href={`/${slug}/mercado#promocoes`} className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">
              Promoções fixas
            </Link>
          </div>
          {occasions.length === 0 ? (
            <p className="text-sm text-[var(--ink-2)]">
              Nenhuma data especial nas próximas 3 semanas. Cadastre as promoções fixas do mercado, como a terça da carne,
              para elas aparecerem aqui.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {occasions.map((o) => {
                const c = themeAccent(o.themeKey);
                const href = `/${slug}/encartes/novo?tema=${o.themeKey}&titulo=${encodeURIComponent(o.headline)}&de=${o.date}&ate=${o.date}`;
                return (
                  <li key={`${o.date}-${o.title}`}>
                    <Link
                      href={href}
                      className="group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[20px] p-4 text-left transition hover:-translate-y-0.5"
                      style={{ background: c.bg, color: c.text }}
                    >
                      <span
                        className="absolute -right-6 -top-6 size-24 rounded-full opacity-25 transition group-hover:scale-110"
                        style={{ background: c.tag }}
                        aria-hidden
                      />
                      <span className="relative text-sm opacity-90">
                        {o.date === today ? "Hoje" : `${WEEKDAY[new Date(`${o.date}T12:00:00Z`).getUTCDay()]}, ${formatBR(o.date)}`}
                        {o.kind === "semana" ? " · promoção fixa" : ""}
                      </span>
                      <span className="relative flex items-end justify-between gap-2">
                        <span className="font-display text-xl font-extrabold leading-tight">{o.title}</span>
                        <ArrowUpRight className="size-5 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Glass>

        {/* gerente */}
        <GerenteCard marketId={market.id} slug={slug} recs={recs} generatedAt={lastRec?.generated_at ?? null} hasProducts={productCount > 0} />
      </div>

      {stepsDone < steps.length && (
        <Glass as="section" className="p-5 sm:p-6" aria-labelledby="comeco">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="comeco" className="text-lg font-bold">
              Deixe o mercado pronto
            </h2>
            <span className="text-sm text-[var(--ink-2)] tabular">
              {stepsDone} de {steps.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
            <div className="h-full rounded-full bg-[var(--folha)] transition-all" style={{ width: `${(stepsDone / steps.length) * 100}%` }} />
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className={`flex h-full items-center gap-3 rounded-2xl p-3 text-sm transition ${s.done ? "text-[var(--ink-3)]" : "bg-[var(--glass-strong)] ring-1 ring-[var(--line)] hover:-translate-y-0.5"}`}
                >
                  {s.done ? <CheckCircle2 className="size-5 shrink-0 text-[var(--folha)]" /> : <Circle className="size-5 shrink-0 text-[var(--ink-3)]" />}
                  <span className={s.done ? "line-through decoration-[var(--line-strong)]" : "font-medium"}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Glass>
      )}

      <section className="space-y-4" aria-labelledby="recentes">
        <div className="flex items-end justify-between gap-3">
          <h2 id="recentes" className="text-xl font-bold">
            Encartes recentes
          </h2>
          {(encarteCount ?? 0) > 0 && (
            <Link href={`/${slug}/encartes`} className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">
              Ver todos ({encarteCount})
            </Link>
          )}
        </div>
        {encartes && encartes.length > 0 ? (
          <ul className="grid gap-4 grid-cols-2 md:grid-cols-3">
            {encartes.map((e) => (
              <li key={e.id}>
                <EncarteThumb slug={slug} encarte={e} />
              </li>
            ))}
          </ul>
        ) : (
          <Glass className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="max-w-sm text-[var(--ink-2)]">
              {productCount > 0
                ? "Escolha os produtos, o tema e o formato. O Promia monta a arte com as cores do mercado."
                : "Importe a planilha de produtos e monte o primeiro encarte em poucos minutos."}
            </p>
            <ButtonLink href={productCount > 0 ? `/${slug}/encartes/novo` : `/${slug}/produtos?importar=1`}>
              {productCount > 0 ? "Montar encarte" : "Importar planilha"}
            </ButtonLink>
          </Glass>
        )}
      </section>

      {(revisar.count ?? 0) + (semPreco.count ?? 0) > 0 && (
        <p className="text-sm text-[var(--ink-2)]">
          {(revisar.count ?? 0) > 0 && (
            <Link href={`/${slug}/produtos?fotos=1`} className="underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--ink)]">
              {revisar.count} foto(s) esperando sua escolha
            </Link>
          )}
          {(revisar.count ?? 0) > 0 && (semPreco.count ?? 0) > 0 && " e "}
          {(semPreco.count ?? 0) > 0 && (
            <Link href={`/${slug}/produtos?filtro=sem-preco`} className="underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--ink)]">
              {semPreco.count} produto(s) sem preço
            </Link>
          )}
          .
        </p>
      )}
    </div>
  );
}
