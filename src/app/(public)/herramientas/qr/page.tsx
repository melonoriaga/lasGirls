import type { Metadata } from "next";
import { Suspense } from "react";
import { QRGenerator } from "@/components/tools/qr-generator";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Generador de QR | Las Girls+",
  description:
    "Creá códigos QR gratis para URL, texto, email o teléfono. Colores personalizados, fondo transparente y descarga en PNG.",
  path: "/herramientas/qr",
});

export default function HerramientasQRPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] bg-[#F4EDE6]" aria-hidden />}>
      <QRGenerator />
    </Suspense>
  );
}
