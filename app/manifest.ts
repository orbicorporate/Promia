import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promia",
    short_name: "Promia",
    description: "Encartes e ofertas do seu mercado, prontos para postar e imprimir.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8efe9",
    theme_color: "#0b4a35",
    lang: "pt-BR",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
