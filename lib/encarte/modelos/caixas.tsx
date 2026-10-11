import { discountPercent, effectiveOldPrice, formatBRL } from "../price";
import { wrapMeasured } from "../text";
import { ProductCard } from "./feira";
import { Foto, NomeProduto, Pilula, PrecoTexto, SeloPreco, TagDesconto, hsl, col, r, row, type BT, type CardProps } from "./brilho";
import { Forma } from "./formas";
import { FONT_BALOO } from "./tipografia";

// Caixas de produto extras para os modelos brilhantes.

// Vidro: cartão translúcido com contorno claro e selo festonado de preço
// (referência: Terça das Frutas).
export function CardVidro({ t, item, w, h, s, wide }: CardProps) {
  const pct = discountPercent(item.price, item.oldPrice);
  const d = r(Math.min(w * 0.46, h * 0.44));
  const pad = r(14 * s);
  const nameSize = r(Math.min(32 * s, w / (wide ? 14 : 9.5)));
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const nameW = wide ? w * 0.4 : w - d - pad * 2.4;
  const lines = wrapMeasured(item.name, nameW, "baloo800", nameSize, 2);
  const shadow = `0 ${r(3 * s)}px ${r(6 * s)}px rgba(0,0,0,0.55)`;
  const nome = (
    <div style={{ ...col, alignItems: "flex-start" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: nameSize, lineHeight: 1.04, color: "#fff", textShadow: shadow, whiteSpace: "nowrap" }}>{l}</div>
      ))}
      {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(nameSize * 0.72), color: "rgba(255,255,255,0.78)", textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
    </div>
  );
  const seal = (
    <div style={{ display: "flex", position: "absolute", left: wide ? r(w * 0.5) : r(w - d - pad * 0.4), top: wide ? r(h * 0.52) : r(h - d - pad * 0.8), width: d, height: d, alignItems: "center", justifyContent: "center" }}>
      <Forma kind="festonado" w={d} h={d} fill={t.pillB === "#050507" ? "#1b1b22" : t.sealA} edge={t.gold} edgeW={3.5 * s} shadow="#000000" shadowDx={0} shadowDy={4 * s} />
      <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: d, height: d, alignItems: "center", justifyContent: "center" }}>
        <PrecoTexto price={item.price} unit={item.unit} maxW={d * 0.72} maxH={d * 0.5} color="#FFFFFF" accent={t.gold} />
      </div>
    </div>
  );
  const tag = pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: r(pad * 0.5), top: r(-6 * s) }}><TagDesconto t={t} pct={pct} w={Math.min(w, h * 0.9) * 0.24} s={s} /></div> : null;
  return (
    <div style={{ ...(wide ? row : col), position: "relative", width: r(w), height: r(h), borderRadius: r(28 * s), backgroundImage: "linear-gradient(160deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08))", border: `${r(3 * s)}px solid rgba(255,255,255,0.75)`, boxShadow: `0 ${r(10 * s)}px ${r(22 * s)}px rgba(0,0,0,0.3)`, alignItems: "center", justifyContent: wide ? "flex-start" : "flex-start", padding: wide ? `0 ${pad}px` : `${r(h * 0.04)}px ${pad}px 0` }}>
      <Foto item={item} t={t} w={wide ? w * 0.44 : w * 0.8} h={wide ? h * 0.8 : h * 0.5} shadow={0.45} />
      <div style={{ display: "flex", position: wide ? "relative" : "absolute", left: wide ? 0 : pad, top: wide ? 0 : r(h - d * 0.9 - pad * 0.4), marginLeft: wide ? r(8 * s) : 0, ...(wide ? { alignSelf: "flex-start" as const } : {}), paddingTop: wide ? r(h * 0.2) : 0 }}>{nome}</div>
      {seal}
      {tag}
    </div>
  );
}

