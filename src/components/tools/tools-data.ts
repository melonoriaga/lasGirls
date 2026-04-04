import { Palette, QrCode, RatioIcon, type LucideIcon } from "lucide-react";

export type ToolEntry = {
  slug: string;
  icon: LucideIcon;
  name: string;
  desc: string;
  detail: string;
  tag: string;
};

export const TOOLS_LIST: ToolEntry[] = [
  {
    slug: "qr",
    icon: QrCode,
    name: "Generador de QR",
    desc: "Crea códigos QR personalizados al instante.",
    detail: "URLs, textos, emails, contactos. Descargá en PNG.",
    tag: "GRATIS",
  },
  {
    slug: "paleta",
    icon: Palette,
    name: "Generador de paleta",
    desc: "Genera escalas y combinaciones de color desde un HEX base.",
    detail: "Tints, shades, complementarios y análogos. Exportá PNG hasta 1000×1000.",
    tag: "GRATIS",
  },
  {
    slug: "aspect-ratio",
    icon: RatioIcon,
    name: "Relaciones de aspecto",
    desc: "Consultá tamaños y proporciones optimizadas para redes sociales.",
    detail: "Instagram, TikTok, YouTube, LinkedIn y más. Con calculadora.",
    tag: "GRATIS",
  },
];
