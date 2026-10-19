import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FUNDOS_ARTE, fundoArtePorId } from "@/lib/encarte/modelos/fundos-arte";
import { isEncarteFundo } from "@/lib/encarte/types";

describe("fundos de arte", () => {
  it("tem 100 fundos, com ids válidos e arquivos no lugar", () => {
    expect(FUNDOS_ARTE).toHaveLength(100);
    for (const a of FUNDOS_ARTE) {
      expect(isEncarteFundo(a.id)).toBe(true);
      expect(fundoArtePorId(a.id)?.slug).toBe(a.slug);
      for (const f of ["topo", "base"]) expect(existsSync(path.join(process.cwd(), "public", "fundos", "arte", `${a.slug}-${f}.webp`)), `${a.slug}-${f}`).toBe(true);
      expect(a.topo).toHaveLength(9);
      expect(a.base).toHaveLength(9);
      expect(a.topoH).toBeGreaterThan(a.cut);
    }
  });
});
