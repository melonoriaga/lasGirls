/** Public nav destinations (labels resolved via messages.nav.[navKey]). */
export const NAV_ROUTES = [
  { href: "/", navKey: "home" as const },
  { href: "/about", navKey: "about" as const },
  { href: "/#servicios", navKey: "services" as const },
  { href: "/team", navKey: "team" as const },
  { href: "/blog", navKey: "blog" as const },
  { href: "/contact", navKey: "contact" as const },
] as const;