// Barra: cartão escuro fosco, contorno dourado e etiqueta preta com preço
// branco (referência: Black Friday).
export function CardBarra({ t, item, w, h, s, wide }: CardProps) {
  const pct = discountPercent(item.price, item.oldPrice);
  const pad = r(14 * s);
  const dark: BT = { ...t, pillA: "#3a3a42", pillB: "#050507", pillEdge: "#000000", pillInk: "#FFFFFF", pillRing: t.gold };
  const priceH = r(h * (wide ? 0.3 : 0.22));
  const pill = <Pilula t={dark} price={item.price} unit={item.unit} w={r(wide ? w * 0.46 : w * 0.8)} h={priceH} s={s} />;
  const size = r(Math.min(32 * s, w / (wide ? 14 : 9.5)));
  const nameW = wide ? w * 0.46 : w - pad * 2;
  const tag = pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: wide ? r(pad * 0.5) : r(w - Math.min(w, h * 0.9) * 0.24 - pad * 0.5), top: r(-6 * s) }}><TagDesconto t={t} pct={pct} w={Math.min(w, h * 0.9) * 0.24} s={s} /></div> : null;
  return (
    <div style={{ ...(wide ? row : col), position: "relative", width: r(w), height: r(h), borderRadius: r(24 * s), backgroundImage: "linear-gradient(180deg, rgba(10,10,14,0.78), rgba(0,0,0,0.9))", border: `${r(3 * s)}px solid ${t.gold}`, boxShadow: `0 ${r(10 * s)}px ${r(22 * s)}px rgba(0,0,0,0.45)`, alignItems: "center", padding: wide ? `0 ${pad}px` : `${r(h * 0.04)}px ${pad}px 0` }}>
      <Foto item={item} t={t} w={wide ? w * 0.44 : w * 0.78} h={wide ? h * 0.8 : h * 0.46} shadow={0.6} />
      <div style={{ ...col, alignItems: "center", marginLeft: wide ? r(8 * s) : 0, justifyContent: "center" }}>
        <NomeProduto item={item} w={nameW} size={size} color="#FFFFFF" muted="rgba(255,255,255,0.6)" maxLines={2} />
        <div style={{ display: "flex", marginTop: r(10 * s) }}>{pill}</div>
      </div>
      {tag}
    </div>
  );
}

// Mercado: o cartão de papel do modelo Feira, sobre qualquer fundo.
export function CardMercado({ tk, item, w, h, s, index }: CardProps) {
  return <ProductCard t={tk} item={item} w={w} h={h} s={s} tilt={index % 2 === 0 ? -1.2 : 1.1} />;
}

// Selo: produto grande, nome numa placa escura e selo redondo de preço com
// aro dourado sobre o canto da foto (referência: Mega Dia das Mães).
export function CardSelo({ t, item, w, h, s, wide }: CardProps) {
  const d = r(Math.min(w * (wide ? 0.4 : 0.5), h * (wide ? 0.62 : 0.42)));
  const size = r(Math.min(30 * s, w / (wide ? 15 : 10)));
  const plaqueH = r(h * (wide ? 0.34 : 0.2));
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const nameW = wide ? w * 0.5 : w * 0.86;
  const lines = wrapMeasured(item.name, nameW - 24 * s, "baloo800", size, 2);
  const placa = (
    <div style={{ ...col, width: r(nameW), minHeight: plaqueH, alignItems: "center", justifyContent: "center", borderRadius: r(16 * s), backgroundImage: `linear-gradient(180deg, ${t.barA}, ${t.barB})`, border: `${r(2.5 * s)}px solid ${t.gold}`, padding: `${r(6 * s)}px 0`, boxShadow: `0 ${r(7 * s)}px ${r(14 * s)}px rgba(0,0,0,0.4)` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: size, lineHeight: 1.05, color: "#fff", whiteSpace: "nowrap" }}>{l}</div>
      ))}
      {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.7), color: "rgba(255,255,255,0.65)", textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
    </div>
  );
  if (wide) {
    return (
      <div style={{ ...row, position: "relative", width: r(w), height: r(h), alignItems: "center" }}>
        <Foto item={item} t={t} w={w * 0.5} h={h * 0.9} shadow={0.5} />
        <div style={{ ...col, width: r(w * 0.5), alignItems: "center", justifyContent: "center" }}>
          {placa}
          <div style={{ display: "flex", marginTop: r(10 * s) }}><SeloPreco t={t} price={item.price} unit={item.unit} d={d} s={s} /></div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ ...col, position: "relative", width: r(w), height: r(h), alignItems: "center" }}>
      <Foto item={item} t={t} w={w * 0.94} h={h * 0.62} shadow={0.5} />
      <div style={{ display: "flex", position: "absolute", left: r(w * 0.07), top: r(h - plaqueH - (old ? size * 0.8 : 0) - 4 * s) }}>{placa}</div>
      <div style={{ display: "flex", position: "absolute", left: r(w - d - w * 0.02), top: r(h * 0.36) }}><SeloPreco t={t} price={item.price} unit={item.unit} d={d} s={s} /></div>
    </div>
  );
}

