import type { Metadata } from "next";
import { AspectRatioTool } from "@/components/tools/aspect-ratio-tool";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Calculadora de aspect ratio | Las Girls+",
  description:
    "Resoluciones exactas para 16:9, 4:3, TikTok, YouTube y más. Gratis y rápido.",
  path: "/herramientas/aspect-ratio",
});

export default function HerramientasAspectRatioPage() {
  return <AspectRatioTool />;
}
