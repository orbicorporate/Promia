import { describe, expect, it } from "vitest";
import { extractPageImages, isSafePublicUrl } from "@/lib/net";

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

describe("foto declarada pela página do produto", () => {
  it("prefere a imagem do JSON-LD de produto e resolve endereço relativo", () => {
    const html = `<head>
      <meta property="og:image" content="https://loja.com.br/og/arroz.jpg">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","logo":"https://loja.com.br/logo.png"},{"@type":"Product","name":"Arroz","image":["/img/arroz-5kg.png"]}]}</script>
    </head>`;
    expect(extractPageImages(html, "https://loja.com.br/p/arroz")).toEqual(["https://loja.com.br/img/arroz-5kg.png", "https://loja.com.br/og/arroz.jpg"]);
  });

  it("aceita content antes de property, decodifica &amp; e ignora logo e http", () => {
    const html = `<meta content="https://cdn.x.com/f.jpg?w=800&amp;h=800" property="og:image"><meta name="twitter:image" content="https://cdn.x.com/logo-loja.png"><link rel="image_src" href="http://cdn.x.com/a.jpg">`;
    expect(extractPageImages(html, "https://x.com/")).toEqual(["https://cdn.x.com/f.jpg?w=800&h=800"]);
  });

  it("JSON-LD quebrado não derruba a leitura", () => {
    const html = `<script type="application/ld+json">{quebrado</script><meta property="og:image" content="https://a.com/b.webp">`;
    expect(extractPageImages(html, "https://a.com")).toEqual(["https://a.com/b.webp"]);
  });
});
