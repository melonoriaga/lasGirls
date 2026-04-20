"use client";

import StaggeredMenu, { type StaggeredMenuItem, type StaggeredMenuSocialItem } from "@/components/StaggeredMenu";
import { NAV_LINKS } from "@/lib/constants/site";

const items: StaggeredMenuItem[] = NAV_LINKS.map((link) => ({
  label: link.label,
  ariaLabel: `Ir a ${link.label}`,
  link: link.href,
}));

const socialItems: StaggeredMenuSocialItem[] = [
  { label: "Instagram", link: "https://www.instagram.com/lasgirls.plus?igsh=MWdyZXEybXYyOW9tOQ%3D%3D&utm_source=qr" },
  { label: "Behance", link: "https://behance.net/lasgirlsplus" },
  { label: "LinkedIn", link: "https://linkedin.com/company/lasgirlsplus" },
];

export function Navbar() {
  return (
    <StaggeredMenu
      position="right"
      items={items}
      socialItems={socialItems}
      displaySocials
      displayItemNumbering
      logoUrl="/brand/logos/las-girls-horizontal-negro.png"
      scrolledLogoUrl="/brand/logos/las-girls-horizontal-rosa.png"
      scrollThreshold={80}
      menuButtonColor="#111"
      openMenuButtonColor="#111"
      changeMenuColorOnOpen
      accentColor="#ff3ea5"
      colors={["#F8BBD0", "#ff3ea5"]}
      isFixed
      closeOnClickAway
    />
  );
}
