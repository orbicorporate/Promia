import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Promia",
    short_name: "Promia",
    description: "Encartes e ofertas do seu mercado, prontos para postar e imprimir.",
    start_url: "/",
    display: "standalone",
    background_color: "#e8efe9",
    theme_color: "#e8efe9",
    lang: "pt-BR",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
