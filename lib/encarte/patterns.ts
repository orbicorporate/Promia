import type { PatternKind } from "./themes";

// Padrões decorativos dos temas, desenhados como SVG simples (formas
// básicas, sem <pattern>, filtro ou texto) e usados como imagem de fundo
// em data URI: é o jeito confiável de ter decoração no Satori, que só
// entende flexbox. Tudo determinístico (mesma entrada, mesmo desenho) para
// a prévia não "pular" a cada atualização.

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

function shapes(kind: PatternKind, w: number, h: number, color: string, opacity: number): string {
  const rand = rng(w * 31 + h * 17 + kind.length * 7);
  const out: string[] = [];
  const fill = `fill="${color}" fill-opacity="${opacity}"`;

  switch (kind) {
    case "raios": {
      // explosão de raios saindo do canto direito (clássico de oferta)
      const cx = w * 0.82;
      const cy = h * 0.5;
      const R = Math.hypot(w, h);
      const n = 28;
      for (let i = 0; i < n; i += 2) {
        const a1 = (i / n) * Math.PI * 2;
        const a2 = ((i + 1) / n) * Math.PI * 2;
        out.push(
          `<path d="M${r1(cx)} ${r1(cy)} L${r1(cx + R * Math.cos(a1))} ${r1(cy + R * Math.sin(a1))} L${r1(cx + R * Math.cos(a2))} ${r1(cy + R * Math.sin(a2))} Z" ${fill}/>`
        );
      }
      break;
    }
    case "listras": {
      const step = 56;
      for (let x = -h; x < w + h; x += step) {
        out.push(`<path d="M${x} ${h} L${x + h} 0 L${x + h + step / 2} 0 L${x + step / 2} ${h} Z" ${fill}/>`);
      }
      break;
    }
    case "bolinhas": {
      const step = 46;
      for (let y = 12, row = 0; y < h + step; y += step * 0.86, row++) {
        for (let x = row % 2 ? step / 2 : 0; x < w + step; x += step) out.push(`<circle cx="${r1(x)}" cy="${r1(y)}" r="7" ${fill}/>`);
      }
      break;
    }
    case "bolhas": {
      const n = Math.round((w * h) / 9000);
      for (let i = 0; i < n; i++) {
        const r = 6 + rand() * 30;
        out.push(
          `<circle cx="${r1(rand() * w)}" cy="${r1(rand() * h)}" r="${r1(r)}" fill="none" stroke="${color}" stroke-opacity="${opacity * 1.6}" stroke-width="${r1(2 + r / 10)}"/>`
        );
      }
      break;
    }
    case "confete": {
      const palette = [color, "#FF4F79", "#3DD6F5", "#7CE36B", "#FFFFFF"];
      const n = Math.round((w * h) / 4200);
      for (let i = 0; i < n; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const c = palette[Math.floor(rand() * palette.length)];
        const rot = Math.round(rand() * 180);
        const f = `fill="${c}" fill-opacity="${Math.min(1, opacity * 2.2)}"`;
        out.push(
          rand() > 0.5
            ? `<rect x="${r1(x)}" y="${r1(y)}" width="18" height="7" rx="2" ${f} transform="rotate(${rot} ${r1(x + 9)} ${r1(y + 3.5)})"/>`
            : `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(3 + rand() * 4)}" ${f}/>`
        );
      }
      break;
    }
    case "folhas": {
      const n = Math.round((w * h) / 11000);
      for (let i = 0; i < n; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = 18 + rand() * 26;
        const rot = Math.round(rand() * 360);
        out.push(
          `<path d="M0 0 C ${r1(s * 0.6)} ${r1(-s * 0.5)} ${r1(s * 1.4)} ${r1(-s * 0.3)} ${r1(s * 2)} 0 C ${r1(s * 1.4)} ${r1(s * 0.3)} ${r1(s * 0.6)} ${r1(s * 0.5)} 0 0 Z" ${fill} transform="translate(${r1(x)} ${r1(y)}) rotate(${rot})"/>`
        );
      }
      break;
    }
    case "xadrez": {
      const step = 40;
      for (let y = 0, row = 0; y < h; y += step, row++) {
        for (let x = row % 2 ? step : 0; x < w; x += step * 2) out.push(`<rect x="${x}" y="${y}" width="${step}" height="${step}" ${fill}/>`);
      }
      break;
    }
    case "coracoes": {
      const n = Math.round((w * h) / 12000);
      for (let i = 0; i < n; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = (12 + rand() * 18) / 10;
        const rot = Math.round(rand() * 50 - 25);
        out.push(
          `<path d="M0 3 C 0 -1 -6 -3 -8 1 C -10 5 -4 9 0 12 C 4 9 10 5 8 1 C 6 -3 0 -1 0 3 Z" ${fill} transform="translate(${r1(x)} ${r1(y)}) rotate(${rot}) scale(${r1(s * 1.6)})"/>`
        );
      }
      break;
    }
    case "estrelas": {
      const n = Math.round((w * h) / 9000);
      for (let i = 0; i < n; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = 4 + rand() * 10;
        const pts: string[] = [];
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
          const rr = k % 2 ? s * 0.42 : s;
          pts.push(`${r1(x + rr * Math.cos(a))},${r1(y + rr * Math.sin(a))}`);
        }
        out.push(`<polygon points="${pts.join(" ")}" ${fill}/>`);
      }
      break;
    }
    case "ovos": {
      const palette = [color, "#FFE08A", "#A8E6CF", "#B8C8FF"];
      const n = Math.round((w * h) / 14000);
      for (let i = 0; i < n; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const s = 12 + rand() * 14;
        const c = palette[Math.floor(rand() * palette.length)];
        out.push(
          `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(s * 0.78)}" ry="${r1(s)}" fill="${c}" fill-opacity="${Math.min(1, opacity * 1.8)}" transform="rotate(${Math.round(rand() * 40 - 20)} ${r1(x)} ${r1(y)})"/>`
        );
      }
      break;
    }
    case "bandeirinhas": {
      const palette = [color, "#E3262E", "#1F9D55", "#1F6FB2", "#FFFFFF"];
      for (let line = 0; line < 3; line++) {
        const y0 = 6 + line * (h / 3);
        const sag = 18;
        out.push(`<path d="M0 ${r1(y0)} Q ${r1(w / 2)} ${r1(y0 + sag * 2)} ${w} ${r1(y0)}" fill="none" stroke="#FFFFFF" stroke-opacity="${opacity * 1.5}" stroke-width="2"/>`);
        const fw = 34;
        for (let x = 10 + (line % 2) * 20, k = 0; x < w - fw; x += fw + 12, k++) {
          const t = (x + fw / 2) / w;
          const y = y0 + 4 * sag * t * (1 - t);
          const c = palette[(k + line) % palette.length];
          out.push(
            `<path d="M${r1(x)} ${r1(y)} L${r1(x + fw)} ${r1(y)} L${r1(x + fw)} ${r1(y + 40)} L${r1(x + fw / 2)} ${r1(y + 28)} L${r1(x)} ${r1(y + 40)} Z" fill="${c}" fill-opacity="${Math.min(1, opacity * 2)}"/>`
          );
        }
      }
      break;
    }
  }
  return out.join("");
}

export function patternSvg(kind: PatternKind, width: number, height: number, color: string, opacity = 0.18): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${shapes(kind, w, h, color, opacity)}</svg>`;
}

export function patternDataUri(kind: PatternKind, width: number, height: number, color: string, opacity = 0.18): string {
  return `data:image/svg+xml;base64,${Buffer.from(patternSvg(kind, width, height, color, opacity)).toString("base64")}`;
}
