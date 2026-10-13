import sharp from "sharp";

// Recorte de fundo das fotos de produto, para o produto poder ficar por cima
// de etiquetas, madeira, papel kraft e cores, como nos encartes profissionais.
//
// Foto de produto de banco de imagem e de site de mercado quase sempre vem
// sobre fundo branco ou cinza bem claro (com uma sombra suave embaixo). O
// recorte preenche a partir das bordas tudo que parece fundo e deixa o
// produto com transparência. Foto de ambiente (fundo colorido, mão, prateleira)
// não é recortada: devolve null e a foto segue retangular.
//
// Funciona nos pixels (sem IA e sem serviço externo), então é barato e roda
// na mesma função que desenha o encarte.

export type CutoutOptions = {
  maxSize?: number; // maior lado da saída
  tolerance?: number; // diferença máxima de cor para o fundo, por canal (0-255)
};

type Rgba = { data: Buffer; width: number; height: number };

const idx = (x: number, y: number, w: number) => (y * w + x) * 4;

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? 0;
}

// cor de fundo estimada pela mediana da moldura de 2px da imagem
function borderColor(img: Rgba): { r: number; g: number; b: number; solidShare: number } {
  const { data, width: w, height: h } = img;
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const take = (x: number, y: number) => {
    const i = idx(x, y, w);
    rs.push(data[i]);
    gs.push(data[i + 1]);
    bs.push(data[i + 2]);
  };
  for (let x = 0; x < w; x++) {
    take(x, 0);
    take(x, 1);
    take(x, h - 1);
    take(x, h - 2);
  }
  for (let y = 2; y < h - 2; y++) {
    take(0, y);
    take(1, y);
    take(w - 1, y);
    take(w - 2, y);
  }
  const r = median(rs);
  const g = median(gs);
  const b = median(bs);
  let near = 0;
  for (let i = 0; i < rs.length; i++) if (Math.max(Math.abs(rs[i] - r), Math.abs(gs[i] - g), Math.abs(bs[i] - b)) <= 18) near++;
  return { r, g, b, solidShare: near / rs.length };
}

