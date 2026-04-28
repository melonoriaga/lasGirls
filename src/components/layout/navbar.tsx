"use client";

import StaggeredMenu, {
  type StaggeredMenuItem,
  type StaggeredMenuSocialItem,
} from "@/components/StaggeredMenu";
import { PublicBreadcrumbInline } from "@/components/layout/public-breadcrumb";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/i18n/locale-provider";
import { NAV_ROUTES } from "@/i18n/nav-routes";
import { usePathname } from "next/navigation";

const socialItems: StaggeredMenuSocialItem[] = [
  {
    label: "Instagram",
    link: "https://www.instagram.com/lasgirls.plus?igsh=MWdyZXEybXYyOW9tOQ%3D%3D&utm_source=qr",
  },
  { label: "Behance", link: "https://behance.net/lasgirlsplus" },
  {
    label: "LinkedIn",
    link: "https://linkedin.com/company/lasgirlsplus",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLocale();

  const items: StaggeredMenuItem[] = NAV_ROUTES.map((link) => ({
    label: t(`nav.${link.navKey}`),
    ariaLabel: t("menu.goTo", { label: t(`nav.${link.navKey}`) }),
    link: link.href,
  }));

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
      forceScrolled={!isHome}
      headerCenter={<PublicBreadcrumbInline />}
      headerTrailing={<LanguageSwitcher variant="header" />}
      toggleWords={[t("menu.menu"), t("menu.close")] as const}
      toggleAria={[t("menu.ariaOpen"), t("menu.ariaClose")] as const}
      emptyMenuLabel={t("menu.emptyItems")}
      socialsHeading={t("menu.socialsTitle")}
    />
  );
}
