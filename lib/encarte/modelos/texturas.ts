import { mix } from "../color";

// Texturas como imagem SVG (data URI). O renderizador do encarte desenha SVG
// com filtros (feTurbulence), então papel kraft, madeira e tela saem com
// aspecto de material de verdade, sem arquivo de imagem nenhum no repositório.
// Cada textura recebe a cor base e devolve só o fundo: o conteúdo vai por cima.

const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

function wrap(w: number, h: number, body: string) {
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`);
}

// papel kraft: base lisa + ruído fino + fibras e manchas bem suaves
export function kraft(w: number, h: number, base = "#d9c3a0") {
  const dark = mix(base, "#5a3d1c", 0.35);
  const light = mix(base, "#ffffff", 0.45);
  return wrap(
    w,
    h,
    `<defs>
      <filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7"/><feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.1  0 0 0 0.5 -0.12"/></filter>
      <filter id="f" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.08  0 0 0 0.55 -0.2"/></filter>
      <radialGradient id="v" cx="50%" cy="45%" r="75%"><stop offset="0.55" stop-color="${light}" stop-opacity="0"/><stop offset="1" stop-color="${dark}" stop-opacity="0.38"/></radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect width="${w}" height="${h}" filter="url(#f)" opacity="0.55"/>
    <rect width="${w}" height="${h}" filter="url(#n)" opacity="0.8"/>
    <rect width="${w}" height="${h}" fill="url(#v)"/>`
  );
}

// madeira em tábuas horizontais (tábua de prateleira, placa, mesa de feira)
export function madeira(w: number, h: number, base = "#a8743a", boards = 1) {
  const dark = mix(base, "#2b1608", 0.5);
  const seams: string[] = [];
  for (let i = 1; i < boards; i++) {
    const y = Math.round((h / boards) * i);
    seams.push(`<rect x="0" y="${y - 2}" width="${w}" height="4" fill="${dark}" opacity="0.7"/>`);
  }
  return wrap(
    w,
    h,
    `<defs>
      <filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.22" numOctaves="4" seed="11"/><feColorMatrix values="0 0 0 0 0.16  0 0 0 0 0.08  0 0 0 0 0.02  0 0 0 1.5 -0.35"/></filter>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.18"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect width="${w}" height="${h}" filter="url(#g)" opacity="0.85"/>
    ${seams.join("")}
    <rect width="${w}" height="${h}" fill="url(#s)"/>`
  );
}

// fundo liso com brilho de estúdio e granulação leve (cartaz moderno)
export function estudio(w: number, h: number, base: string, glow = 0.22) {
  const light = mix(base, "#ffffff", 0.35);
  const dark = mix(base, "#000000", 0.28);
  return wrap(
    w,
    h,
    `<defs>
      <radialGradient id="r" cx="50%" cy="30%" r="85%"><stop offset="0" stop-color="${light}" stop-opacity="${glow}"/><stop offset="1" stop-color="${dark}" stop-opacity="0.55"/></radialGradient>
      <filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.09 0"/></filter>
    </defs>
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect width="${w}" height="${h}" fill="url(#r)"/>
    <rect width="${w}" height="${h}" filter="url(#n)"/>`
  );
}

// raios abertos a partir de um ponto (fundo de explosão de oferta)
export function raios(w: number, h: number, a: string, b: string, cx = 0.5, cy = 0.4, n = 24) {
  const px = w * cx;
  const py = h * cy;
  const R = Math.hypot(w, h);
  const paths: string[] = [];
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 1) / n) * Math.PI * 2;
    paths.push(`<path d="M${px} ${py} L${px + Math.cos(a0) * R} ${py + Math.sin(a0) * R} L${px + Math.cos(a1) * R} ${py + Math.sin(a1) * R} Z" fill="${b}"/>`);
  }
  return wrap(w, h, `<rect width="${w}" height="${h}" fill="${a}"/>${paths.join("")}`);
}

// sombra suave embaixo do produto recortado (elipse difusa)
export function sombraChao(w: number, h: number, opacity = 0.35) {
  return wrap(
    w,
    h,
    `<defs><radialGradient id="o" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="${opacity}"/><stop offset="0.6" stop-color="#000" stop-opacity="${opacity * 0.4}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="url(#o)"/>`
  );
}
