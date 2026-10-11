import { discountPercent, effectiveOldPrice, formatBRL } from "../price";
import type { EncarteData } from "../types";
import { wrapMeasured } from "../text";
import { Foto, PrecoTexto, TagDesconto, col, compor, r, row, type CardProps } from "./brilho";
import { FONT_BALOO } from "./tipografia";

// Modelo "Pomar": produto sobre um caixote de madeira e barra escura embaixo
// com o nome à esquerda e o preço em dourado à direita.

const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

function caixote(w: number, h: number) {
  const slats = 4;
  const sh = h / slats;
  const rects = Array.from({ length: slats }, (_, i) => `<rect x="0" y="${i * sh + 2}" width="${w}" height="${sh - 4}" rx="4" fill="url(#w)"/><path d="M${w * 0.1} ${i * sh + sh / 2} H${w * 0.9}" stroke="#6b3f12" stroke-opacity="0.35" stroke-width="2"/>`).join("");
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d79a52"/><stop offset="1" stop-color="#9a6226"/></linearGradient></defs>${rects}</svg>`);
}

function CardPomar({ t, item, w, h, s, wide }: CardProps) {
  const pct = discountPercent(item.price, item.oldPrice);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const barH = r(h * (wide ? 0.34 : 0.27));
  const crateH = r(h * 0.3);
  const crateTop = r(h - barH - crateH + 6 * s);
  const photoH = r(crateTop + crateH * 0.3);
  const size = r(Math.min(30 * s, w / 11));
  const nameW = w * 0.52;
  const lines = wrapMeasured(item.name, nameW, "baloo800", size, 2);
  const tag = pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: r(w - Math.min(w, h) * 0.26 - 6 * s), top: 0 }}><TagDesconto t={t} pct={pct} w={Math.min(w, h) * 0.26} s={s} /></div> : null;
  return (
    <div style={{ ...col, position: "relative", width: r(w), height: r(h) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={caixote(r(w), crateH)} width={r(w)} height={crateH} alt="" style={{ position: "absolute", left: 0, top: crateTop, width: r(w), height: crateH, borderRadius: r(8 * s) }} />
      <div style={{ display: "flex", justifyContent: "center", width: r(w) }}>
        <Foto item={item} t={t} w={w * 0.8} h={photoH * 0.97} shadow={0.15} />
      </div>
      <div style={{ ...row, position: "absolute", left: 0, top: r(h - barH), width: r(w), height: barH, alignItems: "center", justifyContent: "space-between", padding: `0 ${r(14 * s)}px`, borderRadius: r(16 * s), backgroundImage: `linear-gradient(180deg, ${t.barA}, ${t.barB})`, border: `${r(2.5 * s)}px solid ${t.gold}`, boxShadow: `0 ${r(8 * s)}px ${r(16 * s)}px rgba(0,0,0,0.4)` }}>
        <div style={{ ...col, width: r(nameW) }}>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: size, lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap" }}>{l}</div>
          ))}
          {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.7), color: "rgba(255,255,255,0.6)", textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
        </div>
        <div style={{ display: "flex" }}>
          <PrecoTexto price={item.price} unit={item.unit} maxW={w * 0.4} maxH={barH * 0.72} color={t.gold} accent="#fff" />
        </div>
      </div>
      {tag}
    </div>
  );
}

export function renderPomar(data: EncarteData, pageIndex: number) {
  return compor(data, pageIndex, { estilo: "diagonal", Card: CardPomar, gap: 22, padX: 34, cardMaxRatio: 1.1 });
}
