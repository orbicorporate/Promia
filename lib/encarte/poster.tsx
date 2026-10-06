/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */
import { FONT_DISPLAY, FONT_TEXT } from "./render";
import { getTheme, resolveThemeColors } from "./themes";
import { discountLabel, limitLabel, oldPriceLabel, priceParts, unitSuffix } from "./price";
import { validityLabel, clip } from "./text";
import type { EncarteData, EncarteItem } from "./types";

// Cartaz de gôndola em A4 (um produto por página), para imprimir e pendurar
// na prateleira. Mesmo motor do encarte (next/og), mesma identidade do
// mercado: barra na cor da marca, tema do encarte nos detalhes, preço grande
// na etiqueta amarela que o cliente reconhece de longe.

export const POSTER_SIZE = { width: 1240, height: 1754 }; // A4 a 150 dpi

export function renderPoster(data: EncarteData, item: EncarteItem) {
  const theme = getTheme(data.themeKey);
  const c = resolveThemeColors(theme, data.market);
  const p = priceParts(item.price);
  const old = oldPriceLabel(item.price, item.oldPrice);
  const off = discountLabel(item.price, item.oldPrice);
  const limit = limitLabel(item.limitQty);
  const unit = unitSuffix(item.unit);
  const validade = validityLabel(data.validFrom, data.validUntil);
  const name = clip(item.name, 70);
  // sem foto, o nome ocupa o espaço dela em letra bem maior
  const nameSize = item.imageUrl ? (name.length > 44 ? 70 : name.length > 28 ? 84 : 104) : name.length > 44 ? 104 : name.length > 28 ? 130 : 160;

  return (
    <div style={{ width: POSTER_SIZE.width, height: POSTER_SIZE.height, display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: FONT_TEXT, color: "#17130F" }}>
      {/* barra da marca */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "40px 64px", background: c.brandBg, color: c.brandText }}>
        {data.market.logoUrl ? (
          <div style={{ display: "flex", width: 120, height: 120, borderRadius: 24, background: "#ffffff", alignItems: "center", justifyContent: "center" }}>
            <img src={data.market.logoUrl} width={104} height={104} style={{ objectFit: "contain" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 60, lineHeight: 1 }}>{clip(data.market.name, 30)}</div>
          {data.market.tagline ? <div style={{ fontSize: 30, opacity: 0.85, marginTop: 8 }}>{clip(data.market.tagline, 50)}</div> : null}
        </div>
      </div>

      {/* faixa de oferta */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "26px 64px", background: c.headerBg, color: c.headerText }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 72, letterSpacing: -1 }}>{clip(item.label || "OFERTA", 22)}</div>
        {off ? (
          <div style={{ display: "flex", padding: "12px 28px", borderRadius: 999, background: c.accent, color: c.accentText, fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 52 }}>{off}</div>
        ) : null}
      </div>

      {/* produto e preço dividem o espaço que sobra, sem invadir um ao outro */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: item.imageUrl ? "space-between" : "center", gap: item.imageUrl ? 0 : 110, padding: "40px 64px 40px", overflow: "hidden" }}>
        {item.imageUrl ? (
          <div style={{ display: "flex", width: 680, height: 500, alignItems: "center", justifyContent: "center" }}>
            <img src={item.imageUrl} width={680} height={500} style={{ objectFit: "contain" }} />
          </div>
        ) : null}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 1112 }}>
          <div style={{ display: "flex", width: 1112, justifyContent: "center", textAlign: "center", fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: nameSize, lineHeight: 1.04, letterSpacing: -2 }}>{name}</div>
          {item.brand && !name.toLowerCase().includes(item.brand.toLowerCase()) ? <div style={{ fontSize: 38, color: "#5b5650", marginTop: 10 }}>{clip(item.brand, 40)}</div> : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {old ? <div style={{ fontSize: 46, color: "#5b5650", textDecoration: "line-through", marginBottom: 14 }}>{old}</div> : null}
          <div style={{ display: "flex", alignItems: "flex-start", padding: "14px 52px 18px", borderRadius: 40, background: c.tagBg, color: c.tagText, boxShadow: "0 14px 0 rgba(0,0,0,0.18)" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 76, marginTop: 30, marginRight: 12 }}>R$</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 280, lineHeight: 1, letterSpacing: -10 }}>{p.integer}</div>
            <div style={{ display: "flex", flexDirection: "column", marginLeft: 8 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 112, lineHeight: 1 }}>{p.cents}</div>
              {unit ? <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 52 }}>{unit}</div> : null}
            </div>
          </div>
          {limit ? <div style={{ fontSize: 34, marginTop: 26, color: "#3b3631" }}>{limit}</div> : null}
        </div>
      </div>

      {/* rodapé */}
      <div style={{ display: "flex", flexDirection: "column", padding: "22px 64px 26px", background: c.brandBg, color: c.brandText }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 34 }}>{validade ?? "Oferta por tempo limitado"}</div>
        <div style={{ fontSize: 24, opacity: 0.85, marginTop: 4 }}>{clip(data.market.legalNote || "Imagens ilustrativas. Válido enquanto durarem os estoques.", 110)}</div>
      </div>
    </div>
  );
}
