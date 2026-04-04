import type { Metadata } from "next";
import { ToolsHub } from "@/components/tools/tools-hub";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Herramientas gratis | Las Girls+",
  description:
    "Generador de códigos QR, paletas de colores y calculadora de ratio de aspecto. Gratis y sin registro.",
  path: "/herramientas",
});

export default function HerramientasPage() {
  return <ToolsHub />;
}
