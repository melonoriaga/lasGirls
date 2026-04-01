export const SITE_CONFIG = {
  name: "Las Girls+",
  domain: process.env.APP_URL ?? "http://localhost:3000",
  defaultOg: "/images/og/las-girls-og.png",
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
