import { addDaysISO } from "@/lib/dates";
import type { Occasion } from "@/lib/occasions";
import { plural } from "@/lib/plural";

// Ações do dia para a tela Hoje: o que o dono do mercado deveria fazer
// agora, em ordem de urgência, cada uma com um botão que já leva ao lugar
// certo. Função pura: a página busca os dados, aqui só se decide.

export type HojeAction = {
  id: string;
  tone: "urgente" | "oportunidade" | "rotina";
  icon: "calendario" | "campanha" | "postar" | "fotos" | "preco" | "gerente" | "fixa" | "primeiro" | "alta" | "queda" | "concorrencia" | "parado" | "vendas";
  title: string;
  detail: string;
  cta: string;
  href: string;
};

export type HojeInput = {
  slug: string;
  today: string;
  productCount: number;
  photosToReview: number;
  photosPending: number;
  noPrice: number;
  occasions: Occasion[];
  encartes: { id: string; name: string; valid_from: string | null; valid_until: string | null; theme_key: string; hasCampaign: boolean; todaySteps: string[] }[];
  topRec: { target: string; reason: string; productIds: string[] } | null;
  // último relatório de vendas (null quando nunca foi enviado)
  sales?: {
    periodEnd: string;
    rising: { productId: string | null; name: string; change: number }[];
    falling: { productId: string | null; name: string; change: number }[];
    stale: { id: string; name: string }[];
  } | null;
  // produtos que o cliente compara em que o mercado está mais caro
  pricier?: { name: string; ours: number; theirs: number; competitor: string }[];
};

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
const pctAbs = (n: number) => `${Math.round(Math.abs(n) * 100)}%`;
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

const covers = (e: { valid_from: string | null; valid_until: string | null }, day: string) =>
  (!e.valid_from || e.valid_from <= day) && (!e.valid_until || e.valid_until >= day);

