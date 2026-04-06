import type { Metadata } from "next";
import { Anton, Pacifico, Sora, Geist } from "next/font/google";
import "@/app/globals.css";
import { buildMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Sora({
  subsets: ["latin"],
  variable: "--font-body",
});

const accent = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-accent",
});

export const metadata: Metadata = buildMetadata({
  title: "Las Girls+ | Branding, web, apps y estrategia",
  description:
    "Agencia liderada por Jean y Mel. Acompañamos proyectos desde la idea hasta la ejecución con estrategia, diseño y tecnología.",
  path: "/",
  image: "/brand/girls/seo.jpeg",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(display.variable, body.variable, accent.variable, "font-sans", geist.variable)}>
      <head>
        <link rel="icon" href="/favicon.ico?v=lg7" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=lg7" />
        <link rel="apple-touch-icon" sizes="180x180" href="/brand/stickers/sticker-6.png?v=lg7" />
        <link rel="mask-icon" href="/brand/stickers/sticker-6.png?v=lg7" color="#ff5faf" />
      </head>
      <body>{children}</body>
    </html>
  );
}
