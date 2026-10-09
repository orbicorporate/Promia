import type { CSSProperties, ReactElement } from "react";
import { mix } from "../color";
import { FORMATS } from "../formats";
import { getPage } from "../paginate";
import { discountLabel, effectiveOldPrice, formatBRL, priceParts, unitSuffix } from "../price";
import { marketInitials } from "../render";
import { getTheme } from "../themes";
import { measureText, validityLabel, wrapMeasured } from "../text";
import type { EncarteData, EncarteItem } from "../types";
import { Selo, fitFont } from "./formas";
import { tokensFor, type Tokens } from "./paleta";
import { kraft, madeira, sombraChao } from "./texturas";
import { FONT_ALFA, FONT_BALOO, FONT_LILITA, FONT_PINCEL } from "./tipografia";

// Modelo "Feira": papel kraft, placa de madeira no título, produtos
// recortados em cima de cartões de papel e etiqueta de preço colada na
// parte de baixo. Pensado para hortifrúti, açougue e dias de oferta
// (quarta verde, sexta da carne). As cores vêm do tema da categoria.

const row: CSSProperties = { display: "flex", flexDirection: "row" };
const col: CSSProperties = { display: "flex", flexDirection: "column" };
const r = Math.round;

type Pg = { element: ReactElement; width: number; height: number; pageIndex: number; pageCount: number };

function Img({ src, w, h, style }: { src: string; w: number; h: number; style?: CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} width={r(w)} height={r(h)} alt="" style={{ width: r(w), height: r(h), ...style }} />;
}

