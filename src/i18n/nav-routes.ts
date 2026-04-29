/** Public nav destinations (labels resolved via messages.nav.[navKey]). Order = overlay menu order. */
export const NAV_ROUTES = [
  { href: "/", navKey: "home" as const },
  { href: "/services", navKey: "services" as const },
  { href: "/team", navKey: "team" as const },
  { href: "/about", navKey: "about" as const },
  { href: "/herramientas", navKey: "tools" as const },
  { href: "/contact", navKey: "contact" as const },
] as const;
