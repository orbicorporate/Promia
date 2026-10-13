import { describe, expect, it } from "vitest";

describe("cutoutGradient", () => {
  it("recorta produto colorido sobre fundo cinza com degradê", async () => {
    const { cutoutGradient } = await import("@/lib/encarte/cutout");
    const w = 100;
    const h = 100;
    const data = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const dist = Math.hypot(x - 50, y - 50) / 70;
        const v = Math.round(255 - dist * 90);
        const inside = x >= 30 && x < 70 && y >= 30 && y < 70;
        data[i] = inside ? 220 : v;
        data[i + 1] = inside ? 40 : v;
        data[i + 2] = inside ? 30 : v;
        data[i + 3] = 255;
      }
    const cut = cutoutGradient({ data, width: w, height: h });
    expect(cut).not.toBeNull();
    expect(cut!.width).toBeLessThan(60);
    expect(cut!.width).toBeGreaterThanOrEqual(40);
  });
});
