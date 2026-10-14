# Recorta cabeçalho e rodapé das 20 artes de fundo (PNG 1122x1402) e mede as
# cores do corpo. Uso: python3 scripts/importar-fundos-arte.py <pasta-com-os-png> <saida.json>
# O mapa arquivo -> tema está em ARTES abaixo. Gera public/fundos/arte/<slug>-topo.webp e -base.webp.
import json, sys
import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
ARTES = "04b03123 b0128003 cf540281 ab57864e 5a0e1a35 403abc29 ea03f10e dbaa45be 1c2d3213 a0e1e067 d4c93449 55b59f6f d9e459c7 406df03e 46c5e39c 894fe5b6 eaa01c22 00ca4e5a 0a47c3d6 a5e53de5".split()
SLUGS = "leite queijos carnes vinhos sorvete cerveja churrasco mulher limpeza mercado natal carnaval junina pascoa infantil padaria maes reveillon aniversario blackfriday".split()
MANUAL = {"cerveja": (455, 1290), "reveillon": (470, 1290), "blackfriday": (410, 1280), "carnaval": (451, 1285)}
F = 56
FOLGA = 28
hexc = lambda c: "#%02x%02x%02x" % tuple(int(round(v)) for v in c)

def smooth(t):
    t = np.clip(t, 0, 1)
    return t * t * (3 - 2 * t)

def faixa(im, y, n=9):
    # n cores ao longo da largura, média de 6 linhas
    W = im.shape[1]
    out = []
    for i in range(n):
        x0 = int(i * (W - 40) / (n - 1))
        out.append(hexc(im[y:y + 6, x0:x0 + 40].reshape(-1, 3).mean(0)))
    return out

meta = {}
for k, s in zip(ARTES, SLUGS):
    pil = Image.open(f"{SRC}/{k}-image.png").convert("RGB")
    im = np.asarray(pil).astype(float)
    H, W, _ = im.shape
    y0, y1 = int(.5 * H), int(.86 * H)
    med = np.median(im[y0:y1, int(.15 * W):int(.85 * W)], axis=1)
    ys = np.arange(y0, y1)
    co = [np.polyfit(ys, med[:, c], 2) for c in range(3)]
    rowb = np.stack([np.polyval(co[c], np.arange(H)) for c in range(3)], axis=1)
    d = np.sqrt(((im - rowb[:, None, :]) ** 2).sum(2))
    cnt = (d > 26).sum(1)
    cut = max(y for y in range(0, int(.55 * H)) if cnt[y] >= 6) + 1
    ft = min(y for y in range(int(.5 * H), H) if cnt[y] >= 6)
    if s in MANUAL:
        cut, ft = MANUAL[s]
    cut -= FOLGA
    # topo
    top = np.dstack([im[: cut + F], np.ones((cut + F, W)) * 255])
    top[:, :, 3] = 255 * (1 - smooth((np.arange(cut + F) - cut) / F))[:, None]
    Image.fromarray(top.astype(np.uint8), "RGBA").save(f"public/fundos/arte/{s}-topo.webp", quality=92, method=6)
    # base
    bh = H - (ft - F)
    base = np.dstack([im[ft - F:], np.ones((bh, W)) * 255])
    base[:, :, 3] = 255 * smooth(np.arange(bh) / F)[:, None]
    Image.fromarray(base.astype(np.uint8), "RGBA").save(f"public/fundos/arte/{s}-base.webp", quality=92, method=6)
    lum = lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    corpo = im[(cut + ft) // 2 - 20:(cut + ft) // 2 + 20, int(.3 * W):int(.7 * W)].reshape(-1, 3).mean(0)
    faixaB = im[H - 14:H - 2].reshape(-1, 3).mean(0)
    meta[s] = dict(
        w=W, cut=int(cut), topoH=int(cut + F), baseH=int(bh), fade=F,
        topo=faixa(im, cut + F, 9), base=faixa(im, ft - F - 6, 9),
        meio=hexc(corpo), claro=bool(lum(corpo) > 140), faixaClara=bool(lum(faixaB) > 150),
    )
    print(s, cut, ft, meta[s]["meio"], meta[s]["claro"], meta[s]["faixaClara"])
json.dump(meta, open(OUT, "w"), indent=1)