export function buildHojeActions(i: HojeInput): HojeAction[] {
  const out: HojeAction[] = [];
  const amanha = addDaysISO(i.today, 1);

  if (i.productCount === 0) {
    out.push({ id: "primeiro", tone: "urgente", icon: "primeiro", title: "Envie a planilha de produtos", detail: "Com o catálogo, o Promia busca as fotos, monta encartes e sugere ofertas.", cta: "Enviar planilha", href: `/${i.slug}/produtos?importar=1` });
    return out;
  }

  // o que postar hoje, das campanhas que estão valendo
  for (const e of i.encartes) {
    for (const step of e.todaySteps.slice(0, 1)) {
      out.push({ id: `postar-${e.id}`, tone: "urgente", icon: "postar", title: step, detail: `Campanha de ${e.name}`, cta: "Abrir campanha", href: `/${i.slug}/encartes/${e.id}#campanha` });
    }
  }

  // ocasiões próximas sem encarte que as cubra
  for (const o of i.occasions) {
    const dias = Math.round((Date.parse(`${o.date}T12:00:00Z`) - Date.parse(`${i.today}T12:00:00Z`)) / 86400000);
    if (dias > 10) continue;
    if (i.encartes.some((e) => covers(e, o.date))) continue;
    const quando = dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
    const de = o.kind === "semana" ? o.date : addDaysISO(o.date, -Math.min(5, Math.max(0, dias)));
    out.push({
      id: `ocasiao-${o.date}-${o.title}`,
      tone: dias <= 2 ? "urgente" : "oportunidade",
      icon: o.kind === "semana" ? "fixa" : "calendario",
      title: `${o.title} ${quando}: monte o encarte`,
      detail: o.kind === "semana" ? "Promoção fixa da semana. O tema já vem escolhido." : "Data do varejo com tema pronto. Comece com uns dias de antecedência.",
      cta: "Montar encarte",
      href: `/${i.slug}/encartes/novo?tema=${o.themeKey}&titulo=${encodeURIComponent(o.headline)}&de=${de}&ate=${o.date}`,
    });
    if (out.length >= 6) break;
  }

  // encartes valendo (ou começando amanhã) sem campanha
  for (const e of i.encartes) {
    if (e.hasCampaign) continue;
    if (!(covers(e, i.today) || covers(e, amanha))) continue;
    out.push({ id: `campanha-${e.id}`, tone: "oportunidade", icon: "campanha", title: `Crie a campanha de ${e.name}`, detail: "Posts, WhatsApp, vídeo, carro de som e cartazes em um clique.", cta: "Criar campanha", href: `/${i.slug}/encartes/${e.id}#campanha` });
  }

  if (i.topRec && i.topRec.productIds.length) {
    out.push({ id: "gerente", tone: "oportunidade", icon: "gerente", title: `Vale promover ${i.topRec.target}`, detail: i.topRec.reason, cta: "Montar encarte", href: `/${i.slug}/encartes/novo?produtos=${i.topRec.productIds.join(",")}` });
  }

  // concorrência: mais caro em produto que o cliente compara
  if (i.pricier && i.pricier.length > 0) {
    const ex = i.pricier[0];
    out.push({
      id: "concorrencia",
      tone: i.pricier.length >= 3 ? "urgente" : "oportunidade",
      icon: "concorrencia",
      title: `Você está mais caro em ${plural(i.pricier.length, "produto", "produtos")} que o cliente compara`,
      detail: `${ex.name}: ${brl(ex.ours)} aqui, ${brl(ex.theirs)} no ${ex.competitor}. O preço sugerido já está pronto.`,
      cta: "Ajustar preços",
      href: `/${i.slug}/concorrencia`,
    });
  }

  // vendas: o que subiu, o que caiu, o que parou
  if (i.sales) {
    const up = i.sales.rising.filter((t) => t.productId).slice(0, 3);
    if (up.length) {
      out.push({
        id: "alta",
        tone: "oportunidade",
        icon: "alta",
        title: `${joinNames(up.map((t) => t.name))} ${up.length === 1 ? "está vendendo" : "estão vendendo"} mais`,
        detail: `${up.map((t) => `+${pctAbs(t.change)}`).join(", ")} no último relatório. Garanta estoque e destaque no próximo encarte.`,
        cta: "Montar encarte",
        href: `/${i.slug}/encartes/novo?produtos=${up.map((t) => t.productId).join(",")}&titulo=${encodeURIComponent("Os mais pedidos")}`,
      });
    }
    const down = i.sales.falling[0];
    if (down) {
      out.push({
        id: "queda",
        tone: "oportunidade",
        icon: "queda",
        title: `${down.name} caiu ${pctAbs(down.change)} nas vendas`,
        detail: "Confira preço, exposição e se algum concorrente baixou o preço.",
        cta: "Ver vendas",
        href: `/${i.slug}/vendas`,
      });
    }
    if (i.sales.stale.length > 0) {
      out.push({
        id: "parado",
        tone: "rotina",
        icon: "parado",
        title: `${plural(i.sales.stale.length, "produto sem venda", "produtos sem venda")} no último relatório`,
        detail: `${joinNames(i.sales.stale.slice(0, 3).map((p) => p.name))}${i.sales.stale.length > 3 ? " e outros" : ""}. Um encarte de giro ajuda a desovar.`,
        cta: "Montar encarte de giro",
        href: `/${i.slug}/encartes/novo?produtos=${i.sales.stale.slice(0, 30).map((p) => p.id).join(",")}&titulo=${encodeURIComponent("Aproveite")}`,
      });
    }
    const dias = Math.round((Date.parse(`${i.today}T12:00:00Z`) - Date.parse(`${i.sales.periodEnd}T12:00:00Z`)) / 86400000);
    if (dias > 9) {
      out.push({ id: "vendas", tone: "rotina", icon: "vendas", title: "Envie o relatório de vendas da semana", detail: `O último vai até ${i.sales.periodEnd.slice(8, 10)}/${i.sales.periodEnd.slice(5, 7)}. Com ele em dia, o Promia mostra o que sobe e o que cai.`, cta: "Enviar relatório", href: `/${i.slug}/vendas` });
    }
  } else if (i.sales === null) {
    out.push({ id: "vendas", tone: "rotina", icon: "vendas", title: "Envie o relatório de vendas do caixa", detail: "Com ele o Promia mostra o que mais vende, o que está caindo e quanto cada encarte vendeu a mais.", cta: "Enviar relatório", href: `/${i.slug}/vendas` });
  }

  if (i.photosToReview > 0) {
    out.push({ id: "fotos", tone: "rotina", icon: "fotos", title: `${plural(i.photosToReview, "foto esperando", "fotos esperando")} sua escolha`, detail: "Um toque em cada uma e o encarte sai com a foto certa.", cta: "Revisar fotos", href: `/${i.slug}/produtos?fotos=1` });
  } else if (i.photosPending > 0) {
    out.push({ id: "fotos-fila", tone: "rotina", icon: "fotos", title: `${plural(i.photosPending, "produto", "produtos")} ainda sem foto`, detail: "A busca encontra a maioria sozinha em menos de um minuto.", cta: "Buscar fotos", href: `/${i.slug}/produtos` });
  }
  if (i.noPrice > 0) {
    out.push({ id: "preco", tone: "rotina", icon: "preco", title: `${plural(i.noPrice, "produto", "produtos")} sem preço`, detail: "Produto sem preço não entra no encarte.", cta: "Ver produtos", href: `/${i.slug}/produtos?filtro=sem-preco` });
  }

  const rank = { urgente: 0, oportunidade: 1, rotina: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 7);
}
