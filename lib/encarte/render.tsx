import type { CSSProperties, ReactElement, ReactNode } from "react";
import { contrastRatio, mix } from "./color";
import { FORMATS } from "./formats";
import { getPage, type EncartePage } from "./paginate";
import { patternDataUri } from "./patterns";
import { discountLabel, effectiveOldPrice, formatBRL, limitLabel, priceParts, unitSuffix } from "./price";
import { DEFAULT_LEGAL_NOTE, clip, measureText, validityLabel, wrapMeasured } from "./text";
import { getTheme, resolveThemeColors, type EncarteTheme, type ResolvedColors } from "./themes";
import type { EncarteData, EncarteFormat, EncarteItem } from "./types";

// Desenho de UMA página do encarte em JSX para o Satori (next/og).
//
// Regras do Satori que moldam este arquivo: só flexbox (sem grid), toda
// div com mais de um filho precisa de display:flex, estilos inline, texto
// não quebra de forma previsível. Por isso as medidas são calculadas aqui
// em pixels (cada cartão sabe a própria largura e altura) e os textos
// longos são quebrados em linhas medindo a largura com as métricas reais
// das fontes (lib/encarte/text.ts + fontMetrics.ts), com cada linha
// desenhada sem quebra automática (e com corte de segurança).
//
// Hierarquia visual (de propósito, como num encarte de rede): 1) preço,
// 2) foto, 3) nome, 4) título do encarte, 5) marca do mercado, 6) rodapé.

export const FONT_DISPLAY = "Bricolage Grotesque";
export const FONT_TEXT = "Instrument Sans";

type Ctx = {
  c: ResolvedColors;
  theme: EncarteTheme;
  s: number; // escala em relação a 1080 px de largura
  highlightBorder: string; // contorno do produto em destaque
};

const flexCol: CSSProperties = { display: "flex", flexDirection: "column" };
const flexRow: CSSProperties = { display: "flex", flexDirection: "row" };

const round = (n: number) => Math.round(n);
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

// ---------------------------------------------------------------------
// Métricas do formato
// ---------------------------------------------------------------------

type Metrics = {
  W: number;
  H: number;
  s: number;
  pad: number;
  gap: number;
  safeTop: number;
  safeBottom: number;
  brandH: number;
  heroH: number;
  ribbonH: number;
  footerH: number;
  featuredShare: number; // fração da área de produtos para o destaque
};

function metrics(format: EncarteFormat): Metrics {
  const spec = FORMATS[format];
  const s = spec.width / 1080;
  const base = { W: spec.width, H: spec.height, s, safeTop: spec.safeTop, safeBottom: spec.safeBottom };
  switch (format) {
    case "story":
      return { ...base, pad: 34, gap: 16, brandH: 128, heroH: 236, ribbonH: 60, footerH: 132, featuredShare: 0.44 };
    case "quadrado":
      return { ...base, pad: 30, gap: 14, brandH: 96, heroH: 148, ribbonH: 50, footerH: 96, featuredShare: 0.56 };
    case "a4":
      return { ...base, pad: 40, gap: 18, brandH: 150, heroH: 214, ribbonH: 62, footerH: 142, featuredShare: 0.42 };
    case "feed":
    default:
      return { ...base, pad: 32, gap: 16, brandH: 112, heroH: 184, ribbonH: 54, footerH: 112, featuredShare: 0.52 };
  }
}

// ---------------------------------------------------------------------
// Peças pequenas
// ---------------------------------------------------------------------

function TextLines({ lines, style }: { lines: string[]; style: CSSProperties }) {
  return (
    <div style={{ ...flexCol }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex", whiteSpace: "nowrap",  ...style }}>
          {line}
        </div>
      ))}
    </div>
  );
}

// Etiqueta de preço: "R$" pequeno, inteiro enorme, centavos no alto e a
// unidade embaixo dos centavos. Calcula o maior tamanho de fonte que cabe
// na caixa (largura e altura) dada, medindo os glifos de verdade.
const PRICE = { currency: 0.3, cents: 0.46, unit: 0.2, tracking: -0.03 };

function priceWidthAt1(integer: string, cents: string, suffix: string): number {
  const rs = measureText("R$", "display800", PRICE.currency);
  const int = measureText(integer, "display800", 1, PRICE.tracking);
  const cs = measureText(cents, "display800", PRICE.cents);
  const us = suffix ? measureText(suffix, "text600", PRICE.unit) : 0;
  return rs + 0.05 + int + 0.03 + Math.max(cs, us);
}

