import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";

type SeoArgs = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
};

export const buildMetadata = ({
  title,
  description,
  path,
  image,
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
}: SeoArgs): Metadata => {
  const url = `${SITE_CONFIG.domain}${path}`;
  const ogImage = `${SITE_CONFIG.domain}${image ?? SITE_CONFIG.defaultOg}`;
  const alt = imageAlt ?? title;

  return {
    title,
    description,
    icons: {
      icon: [{ url: "/favicon.ico?v=lg7", type: "image/x-icon" }],
      shortcut: [{ url: "/favicon.ico?v=lg7", type: "image/x-icon" }],
      apple: [{ url: "/brand/stickers/sticker-6.png?v=lg7", type: "image/png" }],
    },
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage,
          width: imageWidth,
          height: imageHeight,
          alt,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
};
