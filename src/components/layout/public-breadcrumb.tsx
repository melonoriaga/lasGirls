"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const prettyLabel = (pathname: string) => {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "";
  const last = segments[segments.length - 1];
  if (last === "privacy-policy") return "Privacy Policy";
  return last
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export function PublicBreadcrumb() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  return (
    <div className="border-b border-black/20 bg-[#f4ede6]/95 px-4 py-3 backdrop-blur md:px-8">
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-black/70">
        <Link href="/" className="font-semibold text-black hover:underline">
          Home
        </Link>
        <span>/</span>
        <span className="font-medium text-black/80">{prettyLabel(pathname)}</span>
      </div>
    </div>
  );
}
