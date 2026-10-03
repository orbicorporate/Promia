import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";

// Fontes empacotadas no repositório (assets/fonts): o build não depende
// do Google Fonts e o encarte desenhado no servidor usa as mesmas.
const titulo = localFont({
  variable: "--font-titulo",
  display: "swap",
  src: [
    { path: "../assets/fonts/bricolage-grotesque-latin-600-normal.woff2", weight: "600" },
    { path: "../assets/fonts/bricolage-grotesque-latin-700-normal.woff2", weight: "700" },
    { path: "../assets/fonts/bricolage-grotesque-latin-800-normal.woff2", weight: "800" },
  ],
});

const texto = localFont({
  variable: "--font-texto",
  display: "swap",
  src: [
    { path: "../assets/fonts/instrument-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../assets/fonts/instrument-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../assets/fonts/instrument-sans-latin-600-normal.woff2", weight: "600" },
  ],
});

export const metadata: Metadata = {
  title: { default: "Promia", template: "%s · Promia" },
  description: "Encartes e ofertas do seu mercado, prontos para postar e imprimir.",
  applicationName: "Promia",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Promia", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8efe9" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1511" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${texto.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="ambiente" aria-hidden>
          <div className="mancha m1" />
          <div className="mancha m2" />
          <div className="mancha m3" />
          <div className="mancha m4" />
          <div className="grao" />
        </div>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "!rounded-2xl !font-sans",
            style: { backdropFilter: "blur(20px)" },
          }}
        />
      </body>
    </html>
  );
}
