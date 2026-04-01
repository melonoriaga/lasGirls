import type { Metadata } from "next";
import { ContactSection } from "@/components/sections/contact-section";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contacto | Las Girls+",
  description:
    "Contanos tu proyecto. La primera consulta es para orientarte con criterio y sin costo.",
  path: "/contact",
});

export default function ContactPage() {
  return <ContactSection />;
}
