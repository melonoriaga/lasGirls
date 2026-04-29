"use client";

import Link from "next/link";
import { useLocale, useDictionary } from "@/i18n/locale-provider";
import { usePathname } from "next/navigation";

const slugFromSegments = (
  breadcrumbs: Record<string, string>,
  pathname: string,
) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  const last = segments[segments.length - 1];
  if (Object.prototype.hasOwnProperty.call(breadcrumbs, last)) {
    return breadcrumbs[last]!;
  }
  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

/**
 * Inline breadcrumb for the main header (same row as logo + MENU).
 * Do not render a second sticky row in the page body.
 */
export function PublicBreadcrumbInline() {
  const pathname = usePathname();
  const { t } = useLocale();
  const d = useDictionary();

  const prettyLabel =
    pathname && pathname !== "/" ? slugFromSegments(d.breadcrumbs as Record<string, string>, pathname) : "";

  if (!pathname || pathname === "/") return null;

  return (
    <nav
      aria-label={t("breadcrumbAria")}
      className="flex min-w-0 max-w-full items-center justify-center gap-2 text-[9px] uppercase leading-none tracking-[0.11em] text-inherit sm:text-[10px]"
    >
      <Link
        href="/"
        className="shrink-0 font-semibold text-inherit underline-offset-[3px] hover:underline hover:opacity-90"
      >
        {t("breadcrumbHome")}
      </Link>
      <span className="shrink-0 opacity-[0.82]" aria-hidden="true">
        /
      </span>
      <span className="min-w-0 truncate font-medium text-inherit opacity-[0.92]">
        {prettyLabel}
      </span>
    </nav>
  );
}
