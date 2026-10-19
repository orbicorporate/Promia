import { describe, expect, it } from "vitest";
import { outcomeToUpdate } from "@/lib/server/photos";

describe("motivo da foto", () => {
  it("guarda o motivo quando não achou e limpa quando achou", () => {
    expect(outcomeToUpdate({ status: "nao_encontrada", sourceUrl: null, candidates: [], usedAi: true, motivo: "As fotos achadas não eram desse produto." }).image_note).toBe("As fotos achadas não eram desse produto.");
    expect(outcomeToUpdate({ status: "encontrada", origin: "web", imageUrl: "u", sourceUrl: null, candidates: [], usedAi: true }).image_note).toBeNull();
  });
});
