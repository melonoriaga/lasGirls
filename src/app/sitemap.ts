import type { MetadataRoute } from "next";

const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/team", "/blog", "/contact", "/services"];
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
    lastModified: new Date(),
  }));
}