// Linhas: uma faixa por produto, amarela e menta alternadas, foto à
// esquerda, nome no meio e preço à direita (referência: hortifrúti).
export function CardLinhas({ t, item, w, h, s, index }: CardProps) {
  const amarelo = index % 2 === 0;
  const bg = amarelo ? "#FFF0A0" : hsl(t.hue, 55, 88);
  const bg2 = amarelo ? "#FFDD55" : hsl(t.hue, 55, 78);
  const ink = hsl(t.hue, 55, 12);
  const pct = discountPercent(item.price, item.oldPrice);
  const pad = r(12 * s);
  const photoW = r(h * 1.15);
  const priceW = r(Math.min(w * 0.36, h * 2.3));
  const nameW = w - photoW - priceW - pad * 4;
  const size = r(Math.min(h * 0.3, 36 * s));
  const lines = wrapMeasured(item.name, nameW, "baloo800", size, 2);
  const old = effectiveOldPrice(item.price, item.oldPrice);
  const dark: BT = { ...t, pillA: "#3a3a42", pillB: "#050507", pillEdge: "#000000", pillInk: "#FFFFFF", pillRing: t.gold };
  return (
    <div style={{ ...row, position: "relative", width: r(w), height: r(h), alignItems: "center", borderRadius: r(h * 0.28), backgroundImage: `linear-gradient(90deg, ${bg}, ${bg2})`, border: `${r(3 * s)}px solid #FFFFFF`, boxShadow: `0 ${r(6 * s)}px ${r(14 * s)}px rgba(0,0,0,0.35)`, padding: `0 ${pad}px` }}>
      <Foto item={item} t={t} w={photoW} h={h * 0.9} shadow={0.3} />
      <div style={{ ...col, width: r(nameW), marginLeft: pad, justifyContent: "center" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: size, lineHeight: 1.04, color: ink, whiteSpace: "nowrap" }}>{l}</div>
        ))}
        {old ? <div style={{ display: "flex", fontFamily: FONT_BALOO, fontWeight: 800, fontSize: r(size * 0.7), color: hsl(t.hue, 20, 36), textDecoration: "line-through", whiteSpace: "nowrap" }}>{`de ${formatBRL(old)}`}</div> : null}
      </div>
      <div style={{ display: "flex", position: "absolute", left: r(w - priceW - pad), top: r(h * 0.12) }}>
        <Pilula t={dark} price={item.price} unit={item.unit} w={priceW} h={r(h * 0.76)} s={s} radius={r(h * 0.2)} />
      </div>
      {pct && pct >= 5 ? <div style={{ display: "flex", position: "absolute", left: r(w - priceW - pad - h * 0.5), top: r(-4 * s) }}><TagDesconto t={t} pct={pct} w={h * 0.5} s={s} /></div> : null}
    </div>
  );
}