export function cutoutPixels(img: Rgba, tolerance = 34): Rgba | null {
  const { data, width: w, height: h } = img;
  const bg = borderColor(img);
  const luma = 0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b;
  // só recorta quando a moldura é de fato um fundo liso e claro
  if (bg.solidShare < 0.85 || luma < 205) return null;

  const rawDist = (i: number) => Math.max(Math.abs(data[i] - bg.r), Math.abs(data[i + 1] - bg.g), Math.abs(data[i + 2] - bg.b));
  // sombra de contato (cinza neutro e claro) conta como fundo: o encarte desenha a sua própria sombra
  const isShadow = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const spread = Math.max(r, g, b) - Math.min(r, g, b);
    return spread <= 14 && 0.299 * r + 0.587 * g + 0.114 * b >= 190;
  };
  const dist = (i: number) => (isShadow(i) ? 0 : rawDist(i));
  const isBg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (x: number, y: number) => {
    const p = y * w + x;
    if (isBg[p]) return;
    if (dist(p * 4) > tolerance) return;
    isBg[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) push(x - 1, y);
    if (x < w - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y < h - 1) push(x, y + 1);
  }
  const removed = tail / (w * h);
  // quase nada ou quase tudo removido: o recorte não é confiável
  if (removed < 0.1 || removed > 0.93) return null;

  const out = Buffer.from(data);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (isBg[p]) {
        out[i + 3] = 0;
        continue;
      }
      // borda do produto: transparência gradual, para não ficar serrilhado nem com halo branco
      const touchesBg = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
      if (touchesBg) {
        const d = dist(i);
        const a = Math.max(0, Math.min(1, (d - tolerance * 0.5) / (tolerance * 1.6)));
        out[i + 3] = Math.round(255 * a);
        // tira a contaminação de branco da borda puxando a cor para longe do fundo
        if (a < 1 && a > 0) {
          for (let c = 0; c < 3; c++) {
            const bgc = c === 0 ? bg.r : c === 1 ? bg.g : bg.b;
            out[i + c] = Math.max(0, Math.min(255, Math.round((out[i + c] - bgc * (1 - a)) / a)));
          }
        }
      }
      if (out[i + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  // recorta a área vazia em volta, deixando uma folga pequena
  const padX = Math.round((maxX - minX) * 0.03);
  const padY = Math.round((maxY - minY) * 0.03);
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(w - 1, maxX + padX);
  const y1 = Math.min(h - 1, maxY + padY);
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.copy(cropped, y * cw * 4, idx(x0, y0 + y, w), idx(x0, y0 + y, w) + cw * 4);
  return { data: cropped, width: cw, height: ch };
}


// Segunda tentativa, para fundo que não é liso: estúdio com vinheta, degradê
// cinza, sombra grande. O fundo é tudo que é neutro (cinza ou branco) e liga
// à borda passando só por pequenas mudanças de um pixel para o vizinho. O
// produto, quase sempre colorido ou bem mais escuro, para o preenchimento.
export function cutoutGradient(img: Rgba): Rgba | null {
  const { data, width: w, height: h } = img;
  const spreadAt = (i: number) => Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
  const lumaAt = (i: number) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  const neutral = (i: number) => spreadAt(i) <= 30 && lumaAt(i) >= 110;

  // a moldura precisa ser de fato um fundo neutro
  let ok = 0;
  let total = 0;
  const edge = (x: number, y: number) => {
    total++;
    if (neutral(idx(x, y, w))) ok++;
  };
  for (let x = 0; x < w; x++) {
    edge(x, 0);
    edge(x, h - 1);
  }
  for (let y = 1; y < h - 1; y++) {
    edge(0, y);
    edge(w - 1, y);
  }
  if (ok / total < 0.85) return null;

  const isBg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const STEP = 9;
  const tryPush = (from: number, x: number, y: number) => {
    const p = y * w + x;
    if (isBg[p]) return;
    const i = p * 4;
    if (!neutral(i)) return;
    if (from >= 0) {
      const j = from * 4;
      if (Math.max(Math.abs(data[i] - data[j]), Math.abs(data[i + 1] - data[j + 1]), Math.abs(data[i + 2] - data[j + 2])) > STEP) return;
    }
    isBg[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < w; x++) {
    tryPush(-1, x, 0);
    tryPush(-1, x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(-1, 0, y);
    tryPush(-1, w - 1, y);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    const y = (p - x) / w;
    if (x > 0) tryPush(p, x - 1, y);
    if (x < w - 1) tryPush(p, x + 1, y);
    if (y > 0) tryPush(p, x, y - 1);
    if (y < h - 1) tryPush(p, x, y + 1);
  }
  const removed = tail / (w * h);
  if (removed < 0.1 || removed > 0.975) return null;

  const out = Buffer.from(data);
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (isBg[p]) {
        out[i + 3] = 0;
        continue;
      }
      const touches = (x > 0 && isBg[p - 1]) || (x < w - 1 && isBg[p + 1]) || (y > 0 && isBg[p - w]) || (y < h - 1 && isBg[p + w]);
      if (touches) out[i + 3] = 100; // borda suave, sem serrilhado
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  // o produto precisa ocupar uma parte razoável da foto, senão o recorte errou
  if ((maxX - minX + 1) * (maxY - minY + 1) < w * h * 0.04) return null;
  const padX = Math.round((maxX - minX) * 0.03);
  const padY = Math.round((maxY - minY) * 0.03);
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const cw = Math.min(w - 1, maxX + padX) - x0 + 1;
  const ch = Math.min(h - 1, maxY + padY) - y0 + 1;
  const cropped = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) out.copy(cropped, y * cw * 4, idx(x0, y0 + y, w), idx(x0, y0 + y, w) + cw * 4);
  return { data: cropped, width: cw, height: ch };
}

// bytes de uma foto (png, jpeg, webp...) -> PNG recortado, ou null se a foto não for recortável
export async function cutoutProductPhoto(input: Uint8Array | Buffer, opts: CutoutOptions = {}): Promise<Buffer | null> {
  const { maxSize = 720, tolerance = 34 } = opts;
  try {
    const { data, info } = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: maxSize, height: maxSize, fit: "inside", withoutEnlargement: true })
      .flatten({ background: "#ffffff" }) // PNG com transparência já pronta vira fundo branco e segue o mesmo caminho
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const raw = { data, width: info.width, height: info.height };
    const cut = cutoutPixels(raw, tolerance) ?? cutoutGradient(raw);
    if (!cut) return null;
    return await sharp(cut.data, { raw: { width: cut.width, height: cut.height, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toBuffer();
  } catch {
    return null;
  }
}
