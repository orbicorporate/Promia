#!/usr/bin/env python3
"""Importa uma pasta de PNGs de emblemas (nome do arquivo = slug) com fundo magenta ou verde.

Uso: python3 scripts/importar-emblemas-pasta.py <pasta> [saida=public/emblemas]
Detecta a cor do fundo pelos cantos, tira o fundo (chroma key com borda suave),
corta o vazio, limita a 880 px e grava <slug>.png e t/<slug>.webp.
Imprime uma linha JSON por peça com slug, fundo e tamanho.
"""
import json, os, sys
import numpy as np
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "public/emblemas"
os.makedirs(os.path.join(out, "t"), exist_ok=True)

def key_alpha(rgb, key):
    c = rgb.astype(np.float32)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    if key == "verde":
        k = g - np.maximum(r, b)
        kc = np.array([0, 255, 0], np.float32)
    else:
        k = np.minimum(r, b) - g
        kc = np.array([255, 0, 255], np.float32)
    k = np.clip(k, 0, 255)
    a = np.where(k < 30, 1.0, np.clip(1.0 - (k - 30) / 150.0, 0, 1))
    a = np.where(k >= 180, 0.0, a)
    m = (a > 0.04) & (a < 1)
    un = (c - (1 - a[..., None]) * kc) / np.maximum(a[..., None], 0.04)
    fg = np.where(m[..., None], np.clip(un, 0, 255), c)
    return fg.astype(np.uint8), (a * 255).astype(np.uint8)

def fundo(rgb):
    h, w, _ = rgb.shape
    cantos = np.concatenate([rgb[:20, :20].reshape(-1, 3), rgb[:20, -20:].reshape(-1, 3), rgb[-20:, :20].reshape(-1, 3), rgb[-20:, -20:].reshape(-1, 3)]).mean(0)
    return "verde" if cantos[1] > 150 and cantos[0] < 120 else "magenta"

for f in sorted(os.listdir(src)):
    if not f.endswith(".png"):
        continue
    slug = f[:-4]
    rgb = np.array(Image.open(os.path.join(src, f)).convert("RGB"))
    key = fundo(rgb)
    fg, a = key_alpha(rgb, key)
    rgba = np.dstack([fg, a])
    ys, xs = np.where(a > 12)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = int(0.02 * max(x1 - x0, y1 - y0))
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(rgba.shape[1] - 1, x1 + pad), min(rgba.shape[0] - 1, y1 + pad)
    img = Image.fromarray(rgba[y0:y1 + 1, x0:x1 + 1], "RGBA")
    if img.width > 880:
        img = img.resize((880, round(img.height * 880 / img.width)), Image.LANCZOS)
    q = img.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
    q.save(os.path.join(out, slug + ".png"), optimize=True)
    th = img.resize((440, round(img.height * 440 / img.width)), Image.LANCZOS)
    th.save(os.path.join(out, "t", slug + ".webp"), quality=82, method=6)
    print(json.dumps({"slug": slug, "fundo": key, "w": img.width, "h": img.height, "kb": os.path.getsize(os.path.join(out, slug + ".png")) // 1024}))