function PriceTag({ ctx, price, unit, width, height, radius }: { ctx: Ctx; price: number; unit?: string | null; width: number; height: number; radius?: number }) {
  const { c } = ctx;
  const parts = priceParts(price);
  const suffix = unitSuffix(unit);
  const padX = round(clamp(height * 0.16, 10, 34));
  const padY = round(clamp(height * 0.1, 4, 20));
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const fs = Math.floor(Math.min(innerH / 0.82, innerW / priceWidthAt1(parts.integer, parts.cents, suffix)));
  const rs = round(fs * PRICE.currency);
  const cs = round(fs * PRICE.cents);
  const us = round(fs * PRICE.unit);
  const shadow = round(clamp(height * 0.05, 3, 10));

  return (
    <div
      style={{
        ...flexRow,
        width,
        height,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.tagBg,
        borderRadius: radius ?? round(clamp(height * 0.14, 8, 26)),
        color: c.tagText,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        borderBottom: `${shadow}px solid ${mix(c.tagBg, "#000000", 0.28)}`,
      }}
    >
      <div style={{ ...flexRow, alignItems: "flex-start", marginTop: round(fs * 0.04) }}>
        <div style={{ display: "flex", fontSize: rs, lineHeight: 1, marginTop: round(fs * 0.1), marginRight: round(fs * 0.05) }}>{parts.currency}</div>
        <div style={{ display: "flex", fontSize: fs, lineHeight: 0.8, letterSpacing: fs * PRICE.tracking }}>{parts.integer}</div>
        <div style={{ ...flexCol, alignItems: "flex-start", marginLeft: round(fs * 0.03) }}>
          <div style={{ display: "flex", fontSize: cs, lineHeight: 0.85 }}>{parts.cents}</div>
          {suffix ? (
            <div style={{ display: "flex", fontSize: us, lineHeight: 1, marginTop: round(fs * 0.05), fontFamily: FONT_TEXT, fontWeight: 600 }}>{suffix}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OldPrice({ ctx, price, oldPrice, size }: { ctx: Ctx; price: number; oldPrice?: number | null; size: number }) {
  const old = effectiveOldPrice(price, oldPrice);
  if (old == null) return <div style={{ display: "flex", height: round(size * 1.25) }} />;
  return (
    <div style={{ ...flexRow, alignItems: "center", height: round(size * 1.25), fontSize: size, color: ctx.c.oldPrice, fontFamily: FONT_TEXT, fontWeight: 600 }}>
      <div style={{ display: "flex", marginRight: round(size * 0.3) }}>de</div>
      <div style={{ display: "flex", textDecoration: "line-through" }}>{formatBRL(old)}</div>
      <div style={{ display: "flex", marginLeft: round(size * 0.3) }}>por</div>
    </div>
  );
}

function DiscountSeal({ ctx, price, oldPrice, size, style }: { ctx: Ctx; price: number; oldPrice?: number | null; size: number; style?: CSSProperties }) {
  const label = discountLabel(price, oldPrice);
  if (!label) return null;
  return (
    <div
      style={{
        ...flexCol,
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ctx.c.accent,
        color: ctx.c.accentText,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        transform: "rotate(-8deg)",
        ...style,
      }}
    >
      <div style={{ display: "flex", fontSize: round(size * 0.34), lineHeight: 1, letterSpacing: -size * 0.01 }}>{label}</div>
      <div style={{ display: "flex", fontSize: round(size * 0.15), lineHeight: 1, marginTop: round(size * 0.02) }}>OFF</div>
    </div>
  );
}

function LabelPill({ ctx, text, size, style }: { ctx: Ctx; text: string; size: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignSelf: "flex-start",
        padding: `${round(size * 0.28)}px ${round(size * 0.6)}px`,
        borderRadius: round(size * 0.35),
        backgroundColor: ctx.c.headerBg,
        color: ctx.c.headerText,
        fontFamily: FONT_DISPLAY,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {text}
    </div>
  );
}

// marca em maiúsculas numa linha só, cortada pela largura
function brandLine(brand: string | null | undefined, width: number, size: number): string {
  const text = clip(brand, 60).toUpperCase();
  return text ? (wrapMeasured(text, width, "text600", size, 1, size * 0.04)[0] ?? "") : "";
}

// inicial sem acento ("Óleo" -> "O")
function plainInitial(text: string): string {
  const ch = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "")[0];
  return (ch ?? "?").toUpperCase();
}

// monograma do mercado: até duas iniciais, pulando palavras genéricas
// ("Supermercado Bom Preço" -> "BP")
const GENERIC_WORDS = new Set(["supermercado", "supermercados", "mercado", "mercadinho", "supermercadinho", "sacolao", "mercados", "hipermercado", "minimercado", "mercearia", "atacadao", "atacado", "atacarejo", "emporio", "comercial", "rede", "loja", "lojas", "de", "da", "do", "das", "dos", "e"]);
export function marketInitials(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const meaningful = words.filter((w) => !GENERIC_WORDS.has(w.toLowerCase()));
  const pick = (meaningful.length ? meaningful : words).slice(0, 2);
  return pick.map((w) => w[0].toUpperCase()).join("") || "M";
}

function ProductImage({ ctx, src, name, width, height }: { ctx: Ctx; src?: string | null; name: string; width: number; height: number }) {
  const w = Math.max(1, round(width));
  const h = Math.max(1, round(height));
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} width={w} height={h} alt="" style={{ width: w, height: h, objectFit: "contain" }} />;
  }
  // placeholder: inicial do produto num disco, sobre um degradê suave
  const d = round(Math.min(w, h) * 0.56);
  const initial = plainInitial(name);
  return (
    <div
      style={{
        ...flexCol,
        width: w,
        height: h,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: round(Math.min(w, h) * 0.08),
        backgroundImage: `linear-gradient(145deg, ${ctx.c.bg2}, ${mix(ctx.c.bg2, "#FFFFFF", 0.55)})`,
      }}
    >
      <div
        style={{
          display: "flex",
          width: d,
          height: d,
          borderRadius: d,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          color: mix(ctx.c.headerBg, ctx.c.cardText, 0.2),
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: round(d * 0.5),
          lineHeight: 1,
        }}
      >
        {initial}
      </div>
    </div>
  );
}

// contorno do produto em destaque desenhado por cima (posição absoluta),
// para não roubar espaço do conteúdo: no Satori a borda entra na largura
function HighlightRing({ ctx, radius }: { ctx: Ctx; radius: number }) {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: radius,
        border: `${round(clamp(5 * ctx.s, 4, 7))}px solid ${ctx.highlightBorder}`,
      }}
    />
  );
}

