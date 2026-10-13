#!/usr/bin/env python3
"""Importa emblemas ilustrados com fundo de recorte (magenta ou verde).

Uso: python3 scripts/importar-emblemas.py <pasta com catalogo.json e PNGs> [saida=public/emblemas]
Para cada PNG: tira o fundo (chroma key com bordas suaves e cor corrigida),
corta o espaço vazio, reduz a no máximo 880 px de largura e grava
<slug>.png (PNG com paleta, leve) e t/<slug>.webp (miniatura de 440 px).
Imprime o slug e o grupo de cada peça em JSON para montar o catálogo.
"""
import json, os, re, sys, unicodedata
import numpy as np
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "public/emblemas"
os.makedirs(os.path.join(out, "t"), exist_ok=True)

def slugify(s):
    s = unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def key_alpha(rgb, key):
    c = rgb.astype(np.float32)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if key == "#00FF00":
        k = g - np.maximum(r, b)
        kc = np.array([0, 255, 0], np.float32)
    else:
        k = np.minimum(r, b) - g
        kc = np.array([255, 0, 255], np.float32)
    k = np.clip(k, 0, 255)
    a = np.where(k < 30, 1.0, np.clip(1.0 - (k - 30) / 150.0, 0, 1))
    a = np.where(k >= 180, 0.0, a)
    fg = c.copy()
    m = (a > 0.04) & (a < 1)
    aa = a[..., None]
    un = (c - (1 - aa) * kc) / np.maximum(aa, 0.04)
    fg = np.where(m[..., None], np.clip(un, 0, 255), fg)
    return fg.astype(np.uint8), (a * 255).astype(np.uint8)

cat = json.load(open(os.path.join(src, "catalogo.json")))
pastas = {}
for root, _, files in os.walk(src):
    for f in files:
        if f.endswith(".png"):
            pastas[f] = root
res = []
for e in cat:
    f = e["filename"]
    im = Image.open(os.path.join(pastas[f], f)).convert("RGB")
    rgb = np.array(im)
    fg, a = key_alpha(rgb, e["background"])
    rgba = np.dstack([fg, a])
    ys, xs = np.where(a > 12)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = int(0.02 * max(x1 - x0, y1 - y0))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(rgba.shape[1] - 1, x1 + pad), min(rgba.shape[0] - 1, y1 + pad)
    img = Image.fromarray(rgba[y0:y1 + 1, x0:x1 + 1], "RGBA")
    if img.width > 880:
        img = img.resize((880, round(img.height * 880 / img.width)), Image.LANCZOS)
    slug = slugify(e["name"])
    q = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(os.path.join(out, slug + ".png"), optimize=True)
    th = img.resize((440, round(img.height * 440 / img.width)), Image.LANCZOS)
    th.save(os.path.join(out, "t", slug + ".webp"), quality=82, method=6)
    res.append({"index": e["index"], "slug": slug, "nome": e["name"], "priority": e["priority"], "w": img.width, "h": img.height})
    print(slug, img.size, os.path.getsize(os.path.join(out, slug + ".png")) // 1024, "KB", file=sys.stderr)
json.dump(res, open(os.path.join(os.environ.get("TMPDIR", "/tmp"), "emblemas-importados.json"), "w"), ensure_ascii=False, indent=1)
