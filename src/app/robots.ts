import type { MetadataRoute } from "next";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/stats"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
