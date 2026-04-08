"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

/** En la home el footer vive dentro de `#smooth-content` (ScrollSmoother); acá evitamos duplicarlo. */
export function PublicFooter() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <Footer />;
}
