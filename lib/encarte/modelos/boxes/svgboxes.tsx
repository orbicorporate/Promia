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
      {d.top ? <img src={uri(d.top)} width={r(w)} height={r(h)} style={{ position: "absolute", left: 0, top: 0, width: r(w), height: r(h) }} /> : null}
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

// ---- cx04..cx24: componente guiado por dados ----
type Cfg = {
  nome: string; preco: string; accent?: string; antes?: string; selo?: string;
  align?: "center" | "flex-start"; lines?: number; nameK?: number; priceK?: number; shadow?: boolean;
};

const CFG: Record<string, Cfg> = {
  cx04: { nome: "#F3D98B", preco: "#141414", selo: "#141414", nameK: 0.5 },
  cx05: { nome: "#FFFFFF", preco: "#0A2F6E", align: "flex-start" },
  cx06: { nome: "#7A2E00", preco: "#FFFFFF", accent: "#FFFFFF" },
  cx07: { nome: "#5A1015", preco: "#F5E6C8", accent: "#F5E6C8" },
  cx08: { nome: "#0B2E4B", preco: "#FFFFFF", accent: "#FFFFFF", align: "flex-start" },
  cx09: { nome: "#2A0050", preco: "#2A0050", accent: "#2A0050" },
  cx10: { nome: "#FFFFFF", preco: "#FFFFFF", accent: "#F2D675", nameK: 0.6 },
  cx11: { nome: "#FFFFFF", preco: "#FFFFFF", accent: "#FFFFFF" },
  cx12: { nome: "#0B2A6B", preco: "#FFFFFF", accent: "#FFFFFF", align: "flex-start" },
  cx13: { nome: "#1A1A1A", preco: "#1A1A1A", accent: "#1A1A1A", align: "flex-start" },
  cx14: { nome: "#FFFFFF", preco: "#2F4A2A", accent: "#2F4A2A", align: "flex-start" },
  cx15: { nome: "#0E2F5A", preco: "#0E2F5A", accent: "#0E2F5A" },
  cx16: { nome: "#5A0F1B", preco: "#FFFFFF", accent: "#FFFFFF", align: "flex-start" },
  cx17: { nome: "#E8D3A2", preco: "#E8D3A2", accent: "#E8D3A2" },
  cx18: { nome: "#FFFFFF", preco: "#FFFFFF", accent: "#FFFFFF" },
  cx19: { nome: "#7A2F12", preco: "#FFFFFF", accent: "#FFFFFF" },
  cx20: { nome: "#1F4D2E", preco: "#1F4D2E", accent: "#1F4D2E", align: "flex-start" },
  cx21: { nome: "#1A1A1A", preco: "#D3121D", accent: "#D3121D", selo: "#FFFFFF" },
  cx22: { nome: "#3A2A22", preco: "#3A2A22", accent: "#3A2A22" },
  cx23: { nome: "#12544F", preco: "#12544F", accent: "#12544F", align: "flex-start" },
  cx24: { nome: "#3A2A22", preco: "#B8481A", accent: "#B8481A" },
};

export function SvgBoxN({ id, t, item, w, h }: BoxProps & { id: string }): ReactElement {
  const { box } = useSlots(id, w, h);
  const c = CFG[id];
  const f = box("foto")!;
  const n = box("nome")!;
  const p = box("preco")!;
  const sel = box("selo");
  const pc = pct(item);
  const al = c.align ?? "center";
  return (
    <Camadas id={id} w={w} h={h} under={<Ph item={item} t={t} x={f.x} y={f.y} w={f.w} h={f.h} />} over={(
      <Shell w={w} h={h} style={{ position: "absolute", left: 0, top: 0 }}>
        <div style={abs(n.x, n.y, n.w, n.h, { alignItems: "center", justifyContent: al === "center" ? "center" : "flex-start" })}>
          <Nome item={item} w={n.w} size={n.h * (c.nameK ?? (n.h > 120 ? 0.3 : n.w < 250 ? 0.5 : 0.85))} color={c.nome} align={al} lines={n.h > 120 ? 3 : n.w < 250 ? 2 : 1} gap={0.96} />
        </div>
        <div style={abs(p.x, p.y, p.w, p.h, { alignItems: "center", justifyContent: al === "center" ? "center" : "flex-start" })}>
          <Preco item={item} maxW={p.w * 0.95} maxH={p.h * 1.02} color={c.preco} accent={c.accent} />
        </div>
        {sel ? (
          <div style={abs(sel.x, sel.y, sel.w, sel.h, { alignItems: "center", justifyContent: "center" })}>
            <Txt text={pc ? `-${pc}%` : "OFERTA"} size={sel.h * 0.7} color={c.selo ?? "#141414"} font={FONT_ANTON} ls={1} />
          </div>
        ) : null}
      </Shell>
    )} />
  );
}