function Lockup({ t, name, s, logo }: { t: Tokens; name: string; s: number; logo?: string | null }) {
  const d = r(84 * s);
  const label = name.length > 26 ? `${name.slice(0, 25)}…` : name;
  const fs = fitFont(label.toUpperCase(), "alfa400", 470 * s, 38 * s, 0.5 * s, 38 * s);
  return (
    <div style={{ ...row, alignItems: "center" }}>
      {logo ? (
        <div style={{ ...row, width: d, height: d, borderRadius: d, backgroundColor: "#fff", border: `${r(4 * s)}px solid ${t.ink}`, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <Img src={logo} w={d * 0.82} h={d * 0.82} style={{ objectFit: "contain" }} />
        </div>
      ) : (
        <Selo kind="festonado" w={d} h={d} fill={t.market} edge={t.cream} edgeW={4 * s} shadow={t.ink} shadowDx={3 * s} shadowDy={3 * s} lines={[{ text: marketInitials(name), variant: "lilita400", font: FONT_LILITA, color: t.onMarket }]} />
      )}
      <div style={{ ...col, marginLeft: r(16 * s) }}>
        <div style={{ display: "flex", fontFamily: FONT_ALFA, fontSize: fs, color: t.ink, letterSpacing: 0.5 * s, lineHeight: 1, whiteSpace: "nowrap" }}>{label.toUpperCase()}</div>
      </div>
    </div>
  );
}

function ProductCard({ t, item, w, h, s, tilt }: { t: Tokens; item: EncarteItem; w: number; h: number; s: number; tilt: number }) {
  const photoH = h * (w / h > 1.1 ? 0.46 : 0.52);
  const bodyTop = h * 0.17;
  const pad = w * 0.06;
  const wide = w / h > 1.1;
  const plaqueH = h * (wide ? 0.3 : 0.28);
  const plaqueW = w - pad * 2;
  const p = priceParts(item.price);
  const unit = unitSuffix(item.unit);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const disc = discountLabel(item.price, item.oldPrice);

  // nome em até 2 linhas
  const avail = h - plaqueH - pad * 0.9 - (photoH + 4 * s) - 2 * s;
  const oldRatio = effectiveOldPrice(item.price, item.oldPrice) ? 0.78 : 0;
  const nameSize = Math.max(14, r(Math.min(34 * s, avail / (1.08 + oldRatio * 0.9))));
  const nameLines = wrapMeasured(item.name, w - pad * 2, "baloo800", nameSize, avail > nameSize * 2.6 ? 2 : 1);

  // preço: o inteiro cresce até caber na etiqueta
  const intH = plaqueH * 0.74;
  const centsW = measureText(p.cents, "lilita400", intH * 0.42, 0);
  const cifraW = measureText(p.currency, "lilita400", intH * 0.3, 0);
  const intSize = fitFont(p.integer, "lilita400", plaqueW - centsW - cifraW - pad * 1.6, intH, 0, intH);
  const centsSize = r(Math.max(12, intSize * 0.42));
  const cifraSize = r(Math.max(10, intSize * 0.3));
  const unitSize = r(Math.max(10, intSize * 0.22));

  return (
    <div style={{ display: "flex", position: "relative", width: r(w), height: r(h), transform: `rotate(${tilt}deg)` }}>
      {/* corpo do cartão */}
      <div style={{ display: "flex", position: "absolute", left: 0, top: r(bodyTop), width: r(w), height: r(h - bodyTop), backgroundColor: t.cream, border: `${r(3.5 * s)}px solid ${t.ink}`, borderRadius: r(18 * s), boxShadow: `${r(7 * s)}px ${r(8 * s)}px 0 ${mix(t.ink, "#000", 0.2)}` }} />
      {/* sombra no chão + foto recortada */}
      <Img src={sombraChao(r(w), r(photoH * 0.3), 0.38)} w={w * 0.8} h={photoH * 0.3} style={{ position: "absolute", left: w * 0.1, top: photoH * 0.8 + 6 * s }} />
      {item.imageUrl ? (
        <Img src={item.imageUrl} w={w * 0.86} h={photoH} style={{ position: "absolute", left: w * 0.07, top: 0, objectFit: "contain" }} />
      ) : (
        <div style={{ ...col, position: "absolute", left: w * 0.2, top: photoH * 0.12, width: w * 0.6, height: photoH * 0.78, alignItems: "center", justifyContent: "center", borderRadius: w, backgroundColor: mix(t.main, t.cream, 0.82), border: `${r(3 * s)}px dashed ${mix(t.main, "#fff", 0.4)}`, fontFamily: FONT_LILITA, fontSize: r(photoH * 0.4), color: mix(t.main, "#fff", 0.35) }}>
          <div style={{ display: "flex" }}>{item.name.normalize("NFD").replace(/[^A-Za-z]/g, "")[0]?.toUpperCase() ?? "?"}</div>
        </div>
      )}
      {/* selo de desconto */}
      {disc ? (
        <Selo kind="festonado" w={r(Math.min(w * 0.3, h * 0.3))} h={r(Math.min(w * 0.3, h * 0.3))} fill={t.hot} edge={t.cream} edgeW={3.5 * s} shadow={t.ink} shadowDx={3 * s} shadowDy={3 * s} rotate={10} style={{ position: "absolute", right: -w * 0.02, top: h * 0.1 }} lines={[{ text: disc, variant: "lilita400", font: FONT_LILITA, color: t.hotInk }]} />
      ) : null}
      {/* nome */}
      <div style={{ ...col, position: "absolute", left: pad, top: photoH + 4 * s, width: plaqueW, alignItems: "center" }}>
        {nameLines.map((l, i) => (
          <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: nameSize, lineHeight: 1.05, color: t.ink, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        {old ? (
          <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(nameSize * 0.7), lineHeight: 1, color: mix(t.ink, "#fff", 0.35), textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div>
        ) : null}
      </div>
      {/* etiqueta de preço */}
      <div style={{ ...row, position: "absolute", left: pad, top: h - plaqueH - pad * 0.9, width: r(plaqueW), height: r(plaqueH), backgroundColor: t.sun, border: `${r(3.5 * s)}px solid ${t.ink}`, borderRadius: r(14 * s), alignItems: "center", justifyContent: "center", boxShadow: `0 ${r(5 * s)}px 0 ${t.sunDeep}` }}>
        <div style={{ ...row, alignItems: "flex-start" }}>
          <div style={{ display: "flex", fontFamily: FONT_LILITA, fontSize: cifraSize, color: t.sunInk, marginTop: r(intSize * 0.12), marginRight: r(intSize * 0.05) }}>{p.currency}</div>
          <div style={{ display: "flex", fontFamily: FONT_LILITA, fontSize: intSize, lineHeight: 1, color: t.sunInk, letterSpacing: -intSize * 0.02 }}>{p.integer}</div>
          <div style={{ ...col, marginTop: r(intSize * 0.1), marginLeft: r(intSize * 0.03) }}>
            <div style={{ display: "flex", fontFamily: FONT_LILITA, fontSize: centsSize, lineHeight: 1, color: t.sunInk }}>{p.cents}</div>
            {unit ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: unitSize, color: t.sunInk, marginTop: r(intSize * 0.02) }}>{unit}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderFeira(data: EncarteData, pageIndex: number): Pg | null {
  const page = getPage(data, pageIndex);
  if (!page) return null;
  const spec = FORMATS[data.format];
  const W = spec.width;
  const H = spec.height;
  const s = W / 1080;
  const t = tokensFor(data.themeKey, data.market);
  const theme = getTheme(data.themeKey);
  const cap = spec.capacity.grade;
  const cols = cap.columns;
  const capRows = Math.ceil(cap.perPage / cols);
  const items = page.items.slice(0, cap.perPage);
  const rows = Math.max(1, Math.ceil(items.length / cols));

  const pad = r(34 * s);
  const topPad = spec.safeTop || r(26 * s);
  const footerH = r((data.format === "story" ? 150 : 118) * s) + (spec.safeBottom ? spec.safeBottom - r(90 * s) : 0);
  const headline = (data.headline && data.headline.trim()) || theme.headline;
  const sub = data.subheadline == null ? (data.headline ? null : theme.subheadline ?? null) : data.subheadline.trim() || null;
  const validity = validityLabel(data.validFrom, data.validUntil);

  const lockupH = r(84 * s);
  const plankH = r((data.format === "quadrado" ? 120 : 168) * s);
  const subH = sub ? r(48 * s) : 0;
  const headerH = topPad + lockupH + r(14 * s) + plankH + subH + r(18 * s);
  const areaTop = headerH - r(26 * s);
  const areaH = H - headerH - footerH + r(26 * s);
  const gap = r(22 * s);
  const cardW = r((W - pad * 2 - gap * (cols - 1)) / cols);
  const nominalH = (areaH - gap * (capRows - 1) - r(20 * s)) / capRows;
  const cardH = r(Math.min(nominalH * 1.25, (areaH - gap * (rows - 1) - r(20 * s)) / rows));

  const plankW = W - pad * 2;
  const fs = fitFont(headline.toUpperCase(), "lilita400", plankW - r(80 * s), plankH * 0.62, 1.5 * s, plankH * 0.7);

  const cells: ReactElement[][] = [];
  for (let rIdx = 0; rIdx < rows; rIdx++) {
    const rowItems = items.slice(rIdx * cols, rIdx * cols + cols);
    if (!rowItems.length) break;
    cells.push(
      rowItems.map((it, i) => <ProductCard key={`${rIdx}-${i}`} t={t} item={it} w={cardW} h={cardH} s={s} tilt={(rIdx + i) % 2 === 0 ? -1.2 : 1.1} />)
    );
  }

  const foot = [data.market.address, data.market.city].filter(Boolean).join(" - ");
  const contact = [data.market.whatsapp ? `WhatsApp ${data.market.whatsapp}` : null, data.market.instagram ? `@${data.market.instagram.replace(/^@/, "")}` : null].filter(Boolean).join("   ");

  const element = (
    <div style={{ ...col, position: "relative", width: W, height: H, backgroundColor: t.paper, fontFamily: FONT_BALOO }}>
      <Img src={kraft(W, H, t.paper)} w={W} h={H} style={{ position: "absolute", left: 0, top: 0 }} />

      {/* topo: marca e validade */}
      <div style={{ ...row, position: "absolute", left: pad, top: topPad, width: W - pad * 2, height: lockupH, alignItems: "center", justifyContent: "space-between" }}>
        <Lockup t={t} name={data.market.name} s={s} logo={data.market.logoUrl} />
        {validity ? (
          <Selo kind="faixa" w={r(300 * s)} h={r(62 * s)} fill={t.hot} edge={t.cream} edgeW={3 * s} shadow={t.ink} shadowDx={3 * s} shadowDy={3 * s} lines={[{ text: validity.replace("Ofertas válidas ", "").replace("Oferta válida ", "").toUpperCase(), variant: "lilita400", font: FONT_LILITA, color: t.hotInk, tracking: 0.5 }]} />
        ) : null}
      </div>

      {/* placa de madeira com o título */}
      <div style={{ ...row, position: "absolute", left: pad, top: topPad + lockupH + r(14 * s), width: plankW, height: plankH, transform: "rotate(-1deg)", alignItems: "center", justifyContent: "center", borderRadius: r(18 * s), border: `${r(5 * s)}px solid ${t.ink}`, overflow: "hidden", boxShadow: `${r(8 * s)}px ${r(9 * s)}px 0 ${mix(t.ink, "#000", 0.25)}` }}>
        <Img src={madeira(plankW, plankH, mix("#8a5a2b", t.main, 0.12), 2)} w={plankW} h={plankH} style={{ position: "absolute", left: 0, top: 0 }} />
        <div style={{ display: "flex", fontFamily: FONT_LILITA, fontSize: fs, color: t.cream, letterSpacing: 1.5 * s, lineHeight: 1, whiteSpace: "nowrap", textShadow: `${r(4 * s)}px ${r(5 * s)}px 0 ${t.ink}` }}>{headline.toUpperCase()}</div>
      </div>

      {sub ? (
        <div style={{ ...row, position: "absolute", left: pad, top: topPad + lockupH + r(14 * s) + plankH + r(10 * s), width: plankW, height: subH, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: FONT_PINCEL, fontSize: fitFont(sub, "caveat400", plankW - 60 * s, subH, 0, r(42 * s)), color: t.ink, whiteSpace: "nowrap" }}>{sub}</div>
        </div>
      ) : null}

      {/* produtos */}
      <div style={{ ...col, position: "absolute", left: pad, top: areaTop, width: W - pad * 2, height: areaH, justifyContent: "center" }}>
        {items.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", fontFamily: FONT_BALOO, fontSize: r(34 * s), color: t.ink }}>Adicione produtos para ver o encarte</div>
        ) : (
          cells.map((rowCells, i) => (
            <div key={i} style={{ ...row, justifyContent: "space-between", marginTop: i === 0 ? 0 : gap }}>
              {rowCells}
            </div>
          ))
        )}
      </div>

      {/* rodapé */}
      <div style={{ ...col, position: "absolute", left: 0, top: H - footerH, width: W, height: footerH, backgroundColor: t.mainDeep, borderTop: `${r(6 * s)}px solid ${t.sun}`, alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", fontFamily: FONT_LILITA, fontSize: r(34 * s), color: t.cream, letterSpacing: 1 * s, whiteSpace: "nowrap" }}>{(foot || data.market.name).toUpperCase()}</div>
        {contact ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(28 * s), color: t.sun, marginTop: r(4 * s), whiteSpace: "nowrap" }}>{contact}</div> : null}
        <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(18 * s), color: mix(t.mainDeep, "#fff", 0.55), marginTop: r(4 * s), whiteSpace: "nowrap" }}>Ofertas sujeitas a estoque. Imagens meramente ilustrativas.</div>
      </div>
    </div>
  );
  return { element, width: W, height: H, pageIndex: page.index, pageCount: page.total };
}
