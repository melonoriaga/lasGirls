/**
 * Canonical site origin for SEO, RSS, and absolute URLs (no trailing slash).
 * Priority: NEXT_PUBLIC_SITE_URL → APP_URL → VERCEL_URL → localhost.
 * Set NEXT_PUBLIC_SITE_URL or APP_URL in production so og:image points to your domain.
 */
export function getSiteOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.APP_URL?.trim();
  if (raw) {
    const base = raw.replace(/\/+$/, "");
    return base.startsWith("http") ? base : `https://${base}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/+$/, "")}`;
  }
  return "http://localhost:3000";
}

export const SITE_CONFIG = {
  name: "Las Girls+",
  defaultOg: "/seo/seo.png",
  locale: "es_AR",
};

export const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "About", href: "/about" },
  { label: "Servicios", href: "/#servicios" },
  { label: "Team", href: "/team" },
  { label: "Blog", href: "/blog" },
  { label: "Contacto", href: "/contact" },
];
