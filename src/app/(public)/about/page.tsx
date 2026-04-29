import type { Metadata } from "next";
import { AboutPageContent } from "@/components/pages/about-page-content";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About | Las Girls+",
  description:
    "Conocé cómo trabajamos en Las Girls+: estrategia, diseño y desarrollo con una metodología flexible.",
  path: "/about",
  image: "/seo/about.jpeg",
  imageAlt: "About Las Girls+",
});

export default function AboutPage() {
  return <AboutPageContent />;
}
