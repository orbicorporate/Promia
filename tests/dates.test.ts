import { describe, expect, it } from "vitest";
import { todayInSaoPaulo, addDaysISO, isISODate } from "@/lib/dates";

describe("datas em São Paulo", () => {
  it("às 23h de São Paulo ainda é o mesmo dia (em UTC já é o seguinte)", () => {
    expect(todayInSaoPaulo(new Date("2026-10-03T02:30:00Z"))).toBe("2026-10-02");
  });
  it("soma dias atravessando o mês", () => {
    expect(addDaysISO("2026-10-30", 3)).toBe("2026-11-02");
  });
  it("valida datas", () => {
    expect(isISODate("2026-02-30")).toBe(false);
    expect(isISODate("2026-02-28")).toBe(true);
    expect(isISODate("28/02/2026")).toBe(false);
  });
});
