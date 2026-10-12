import type { ReactElement } from "react";
import { Antes, FONT_ANTON, Nome, Ph, Preco, Shell, Txt, abs, pct, r, uri, type BoxProps } from "./kit";
import { SVG_BOXES } from "./svg-data";

// Caixas montadas a partir de molduras em SVG (viewBox 900x1000). A moldura
// fica em duas camadas: base (sob a foto) e topo (etiquetas e selos sobre a foto).
// Foto, nome, preco e selo sao camadas vivas posicionadas pelos "slots".

type Slot = [number, number, number, number];

function useSlots(id: string, w: number, h: number) {
  const d = SVG_BOXES[id];
  const fx = w / 900;
  const fy = h / 1000;
  const box = (k: string, pad = 0) => {
    const s = d.slots[k] as Slot | undefined;
    if (!s) return null;
    return { x: s[0] * fx, y: s[1] * fy, w: s[2] * fx, h: s[3] * fy, pad };
  };
  return { d, fx, fy, box };
}

function Camadas({ id, w, h, under, over }: { id: string; w: number; h: number; under: ReactElement; over: ReactElement }): ReactElement {
  const d = SVG_BOXES[id];
  return (
    <Shell w={w} h={h}>
      <img src={uri(d.base)} width={r(w)} height={r(h)} style={{ position: "absolute", left: 0, top: 0, width: r(w), height: r(h) }} />
      {under}
      <img src={uri(d.top)} width={r(w)} height={r(h)} style={{ position: "absolute", left: 0, top: 0, width: r(w), height: r(h) }} />
      {over}
    </Shell>
  );
}

export function SvgBox01({ t, item, w, h }: BoxProps): ReactElement {
  const { box } = useSlots("cx01", w, h);
  const f = box("foto")!;
  const n = box("nome")!;
  const p = box("preco")!;
  const sel = box("selo")!;
  const pc = pct(item);
  return (
    <Camadas id="cx01" w={w} h={h} under={<Ph item={item} t={t} x={f.x} y={f.y} w={f.w} h={f.h} />} over={(
      <Shell w={w} h={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={abs(n.x, n.y, n.w, n.h, { alignItems: "center", justifyContent: "center" })}>
          <Nome item={item} w={n.w * 0.96} size={n.h * 0.62} color="#111111" lines={2} />
        </div>
        {pc ? (
          <div style={abs(p.x - p.w * 0.02, p.y - p.h * 0.1, p.w * 0.3, p.h * 0.22, { alignItems: "center" })}>
            <Antes item={item} size={p.h * 0.17} color="#FFFFFF" />
          </div>
        ) : null}
        <div style={abs(p.x, p.y + (pc ? p.h * 0.12 : 0), p.w, p.h, { alignItems: "center", justifyContent: "center" })}>
          <Preco item={item} maxW={p.w * 0.95} maxH={p.h * (pc ? 0.9 : 1.05)} color="#FFFFFF" accent="#FFFFFF" />
        </div>
        <div style={abs(sel.x, sel.y, sel.w, sel.h, { alignItems: "center", justifyContent: "center", transform: "rotate(-9deg)" })}>
          <Txt text={pc ? `-${pc}%` : "OFERTA"} size={sel.h * 0.78} color="#B80F18" font={FONT_ANTON} ls={1} />
        </div>
      </Shell>
    )} />
  );
}

export function SvgBox02({ t, item, w, h }: BoxProps): ReactElement {
  const { box } = useSlots("cx02", w, h);
  const f = box("foto")!;
  const n = box("nome")!;
  const p = box("preco")!;
  const sel = box("selo")!;
  const pc = pct(item);
  return (
    <Camadas id="cx02" w={w} h={h} under={<Ph item={item} t={t} x={f.x} y={f.y} w={f.w} h={f.h} />} over={(
      <Shell w={w} h={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={abs(n.x, n.y, n.w, n.h, { alignItems: "center", justifyContent: "center" })}>
          <Nome item={item} w={n.w} size={n.h * 0.95} color="#FFFFFF" lines={1} shadow={`0 ${r(3 * (w / 450))}px 0 rgba(0,40,10,0.6)`} />
        </div>
        <div style={abs(p.x, p.y, p.w, p.h, { alignItems: "center", justifyContent: "center" })}>
          <Preco item={item} maxW={p.w * 0.9} maxH={p.h * 0.62} color="#111111" />
        </div>
        <div style={abs(sel.x - sel.w * 0.1, sel.y, sel.w, sel.h, { alignItems: "center", justifyContent: "center", transform: "rotate(-30deg)" })}>
          <Txt text={pc ? `-${pc}%` : "OFERTA"} size={sel.h * 0.75} color="#D3121D" font={FONT_ANTON} />
        </div>
      </Shell>
    )} />
  );
}

export function SvgBox03({ t, item, w, h }: BoxProps): ReactElement {
  const { box } = useSlots("cx03", w, h);
  const f = box("foto")!;
  const n = box("nome")!;
  const p = box("preco")!;
  const ant = box("antes")!;
  const sel = box("selo")!;
  const pc = pct(item);
  return (
    <Camadas id="cx03" w={w} h={h} under={<Ph item={item} t={t} x={f.x} y={f.y} w={f.w} h={f.h} />} over={(
      <Shell w={w} h={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={abs(n.x, n.y, n.w, n.h, { alignItems: "center" })}>
          <Nome item={item} w={n.w} size={n.h * 0.7} color="#111111" align="flex-start" lines={2} gap={0.96} />
        </div>
        <div style={abs(p.x, p.y, p.w, p.h, { alignItems: "center", justifyContent: "center" })}>
          <Preco item={item} maxW={p.w * 0.95} maxH={p.h * 1.0} color="#FFFFFF" accent="#FFFFFF" />
        </div>
        {pc ? (
          <>
            <div style={abs(sel.x, sel.y + sel.h * 0.18, sel.w, sel.h * 0.5, { alignItems: "center", justifyContent: "center", transform: "rotate(-5deg)" })}>
              <Txt text={`-${pc}%`} size={sel.h * 0.4} color="#D3121D" font={FONT_ANTON} />
            </div>
            <div style={abs(ant.x - ant.w * 0.2, ant.y, ant.w * 1.2, ant.h, { alignItems: "center", justifyContent: "flex-end" })}>
              <Antes item={item} size={ant.h * 0.5} color="#222222" />
            </div>
          </>
        ) : (
          <div style={abs(sel.x, sel.y + sel.h * 0.2, sel.w, sel.h * 0.5, { alignItems: "center", justifyContent: "center", transform: "rotate(-5deg)" })}>
            <Txt text="OFERTA" size={sel.h * 0.2} color="#D3121D" font={FONT_ANTON} />
          </div>
        )}
      </Shell>
    )} />
  );
}
