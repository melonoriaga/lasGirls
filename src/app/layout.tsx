import type { Metadata } from "next";
import { Anton, Caveat, Sora } from "next/font/google";
import "@/app/globals.css";
import { buildMetadata } from "@/lib/seo/metadata";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

const accent = Caveat({
  subsets: ["latin"],
  variable: "--font-accent",
});

export const metadata: Metadata = buildMetadata({
  title: "Las Girls+ | Branding, web, apps y estrategia",
  description:
    "Agencia liderada por Jean y Mel. Acompañamos proyectos desde la idea hasta la ejecución con estrategia, diseño y tecnología.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
