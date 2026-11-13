import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const jakarta = localFont({ src: "../fuentes/PlusJakartaSans.woff2", weight: "500 800", variable: "--font-jakarta", display: "swap" });
const inter = localFont({ src: "../fuentes/Inter.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });

const base = process.env.APP_URL || process.env.URL || "http://localhost:3000";
const titulo = "En Claro · Las cuentas que tu cuaderno no te hace";
const descripcion = "Para kioscos, almacenes y dietéticas: cuánto te quedó de verdad, a quién cobrarle y a cuánto vender. En 5 minutos por día, desde el celular.";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: titulo,
  description: descripcion,
  applicationName: "En Claro",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "En Claro",
    title: "Vendés un montón. ¿Pero sabés si te quedó plata?",
    description: "Calculá tu número del día gratis: cuánto tenés que vender para no perder.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "En Claro: calculá tu número del día" }],
  },
  twitter: { card: "summary_large_image", title: "Vendés un montón. ¿Pero sabés si te quedó plata?", description: "Calculá tu número del día gratis.", images: ["/og.png"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e3b2a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
