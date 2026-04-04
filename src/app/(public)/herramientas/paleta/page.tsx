import type { Metadata } from "next";
import { ColorPaletteTool } from "@/components/tools/color-palette-tool";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Generador de paletas de color | Las Girls+",
  description:
    "Generá paletas de color armoniosas a partir de un hex. Colores custom, exportar PNG hasta 1000×1000, fondo transparente o sólido.",
  path: "/herramientas/paleta",
});

export default function HerramientasPaletaPage() {
  return <ColorPaletteTool />;
}
