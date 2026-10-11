import { discountPercent } from "../price";
import type { EncarteData } from "../types";
import { Foto, NomeProduto, Pilula, SeloPreco, TagDesconto, col, compor, r, row, type CardProps } from "./brilho";

// Modelo "Vitrine": cartões brancos com cantos redondos e sombra, produto
// recortado em cima, nome embaixo e a etiqueta de preço saltando para fora
// da borda inferior. Desconto em tag vermelha no canto. O fundo e as
// etiquetas pegam a cor do emblema da campanha.

function CardVitrine({ t, item, w, h, s, wide, index }: CardProps) {
  const pad = r(14 * s);
  const radius = r(30 * s);
  const pct = discountPercent(item.price, item.oldPrice);
  const useSeal = index % 2 === 1 && !wide; // alterna selo redondo e pílula
  const shell = {
    ...col,
    position: "relative" as const,
    width: r(w),
    height: r(h),
    borderRadius: radius,
    backgroundImage: `linear-gradient(180deg, ${t.card0}, ${t.card1})`,
    border: `${r(3 * s)}px solid rgba(255,255,255,0.9)`,
    boxShadow: `0 ${r(12 * s)}px ${r(26 * s)}px rgba(0,0,0,0.42)`,
  };
  const gloss = <div style={{ display: "flex", position: "absolute", left: r(10 * s), top: r(6 * s), width: r(w - 20 * s), height: r(h * 0.1), borderRadius: radius, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0))" }} />;
  const tw = Math.min(w, h * 0.9) * 0.27;
  const tag = pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: wide ? r(14 * s) : r(w - tw - 8 * s), top: r(-6 * s) }}><TagDesconto t={t} pct={pct} w={tw} s={s} /></div> : null;

  if (wide) {
    // quadrado: foto à esquerda, informação à direita
    const pw = r(w * 0.46);
    const iw = r(w - pw - pad * 2);
    return (
      <div style={{ ...shell, ...row, alignItems: "center", padding: `0 ${pad}px` }}>
        {gloss}
        <Foto item={item} t={t} w={pw} h={h * 0.8} />
        <div style={{ ...col, width: iw, alignItems: "center", justifyContent: "center", marginLeft: r(6 * s) }}>
          <NomeProduto item={item} w={iw} size={r(Math.min(30 * s, iw / 6.8))} color={t.cardInk} muted={t.cardMuted} maxLines={2} />
          <div style={{ display: "flex", marginTop: r(14 * s) }}>
            <Pilula t={t} price={item.price} unit={item.unit} w={iw} h={r(h * 0.3)} s={s} />
          </div>
        </div>
        {tag}
      </div>
    );
  }

  const photoH = r(h * 0.44);
  const nameSize = r(Math.min(34, w / 9.5 / s) * s);
  const priceBoxH = r(h * 0.24);
  return (
    <div style={shell}>
      {gloss}
      <div style={{ ...row, justifyContent: "center", marginTop: r(h * 0.04) }}>
        <Foto item={item} t={t} w={w * 0.84} h={photoH} />
      </div>
      <div style={{ ...col, alignItems: "center", marginTop: r(h * 0.015), padding: `0 ${pad}px` }}>
        <NomeProduto item={item} w={w - pad * 2} size={nameSize} color={t.cardInk} muted={t.cardMuted} maxLines={2} />
      </div>
      <div style={{ display: "flex", position: "absolute", left: 0, top: r(h - priceBoxH * (useSeal ? 1.3 : 1.0) - 18 * s), width: r(w), justifyContent: "center" }}>
        {useSeal ? <SeloPreco t={t} price={item.price} unit={item.unit} d={r(Math.min(w * 0.6, priceBoxH * 1.3))} s={s} /> : <Pilula t={t} price={item.price} unit={item.unit} w={r(w * 0.84)} h={priceBoxH} s={s} />}
      </div>
      {tag}
    </div>
  );
}

export function renderVitrine(data: EncarteData, pageIndex: number) {
  return compor(data, pageIndex, { estilo: "raios", Card: CardVitrine, gap: 26, padX: 34 });
}
