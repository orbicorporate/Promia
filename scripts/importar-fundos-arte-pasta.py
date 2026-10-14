# Importa uma pasta de artes de fundo (PNG 1122x1402 nomeados NN-Nome-do-tema.png)
# como fundos de arte, a partir do id arNN (NN = inicio). Mesmo recorte e medidas de
# importar-fundos-arte.py. Uso:
#   python3 scripts/importar-fundos-arte-pasta.py <pasta> <inicio> <saida.json> [--so-medir]
# Corte manual: arquivo cortes.json na pasta, {"slug": [cut, footerTop]}.
import json, os, re, sys, unicodedata
import numpy as np
from PIL import Image

PASTA, INICIO, OUT = sys.argv[1], int(sys.argv[2]), sys.argv[3]
SO_MEDIR = "--so-medir" in sys.argv
F, FOLGA = 56, 28
hexc = lambda c: "#%02x%02x%02x" % tuple(int(round(v)) for v in c)
smooth = lambda t: (lambda x: x * x * (3 - 2 * x))(np.clip(t, 0, 1))
manual = json.load(open(os.path.join(PASTA, "cortes.json"))) if os.path.exists(os.path.join(PASTA, "cortes.json")) else {}

def slugify(n):
    n = unicodedata.normalize("NFD", n).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", n).strip("-")

def faixa(im, y, n=9):
    W = im.shape[1]
    return [hexc(im[y:y + 6, int(i * (W - 40) / (n - 1)):int(i * (W - 40) / (n - 1)) + 40].reshape(-1, 3).mean(0)) for i in range(n)]

arquivos = sorted(f for f in os.listdir(PASTA) if re.match(r"\d+-.+\.png$", f))
meta = {}
for idx, nome in enumerate(arquivos):
    m = re.match(r"(\d+)-(.+)\.png$", nome)
    titulo = m.group(2).replace("-", " ")
    titulo = titulo[0].upper() + titulo[1:]
    slug = slugify(m.group(2))
    im = np.asarray(Image.open(os.path.join(PASTA, nome)).convert("RGB")).astype(float)
    H, W, _ = im.shape
    y0, y1 = int(.5 * H), int(.86 * H)
    med = np.median(im[y0:y1, int(.15 * W):int(.85 * W)], axis=1)
    ys = np.arange(y0, y1)
    co = [np.polyfit(ys, med[:, c], 2) for c in range(3)]
    rowb = np.stack([np.polyval(co[c], np.arange(H)) for c in range(3)], axis=1)
    d = np.sqrt(((im - rowb[:, None, :]) ** 2).sum(2))
    cnt = (d > 26).sum(1)
    resid = float(d[y0:y1].mean())
    # corpo liso, enfeite com borda: linhas com vários pontos de gradiente forte
    gx = np.abs(np.diff(im, axis=1)).sum(2)[:-1, :]
    gy = np.abs(np.diff(im, axis=0)).sum(2)[:, :-1]
    gg = gx + gy
    tex = (gg > 22).sum(1)
    cut = max(y for y in range(0, int(.5 * H)) if tex[y] >= 8) + 1
    ft = min(y for y in range(int(.5 * H), H - 2) if tex[y] >= 8)
    if slug in manual:
        cut, ft = manual[slug]
    cut -= FOLGA
    meta[slug] = dict(id="ar%02d" % (INICIO + idx), nome=titulo, w=W, cut=int(cut), ft=int(ft), resid=round(resid, 1), arquivo=nome)
    print(meta[slug]["id"], slug, cut, ft, round(resid, 1))
    if SO_MEDIR:
        continue
    top = np.dstack([im[: cut + F], np.ones((cut + F, W)) * 255])
    top[:, :, 3] = 255 * (1 - smooth((np.arange(cut + F) - cut) / F))[:, None]
    Image.fromarray(top.astype(np.uint8), "RGBA").save(f"public/fundos/arte/{slug}-topo.webp", quality=92, method=6)
    bh = H - (ft - F)
    base = np.dstack([im[ft - F:], np.ones((bh, W)) * 255])
    base[:, :, 3] = 255 * smooth(np.arange(bh) / F)[:, None]
    Image.fromarray(base.astype(np.uint8), "RGBA").save(f"public/fundos/arte/{slug}-base.webp", quality=92, method=6)
    lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    corpo = im[(cut + ft) // 2 - 20:(cut + ft) // 2 + 20, int(.3 * W):int(.7 * W)].reshape(-1, 3).mean(0)
    faixaB = im[H - 14:H - 2].reshape(-1, 3).mean(0)
    corpo2 = lambda y, a, b: im[y - 20:y + 20, int(a * W):int(b * W)].reshape(-1, 3).mean(0)
    ym = (cut + ft) // 2
    radial = [hexc((corpo2(ym, .46, .54))), hexc((corpo2(ym, .22, .28) + corpo2(ym, .72, .78)) / 2), hexc((corpo2(ym, .0, .03) + corpo2(ym, .97, 1.0)) / 2)]
    meta[slug].update(modo='fino', radial=radial, topoH=int(cut + F), baseH=int(bh), fade=F, topo=faixa(im, cut + F, 9), base=faixa(im, ft - F - 6, 9), meio=hexc(corpo), claro=bool(lum(corpo) > 140), faixaClara=bool(lum(faixaB) > 150))
json.dump(meta, open(OUT, "w"), indent=1, ensure_ascii=False)