function cardShell(ctx: Ctx, item: EncarteItem, w: number, h: number, children: ReactNode, radius: number) {
  return (
    <div
      style={{
        ...flexCol,
        position: "relative",
        width: w,
        height: h,
        backgroundColor: ctx.c.card,
        borderRadius: radius,
        
      }}
    >
      {children}
      {item.highlight ? <HighlightRing ctx={ctx} radius={radius} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Cartões
// ---------------------------------------------------------------------

// vertical: foto em cima, nome, "de/por" e etiqueta embaixo (grade). A
// etiqueta fica sempre na base (alinhada entre cartões da mesma linha) e a
// foto ocupa o que sobrar em cima; marca e "de" só ocupam espaço quando
// existem.
function VerticalCard({ ctx, item, w, h }: { ctx: Ctx; item: EncarteItem; w: number; h: number }) {
  const pad = round(clamp(Math.min(w, h) * 0.055, 12, 28));
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const hasBrand = !!clip(item.brand, 60);
  const limit = limitLabel(item.limitQty);
  const hasOld = effectiveOldPrice(item.price, item.oldPrice) != null;
  // tamanhos partem da largura e encolhem até a foto ficar com pelo menos
  // ~30% da altura útil
  let nf = round(clamp(w * 0.07, 17, 36));
  let tagH = round(clamp(h * 0.28, 70, 230));
  let nameLines: string[] = [];
  let imgH = 0;
  let rows = { brand: 0, name: 0, old: 0, limit: 0 };
  for (let attempt = 0; attempt < 8; attempt++) {
    nameLines = wrapMeasured(item.name, innerW, "text600", nf, 2);
    rows = {
      brand: hasBrand ? round(nf * 0.66 * 1.3) : 0,
      name: round(nf * 1.12 * nameLines.length),
      old: hasOld ? round(nf * 0.78 * 1.25) + 4 : 0,
      limit: round(nf * 0.64 * 1.6),
    };
    imgH = innerH - rows.brand - rows.name - rows.old - rows.limit - tagH - 8 - 6;
    if (imgH >= innerH * 0.3) break;
    nf = Math.max(15, round(nf * 0.92));
    tagH = Math.max(60, round(tagH * 0.9));
  }
  imgH = Math.max(36, imgH);
  const brandF = round(nf * 0.66);
  const brand = brandLine(item.brand, innerW, brandF);
  const oldF = round(nf * 0.78);
  const limitF = round(nf * 0.64);
  const seal = round(clamp(w * 0.22, 60, 150));

  return cardShell(
    ctx,
    item,
    w,
    h,
    <div style={{ ...flexCol, width: w, height: h, padding: pad, position: "relative" }}>
      <div style={{ ...flexRow, width: innerW, height: imgH, justifyContent: "center", alignItems: "center" }}>
        <ProductImage ctx={ctx} src={item.imageUrl} name={item.name} width={innerW} height={imgH} />
      </div>
      <div style={{ ...flexCol, marginTop: 8 }}>
        {brand ? (
          <div style={{ display: "flex", height: rows.brand, alignItems: "flex-end", fontSize: brandF, color: ctx.c.cardMuted, fontWeight: 600, letterSpacing: brandF * 0.04, whiteSpace: "nowrap" }}>{brand}</div>
        ) : null}
        <TextLines lines={nameLines} style={{ fontSize: nf, lineHeight: 1.12, fontWeight: 600, color: ctx.c.cardText, width: innerW }} />
      </div>
      <div style={{ ...flexCol, flexGrow: 1, justifyContent: "flex-end" }}>
        {hasOld ? (
          <div style={{ display: "flex", marginBottom: 4 }}>
            <OldPrice ctx={ctx} price={item.price} oldPrice={item.oldPrice} size={oldF} />
          </div>
        ) : null}
        <PriceTag ctx={ctx} price={item.price} unit={item.unit} width={innerW} height={tagH} />
        <div style={{ display: "flex", height: rows.limit, alignItems: "flex-end", justifyContent: "center", fontSize: limitF, color: ctx.c.cardMuted, fontWeight: 600 }}>
          {limit ?? " "}
        </div>
      </div>
      {item.label ? <LabelPill ctx={ctx} text={clip(item.label, 24)} size={round(clamp(w * 0.045, 14, 28))} style={{ position: "absolute", top: pad, left: pad }} /> : null}
      <DiscountSeal ctx={ctx} price={item.price} oldPrice={item.oldPrice} size={seal} style={{ top: round(pad * 0.5), right: round(pad * 0.5) }} />
    </div>,
    round(clamp(w * 0.05, 12, 26))
  );
}

// horizontal: foto à esquerda, informações e etiqueta à direita (cartões
// largos e baixos, como no story, no A4 e no destaque)
function HorizontalCard({ ctx, item, w, h, big = false }: { ctx: Ctx; item: EncarteItem; w: number; h: number; big?: boolean }) {
  const pad = round(clamp(Math.min(w, h) * (big ? 0.065 : 0.07), 12, 40));
  const imgW = round(Math.min(h - pad * 2, w * (big ? 0.42 : 0.36)));
  const colW = w - pad * 3 - imgW;
  const nf = round(clamp(Math.min(colW * (big ? 0.085 : 0.1), h * (big ? 0.08 : 0.11)), 17, big ? 58 : 38));
  const brandF = round(nf * 0.64);
  const oldF = round(nf * 0.76);
  const limitF = round(nf * 0.62);
  const maxLines = big ? 3 : 2;
  const nameLines = wrapMeasured(item.name, colW, "text600", nf, maxLines);
  const brand = brandLine(item.brand, colW, brandF);
  const limit = limitLabel(item.limitQty);
  const label = item.label ? clip(item.label, 28) : big ? "Super oferta" : null;
  const labelF = round(clamp(nf * (big ? 0.6 : 0.62), 13, 32));
  const labelRow = label ? round(labelF * 1.56) + 10 : 0;
  const brandRow = brand ? round(brandF * 1.3) : 0;
  const nameH = round(nf * 1.1 * nameLines.length);
  const hasOld = effectiveOldPrice(item.price, item.oldPrice) != null;
  const oldRow = hasOld ? round(oldF * 1.25) + 4 : 0;
  const limitRow = limit ? round(limitF * 1.6) : 0;
  const tagH = round(clamp(h - pad * 2 - labelRow - brandRow - nameH - oldRow - limitRow - 14, 56, h * (big ? 0.44 : 0.42)));
  const tagW = big ? round(Math.min(colW, tagH * 3.3)) : colW;
  const seal = round(clamp(Math.min(imgW * 0.34, h * 0.32), 72, big ? 180 : 124));

  return cardShell(
    ctx,
    item,
    w,
    h,
    <div style={{ ...flexRow, width: w, height: h, padding: pad, alignItems: "center", position: "relative" }}>
      <div style={{ ...flexRow, width: imgW, height: h - pad * 2, justifyContent: "center", alignItems: "center" }}>
        <ProductImage ctx={ctx} src={item.imageUrl} name={item.name} width={imgW} height={Math.min(h - pad * 2, imgW * 1.15)} />
      </div>
      <div style={{ ...flexCol, width: colW, marginLeft: pad, justifyContent: "center" }}>
        {label ? <LabelPill ctx={ctx} text={label} size={labelF} style={{ marginBottom: 10 }} /> : null}
        {brand ? (
          <div style={{ display: "flex", height: brandRow, alignItems: "flex-end", fontSize: brandF, color: ctx.c.cardMuted, fontWeight: 600, letterSpacing: brandF * 0.04 }}>{brand}</div>
        ) : null}
        <TextLines lines={nameLines} style={{ fontSize: nf, lineHeight: 1.1, fontWeight: 600, color: ctx.c.cardText, width: colW }} />
        {hasOld ? (
          <div style={{ display: "flex", marginTop: 4 }}>
            <OldPrice ctx={ctx} price={item.price} oldPrice={item.oldPrice} size={oldF} />
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: hasOld ? 4 : round(nf * 0.4) }}>
          <PriceTag ctx={ctx} price={item.price} unit={item.unit} width={tagW} height={tagH} />
        </div>
        {limit ? <div style={{ display: "flex", height: limitRow, alignItems: "flex-end", fontSize: limitF, color: ctx.c.cardMuted, fontWeight: 600 }}>{limit}</div> : null}
      </div>
      <DiscountSeal ctx={ctx} price={item.price} oldPrice={item.oldPrice} size={seal} style={{ top: round(pad * 0.5), left: round(pad * 0.5) }} />
    </div>,
    round(clamp(Math.min(w, h) * 0.06, 12, 28))
  );
}

// linha de lista (cartaz de preço): foto, nome e "de/por" no meio, preço
// grande à direita
function RowCard({ ctx, item, w, h }: { ctx: Ctx; item: EncarteItem; w: number; h: number }) {
  const pad = round(clamp(h * 0.1, 10, 22));
  const imgS = h - pad * 2;
  const tagW = round(w * 0.3);
  const tagH = h - pad * 2;
  const midW = w - pad * 6 - imgS - tagW;
  const midH = h - pad * 2;
  const hasBrand = !!clip(item.brand, 60);
  const limit = limitLabel(item.limitQty);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const discount = discountLabel(item.price, item.oldPrice);
  const chips = !!(old != null || item.label || limit);
  // maior fonte em que marca + nome (até 2 linhas) + selos cabem na altura
  let nf = round(clamp(h * 0.25, 17, 44));
  let brandF = 0;
  let smallF = 0;
  let nameLines: string[] = [];
  for (; nf >= 14; nf--) {
    brandF = round(nf * 0.62);
    smallF = round(clamp(nf * 0.66, 12, 30));
    const fixed = (hasBrand ? brandF * 1.25 : 0) + (chips ? smallF * 1.4 + nf * 0.22 : 0);
    const maxLines = Math.min(2, Math.floor((midH - fixed) / (nf * 1.1)));
    if (maxLines < 1) continue;
    nameLines = wrapMeasured(item.name, midW, "text600", nf, maxLines);
    const truncated = nameLines.length > 0 && nameLines[nameLines.length - 1].endsWith("…");
    if (!truncated || maxLines === 2 || nf <= 18) break;
  }
  const brand = brandLine(item.brand, midW, brandF);

  return (
    <div
      style={{
        ...flexRow,
        width: w,
        height: h,
        padding: pad,
        alignItems: "center",
        backgroundColor: ctx.c.card,
        borderRadius: round(clamp(h * 0.12, 10, 22)),
        position: "relative",
      }}
    >
      <div style={{ ...flexRow, width: imgS, height: imgS, backgroundColor: "#FFFFFF", borderRadius: round(imgS * 0.12), alignItems: "center", justifyContent: "center" }}>
        <ProductImage ctx={ctx} src={item.imageUrl} name={item.name} width={imgS} height={imgS} />
      </div>
      <div style={{ ...flexCol, width: midW, marginLeft: pad * 2, justifyContent: "center" }}>
        {brand ? <div style={{ display: "flex", fontSize: brandF, color: ctx.c.cardMuted, fontWeight: 600, letterSpacing: brandF * 0.04, lineHeight: 1.25 }}>{brand}</div> : null}
        <TextLines lines={nameLines} style={{ fontSize: nf, lineHeight: 1.1, fontWeight: 600, color: ctx.c.cardText, width: midW }} />
        {chips ? (
          <div style={{ ...flexRow, alignItems: "center", marginTop: round(nf * 0.22) }}>
            {discount ? (
              <div style={{ display: "flex", padding: `${round(smallF * 0.18)}px ${round(smallF * 0.45)}px`, borderRadius: round(smallF * 0.35), backgroundColor: ctx.c.accent, color: ctx.c.accentText, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: smallF, lineHeight: 1.1, marginRight: round(smallF * 0.5) }}>
                {discount}
              </div>
            ) : null}
            {old != null ? (
              <div style={{ ...flexRow, fontSize: smallF, color: ctx.c.oldPrice, fontWeight: 600, marginRight: round(smallF * 0.8) }}>
                <div style={{ display: "flex", marginRight: round(smallF * 0.3) }}>de</div>
                <div style={{ display: "flex", textDecoration: "line-through" }}>{formatBRL(old)}</div>
              </div>
            ) : null}
            {item.label ? <LabelPill ctx={ctx} text={clip(item.label, 26)} size={round(smallF * 0.9)} style={{ marginRight: round(smallF * 0.6), alignSelf: "center" }} /> : null}
            {limit && old == null ? <div style={{ display: "flex", fontSize: smallF, color: ctx.c.cardMuted, fontWeight: 600 }}>{limit}</div> : null}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", marginLeft: pad * 2 }}>
        <PriceTag ctx={ctx} price={item.price} unit={item.unit} width={tagW} height={tagH} />
      </div>
      {item.highlight ? <HighlightRing ctx={ctx} radius={round(clamp(h * 0.12, 10, 22))} /> : null}
    </div>
  );
}

function ProductCard({ ctx, item, w, h }: { ctx: Ctx; item: EncarteItem; w: number; h: number }) {
  return w / h >= 1.15 ? <HorizontalCard ctx={ctx} item={item} w={w} h={h} /> : <VerticalCard ctx={ctx} item={item} w={w} h={h} />;
}

// ---------------------------------------------------------------------
// Área de produtos
// ---------------------------------------------------------------------

function Grid({ ctx, items, cols, maxRows, w, h, gap }: { ctx: Ctx; items: EncarteItem[]; cols: number; maxRows: number; w: number; h: number; gap: number }) {
  const rows = Math.max(1, Math.ceil(items.length / cols));
  const fullCh = (h - gap * (maxRows - 1)) / maxRows;
  // página incompleta: as linhas crescem um pouco para não sobrar buraco,
  // mas sem virar cartaz desproporcional
  const ch = Math.floor(Math.min((h - gap * (rows - 1)) / rows, fullCh * 1.45));
  const cw = Math.floor((w - gap * (cols - 1)) / cols);
  const rowEls: ReactElement[] = [];
  for (let r = 0; r < rows; r++) {
    const slice = items.slice(r * cols, r * cols + cols);
    rowEls.push(
      <div key={r} style={{ ...flexRow, width: w, justifyContent: "center", marginTop: r === 0 ? 0 : gap }}>
        {slice.map((item, i) => (
          <div key={i} style={{ display: "flex", marginLeft: i === 0 ? 0 : gap }}>
            <ProductCard ctx={ctx} item={item} w={cw} h={ch} />
          </div>
        ))}
      </div>
    );
  }
  return <div style={{ ...flexCol, width: w, height: h, justifyContent: "center" }}>{rowEls}</div>;
}

function List({ ctx, items, perPage, w, h, gap }: { ctx: Ctx; items: EncarteItem[]; perPage: number; w: number; h: number; gap: number }) {
  const n = Math.max(1, items.length);
  const fullRh = (h - gap * (perPage - 1)) / perPage;
  const rh = Math.floor(Math.min((h - gap * (n - 1)) / n, fullRh * 1.35));
  return (
    <div style={{ ...flexCol, width: w, height: h, justifyContent: "center" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", marginTop: i === 0 ? 0 : gap }}>
          <RowCard ctx={ctx} item={item} w={w} h={rh} />
        </div>
      ))}
    </div>
  );
}

function Featured({ ctx, page, cols, perPage, w, h, gap, share }: { ctx: Ctx; page: EncartePage; cols: number; perPage: number; w: number; h: number; gap: number; share: number }) {
  const featured = page.featured;
  if (!featured) return null;
  const smallCap = Math.max(0, perPage - 1);
  const smallRows = Math.max(1, Math.ceil(smallCap / cols));
  const hasSmall = page.items.length > 0;
  const fh = hasSmall ? Math.floor(h * share) : Math.floor(Math.min(h, h * share * 1.5));
  const gridH = h - fh - gap;
  return (
    <div style={{ ...flexCol, width: w, height: h, justifyContent: hasSmall ? "flex-start" : "center" }}>
      <HorizontalCard ctx={ctx} item={featured} w={w} h={fh} big />
      {hasSmall ? (
        <div style={{ display: "flex", marginTop: gap }}>
          <Grid ctx={ctx} items={page.items} cols={cols} maxRows={smallRows} w={w} h={gridH} gap={gap} />
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Cabeçalho e rodapé
// ---------------------------------------------------------------------

function Logo({ ctx, market, size }: { ctx: Ctx; market: EncarteData["market"]; size: number }) {
  if (market.logoUrl) {
    return (
      <div style={{ ...flexRow, height: size, minWidth: size, maxWidth: size * 2.6, padding: round(size * 0.08), backgroundColor: "#FFFFFF", borderRadius: round(size * 0.18), alignItems: "center", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={market.logoUrl} alt="" height={round(size * 0.84)} width={round(size * 2.4)} style={{ height: round(size * 0.84), width: round(size * 2.4), objectFit: "contain" }} />
      </div>
    );
  }
  // monograma com as iniciais do mercado
  const initial = marketInitials(market.name);
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: ctx.c.brandText,
        color: ctx.c.brandBg,
        fontFamily: FONT_DISPLAY,
        fontWeight: 800,
        fontSize: round(size * (initial.length > 1 ? 0.4 : 0.52)),
        lineHeight: 1,
        letterSpacing: -size * 0.01,
        border: `${round(size * 0.05)}px solid ${ctx.c.brandAccent}`,
      }}
    >
      {initial}
    </div>
  );
}

function BrandBar({ ctx, market, m }: { ctx: Ctx; market: EncarteData["market"]; m: Metrics }) {
  const logo = round(m.brandH * 0.68);
  const logoW = market.logoUrl ? round(logo * 2.6) : logo;
  const gap = round(m.brandH * 0.16);
  const tagF = round(clamp(m.brandH * 0.16, 15, 26));
  const availW = m.W - m.pad * 2 - logoW - gap;
  // nome numa linha só: diminui a fonte até caber (até 60%) e, se ainda
  // não couber, corta com reticências
  const maxF = round(clamp(m.brandH * 0.34, 26, 56));
  let nameF = maxF;
  while (nameF > maxF * 0.6 && measureText(market.name, "display800", nameF, -nameF * 0.02) > availW) nameF -= 1;
  const name = wrapMeasured(market.name, availW, "display800", nameF, 1, -nameF * 0.02)[0] ?? "";
  const tagline = wrapMeasured(market.tagline ?? "", availW, "text500", tagF, 1)[0] ?? null;
  return (
    <div style={{ ...flexRow, width: m.W, height: m.safeTop + m.brandH, paddingTop: m.safeTop, paddingLeft: m.pad, paddingRight: m.pad, backgroundColor: ctx.c.brandBg, alignItems: "center", justifyContent: "center" }}>
      <Logo ctx={ctx} market={market} size={logo} />
      <div style={{ ...flexCol, marginLeft: gap, color: ctx.c.brandText }}>
        <div style={{ display: "flex", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: nameF, lineHeight: 1.05, letterSpacing: -nameF * 0.02, whiteSpace: "nowrap" }}>{name}</div>
        {tagline ? <div style={{ display: "flex", fontSize: tagF, fontWeight: 500, marginTop: 2, opacity: 0.85, whiteSpace: "nowrap" }}>{tagline}</div> : null}
      </div>
    </div>
  );
}

function Hero({ ctx, headline, subheadline, m }: { ctx: Ctx; headline: string; subheadline: string | null; m: Metrics }) {
  const innerW = m.W - m.pad * 4;
  const subF = round(clamp(m.heroH * 0.14, 22, 36));
  const subH = subheadline ? round(subF * 1.5) : 0;
  const availH = m.heroH - round(m.heroH * 0.16) - subH;
  const text = clip(headline, 80).toUpperCase();
  // maior fonte em que o título cabe em 2 linhas (ou 3, se assim ficar
  // maior; título longo demais termina em "…")
  const track = -0.025;
  const fit = (maxLines: number) => {
    for (let size = round(m.heroH * 0.5); size >= 24; size -= 2) {
      const ls = wrapMeasured(text, innerW, "display800", size, maxLines, size * track);
      const complete = ls.length > 0 && !ls[ls.length - 1].endsWith("…");
      if (complete && ls.length * size * 0.92 <= availH) return { fs: size, lines: ls };
    }
    return { fs: 24, lines: wrapMeasured(text, innerW, "display800", 24, maxLines, 24 * track) };
  };
  const two = fit(2);
  const three = two.fs < m.heroH * 0.26 ? fit(3) : two;
  const { fs, lines } = three.fs > two.fs ? three : two;
  return (
    <div style={{ ...flexCol, position: "relative", width: m.W, height: m.heroH, backgroundColor: ctx.c.headerBg, alignItems: "center", justifyContent: "center" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={patternDataUri(ctx.theme.pattern, m.W, m.heroH, ctx.c.pattern, 0.16)} width={m.W} height={m.heroH} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
      <div style={{ ...flexCol, alignItems: "center" }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display: "flex", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: fs, lineHeight: 0.92, letterSpacing: fs * track, color: ctx.c.headerText, whiteSpace: "nowrap" }}>
            {line}
          </div>
        ))}
        {subheadline ? (
          <div style={{ display: "flex", marginTop: round(subF * 0.45), fontSize: subF, fontWeight: 600, color: ctx.c.headerText, opacity: 0.92 }}>{clip(subheadline, 70)}</div>
        ) : null}
      </div>
    </div>
  );
}

function ValidityRibbon({ ctx, label, m }: { ctx: Ctx; label: string; m: Metrics }) {
  const f = round(m.ribbonH * 0.44);
  return (
    <div style={{ ...flexRow, width: m.W, height: m.ribbonH, backgroundColor: ctx.c.accent, color: ctx.c.accentText, alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: f, letterSpacing: f * 0.02, textTransform: "uppercase" }}>
      {label}
    </div>
  );
}

type IconName = "pin" | "whatsapp" | "phone" | "instagram" | "clock";

// ícones (traço do lucide, licença ISC) como SVG inline; o Satori não
// aceita fragmentos dentro de <svg>, então cada ícone é uma lista de formas
function iconShapes(name: IconName, color: string): ReactElement[] {
  const common = { fill: "none", stroke: color, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "pin":
      return [
        <path key="a" {...common} d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />,
        <circle key="b" {...common} cx="12" cy="10" r="3" />,
      ];
    case "whatsapp":
      return [
        <path key="a" {...common} d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />,
        <path key="b" fill={color} d="M8.6 7.6c.3-.4.8-.4 1.1 0l1 1.7c.2.3.1.7-.1 1l-.6.6c.5 1.1 1.4 2 2.5 2.5l.6-.6c.3-.3.7-.3 1-.1l1.7 1c.4.3.4.8 0 1.1l-.7.7c-.6.6-1.5.8-2.3.4-2.2-1-4-2.8-5-5-.4-.8-.2-1.7.4-2.3z" />,
      ];
    case "phone":
      return [
        <path key="a" {...common} d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />,
      ];
    case "instagram":
      return [
        <rect key="a" {...common} x="2.5" y="2.5" width="19" height="19" rx="5.5" />,
        <circle key="b" {...common} cx="12" cy="12" r="4.2" />,
        <circle key="c" cx="17.4" cy="6.6" r="1.3" fill={color} />,
      ];
    case "clock":
    default:
      return [<circle key="a" {...common} cx="12" cy="12" r="10" />, <path key="b" {...common} d="M12 6v6l4 2" />];
  }
}

function Icon({ name, size, color }: { name: IconName; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: round(size * 0.35) }}>
      {iconShapes(name, color)}
    </svg>
  );
}

function Footer({ ctx, market, m, page }: { ctx: Ctx; market: EncarteData["market"]; m: Metrics; page: EncartePage }) {
  const f = round(clamp(m.footerH * 0.19, 15, 26));
  const lf = round(clamp(m.footerH * 0.12, 12, 17));
  const address = [clip(market.address, 70), clip(market.city, 40)].filter(Boolean).join(" · ");
  const infos: { icon: IconName; text: string }[] = [];
  if (address) infos.push({ icon: "pin", text: address });
  if (market.whatsapp) infos.push({ icon: "whatsapp", text: clip(market.whatsapp, 24) });
  else if (market.phone) infos.push({ icon: "phone", text: clip(market.phone, 24) });
  if (market.whatsapp && market.phone && market.phone !== market.whatsapp) infos.push({ icon: "phone", text: clip(market.phone, 24) });
  if (market.instagram) infos.push({ icon: "instagram", text: `@${clip(market.instagram.replace(/^@+/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, ""), 30)}` });
  if (market.openingHours) infos.push({ icon: "clock", text: clip(market.openingHours, 48) });
  const legal = clip(market.legalNote || DEFAULT_LEGAL_NOTE, 260);
  const showPage = page.total > 1;
  const pageW = showPage ? round(f * 3.6) : 0;
  const innerW = m.W - m.pad * 2 - (showPage ? pageW + m.pad : 0);
  const legalLines = wrapMeasured(legal, innerW, "text500", lf, 2);

  return (
    <div style={{ ...flexRow, width: m.W, height: m.footerH + m.safeBottom, paddingBottom: m.safeBottom, paddingLeft: m.pad, paddingRight: m.pad, backgroundColor: ctx.c.brandBg, color: ctx.c.brandText, alignItems: "center" }}>
      <div style={{ ...flexCol, width: innerW, justifyContent: "center" }}>
        {infos.length ? (
          <div style={{ ...flexRow, flexWrap: "wrap", alignItems: "center", fontSize: f, fontWeight: 600, lineHeight: 1.25 }}>
            {infos.map((info, i) => (
              <div key={i} style={{ ...flexRow, alignItems: "center", marginRight: round(f * 1.1), marginBottom: round(f * 0.25) }}>
                <Icon name={info.icon} size={round(f * 1.05)} color={ctx.c.brandText} />
                <div style={{ display: "flex" }}>{info.text}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: infos.length ? round(f * 0.2) : 0, opacity: 0.78 }}>
          <TextLines lines={legalLines} style={{ fontSize: lf, lineHeight: 1.3, fontWeight: 500 }} />
        </div>
      </div>
      {showPage ? (
        <div style={{ display: "flex", width: pageW, marginLeft: m.pad, height: round(f * 1.9), borderRadius: round(f), alignItems: "center", justifyContent: "center", backgroundColor: ctx.c.brandText, color: ctx.c.brandBg, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: round(f * 1.05) }}>
          {`${page.index + 1}/${page.total}`}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------

export type RenderedPage = { element: ReactElement; width: number; height: number; pageIndex: number; pageCount: number };

// Monta a página `pageIndex` (0-based). Página fora do intervalo devolve null.
export function renderEncartePage(data: EncarteData, pageIndex: number): RenderedPage | null {
  const page = getPage(data, pageIndex);
  if (!page) return null;
  const m = metrics(data.format);
  const theme = getTheme(data.themeKey);
  const c = resolveThemeColors(theme, data.market);
  // contorno do destaque: a cor do título, ou a da etiqueta quando a do
  // título some no fundo (ex. Black Friday, preto sobre quase preto)
  const highlightBorder = contrastRatio(c.headerBg, c.bg) >= 2 ? c.headerBg : c.tagBg;
  const ctx: Ctx = { c, theme, s: m.s, highlightBorder };
  const cap = FORMATS[data.format].capacity[data.layout];

  const validity = validityLabel(data.validFrom, data.validUntil);
  const headline = (data.headline && data.headline.trim()) || theme.headline;
  const subheadline = data.subheadline == null ? (data.headline ? null : theme.subheadline ?? null) : data.subheadline.trim() || null;

  const areaH = m.H - m.safeTop - m.brandH - m.heroH - (validity ? m.ribbonH : 0) - m.footerH - m.safeBottom - m.pad * 2;
  const areaW = m.W - m.pad * 2;

  let products: ReactElement;
  if (page.items.length === 0 && !page.featured) {
    products = (
      <div style={{ ...flexCol, width: areaW, height: areaH, alignItems: "center", justifyContent: "center", color: c.bgText, fontSize: round(34 * m.s), fontWeight: 600 }}>
        <div style={{ display: "flex" }}>Adicione produtos para ver o encarte</div>
      </div>
    );
  } else if (data.layout === "lista") {
    products = <List ctx={ctx} items={page.items} perPage={cap.perPage} w={areaW} h={areaH} gap={round(m.gap * 0.75)} />;
  } else if (data.layout === "destaque") {
    products = <Featured ctx={ctx} page={page} cols={cap.columns} perPage={cap.perPage} w={areaW} h={areaH} gap={m.gap} share={m.featuredShare} />;
  } else {
    products = <Grid ctx={ctx} items={page.items} cols={cap.columns} maxRows={Math.ceil(cap.perPage / cap.columns)} w={areaW} h={areaH} gap={m.gap} />;
  }

  const element = (
    <div style={{ ...flexCol, width: m.W, height: m.H, backgroundColor: c.bg, fontFamily: FONT_TEXT, color: c.cardText }}>
      <BrandBar ctx={ctx} market={data.market} m={m} />
      <Hero ctx={ctx} headline={headline} subheadline={subheadline} m={m} />
      {validity ? <ValidityRibbon ctx={ctx} label={validity} m={m} /> : null}
      <div style={{ ...flexRow, position: "relative", width: m.W, height: areaH + m.pad * 2, padding: m.pad }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={patternDataUri(theme.pattern, m.W, areaH + m.pad * 2, c.bgText, 0.05)} width={m.W} height={areaH + m.pad * 2} alt="" style={{ position: "absolute", top: 0, left: 0 }} />
        {products}
      </div>
      <Footer ctx={ctx} market={data.market} m={m} page={page} />
    </div>
  );

  return { element, width: m.W, height: m.H, pageIndex: page.index, pageCount: page.total };
}
