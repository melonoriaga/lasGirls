import type { Metadata } from "next";
import { ServicesShowcaseSection } from "@/components/sections/services-showcase-section";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Servicios",
  description:
    "Servicios Las Girls+: lo que podemos construir con red de aliadas — branding, web, apps, contenido y más.",
  path: "/services",
  image: "/seo/products.jpeg",
  imageAlt: "Servicios Las Girls+",
});

export default function ServicesPage() {
  return <ServicesShowcaseSection />;
}
