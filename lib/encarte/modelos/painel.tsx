import { discountPercent, effectiveOldPrice, formatBRL } from "../price";
import type { EncarteData } from "../types";
import { wrapMeasured } from "../text";
import { Foto, Pilula, TagDesconto, col, compor, r, row, type CardProps } from "./brilho";
import { FONT_BALOO } from "./tipografia";

// Modelo "Painel": sem cartão. Produtos grandes soltos sobre o fundo de luz
// e raios, nome em branco com sombra e etiqueta de preço em relevo.

function CardPainel({ t, item, w, h, s, wide }: CardProps) {
  const pct = discountPercent(item.price, item.oldPrice);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const size = r(Math.min(34 * s, w / 9));
  const lines = wrapMeasured(item.name, w * (wide ? 0.5 : 0.94), "baloo800", size, 2);
  const shadow = `0 ${r(3 * s)}px ${r(6 * s)}px rgba(0,0,0,0.6)`;
  const nome = (
    <div style={{ ...col, alignItems: wide ? "flex-start" : "center" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: size, lineHeight: 1.04, color: "#fff", textShadow: shadow, whiteSpace: "nowrap" }}>{l}</div>
      ))}
      {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.72), color: "rgba(255,255,255,0.75)", textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
    </div>
  );
  const tag = pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: r(w * 0.04), top: 0 }}><TagDesconto t={t} pct={pct} w={Math.min(w, h * 0.9) * 0.24} s={s} /></div> : null;
  if (wide) {
    const pw = r(w * 0.5);
    const iw = r(w - pw);
    return (
      <div style={{ ...row, position: "relative", width: r(w), height: r(h), alignItems: "center" }}>
        <Foto item={item} t={t} w={pw} h={h * 0.86} shadow={0.5} />
        <div style={{ ...col, width: iw, alignItems: "flex-start", justifyContent: "center", paddingLeft: r(10 * s) }}>
          {nome}
          <div style={{ display: "flex", marginTop: r(12 * s) }}><Pilula t={t} price={item.price} unit={item.unit} w={r(iw * 0.92)} h={r(h * 0.3)} s={s} /></div>
        </div>
        {tag}
      </div>
    );
  }
  const photoH = r(h * 0.5);
  return (
    <div style={{ ...col, position: "relative", width: r(w), height: r(h), alignItems: "center" }}>
      <Foto item={item} t={t} w={w * 0.9} h={photoH} shadow={0.5} />
      <div style={{ display: "flex", marginTop: r(h * 0.01) }}>{nome}</div>
      <div style={{ display: "flex", position: "absolute", left: r(w * 0.08), top: r(h - h * 0.24) }}>
        <Pilula t={t} price={item.price} unit={item.unit} w={r(w * 0.84)} h={r(h * 0.22)} s={s} />
      </div>
      {tag}
    </div>
  );
}

export function renderPainel(data: EncarteData, pageIndex: number) {
  return compor(data, pageIndex, { estilo: "bokeh", Card: CardPainel, gap: 14, padX: 30, cardMaxRatio: 1.1 });
}
