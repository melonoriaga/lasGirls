import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants/site";

type SeoArgs = {
  title: string;
  description: string;
  path: string;
  image?: string;
};

export const buildMetadata = ({ title, description, path, image }: SeoArgs): Metadata => {
  const url = `${SITE_CONFIG.domain}${path}`;
  const ogImage = `${SITE_CONFIG.domain}${image ?? SITE_CONFIG.defaultOg}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [{ url: ogImage }],
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
