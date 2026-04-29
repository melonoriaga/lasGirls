import type { Metadata } from "next";
import { SITE_CONFIG, getSiteOrigin } from "@/lib/constants/site";

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
  const origin = getSiteOrigin();
  /** Next uses this to resolve relative URLs in metadata on the server */
  const metadataBase = new URL(origin.endsWith("/") ? origin : `${origin}/`);

  const pathNormalized = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl =
    pathNormalized === "/" ? `${origin}/` : `${origin}${pathNormalized}`;

  const ogPath = image ?? SITE_CONFIG.defaultOg;
  const ogRelative = ogPath.startsWith("/") ? ogPath.slice(1) : ogPath;
  const ogImageAbsolute =
    ogPath.startsWith("http://") || ogPath.startsWith("https://")
      ? ogPath
      : new URL(ogRelative, metadataBase).href;

  const alt = imageAlt ?? title;

  return {
    metadataBase,
    title,
    description,
    icons: {
      icon: [{ url: "/favicon.ico?v=lg7", type: "image/x-icon" }],
      shortcut: [{ url: "/favicon.ico?v=lg7", type: "image/x-icon" }],
      apple: [{ url: "/brand/stickers/sticker-6.png?v=lg7", type: "image/png" }],
    },
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImageAbsolute,
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
      images: [ogImageAbsolute],
    },
  };
};
