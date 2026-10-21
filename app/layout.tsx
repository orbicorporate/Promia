import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import "./globals.css";
import { MotionProvider } from "@/components/motion-provider";

// Fontes empacotadas no repositório (assets/fonts): o build não depende
// do Google Fonts e o encarte desenhado no servidor usa as mesmas.
// Open Sans em todo o site (títulos e textos).
const openSans = localFont({
  variable: "--font-texto",
  display: "swap",
  src: [
    { path: "../assets/fonts/open-sans-latin-400-normal.woff2", weight: "400" },
    { path: "../assets/fonts/open-sans-latin-500-normal.woff2", weight: "500" },
    { path: "../assets/fonts/open-sans-latin-600-normal.woff2", weight: "600" },
    { path: "../assets/fonts/open-sans-latin-700-normal.woff2", weight: "700" },
    { path: "../assets/fonts/open-sans-latin-800-normal.woff2", weight: "800" },
  ],
});

export const metadata: Metadata = {
  title: { default: "Promia", template: "%s · Promia" },
  description: "Encartes e ofertas do seu mercado, prontos para postar e imprimir.",
  applicationName: "Promia",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
    <html lang="pt-BR" className={`${openSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="ambiente" aria-hidden>
          <div className="mancha m1" />
          <div className="mancha m2" />
          <div className="mancha m3" />
          <div className="mancha m4" />
          <div className="grao" />
        </div>
        <MotionProvider>{children}</MotionProvider>
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
