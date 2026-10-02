import { describe, expect, it } from "vitest";
import { isSafePublicUrl } from "@/lib/net";
import { safeImageUrl, sameOriginImage } from "@/lib/renderTabloid";

describe("proteção contra endereço interno", () => {
  it.each([
    "http://8.8.8.8/a.png",
    "https://127.0.0.1/a.png",
    "https://10.0.0.5/a.png",
    "https://169.254.169.254/latest/meta-data",
    "https://192.168.1.10/a.png",
    "https://[::1]/a.png",
    "https://localhost/a.png",
    "https://user:senha@8.8.8.8/a.png",
    "nada",
  ])("recusa %s", async (url) => {
    expect(await isSafePublicUrl(url)).toBeNull();
  });

  it("aceita IP público com https", async () => {
    expect(await isSafePublicUrl("https://8.8.8.8/a.png")).not.toBeNull();
  });
});

describe("fotos do tabloide passam pelo Promia", () => {
  it("monta a URL interna escapada", () => {
    expect(safeImageUrl("https://cdn.x.com/a b.png?x=1&y=2", sameOriginImage)).toBe(
      "/api/imagem?u=https%3A%2F%2Fcdn.x.com%2Fa%2520b.png%3Fx%3D1%26y%3D2"
    );
  });
});
