"use client";

import { ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type LenisLike = {
  scrollTo: (
    target: HTMLElement | string,
    opts?: { duration?: number; immediate?: boolean; force?: boolean },
  ) => void;
};

function scrollToHero() {
  const hero = document.getElementById("hero");
  if (!hero) return;

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const lenis = typeof window !== "undefined"
    ? (window as unknown as { __lenis?: LenisLike }).__lenis
    : undefined;

  if (lenis) {
    lenis.scrollTo(hero, reduced ? { immediate: true, force: true } : { duration: 1.15, force: true });
    return;
  }

  hero.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
}

/**
 * Home only: fixed control bottom-right when the hero section has fully left the viewport.
 */
export function BackToHeroFab() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname !== "/") {
      setVisible(false);
      return;
    }

    const hero = document.getElementById("hero");
    if (!hero) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    io.observe(hero);
    return () => io.disconnect();
  }, [pathname]);

  if (pathname !== "/") return null;

  return (
    <button
      type="button"
      aria-label="Volver al hero"
      tabIndex={visible ? 0 : -1}
      onClick={scrollToHero}
      className={
        "fixed z-[65] flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-[#f4ede6] text-black shadow-[0_6px_20px_rgba(17,17,17,0.12)] transition-[opacity,transform] duration-300 ease-out hover:bg-black hover:text-[#f4ede6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff3ea5] md:h-11 md:w-11 " +
        "bottom-[max(1rem,env(safe-area-inset-bottom,0px)+0.25rem)] right-[max(1rem,env(safe-area-inset-right,0px))] md:bottom-8 md:right-8 " +
        (visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0")
      }
    >
      <ChevronUp className="h-[18px] w-[18px] md:h-5 md:w-5" strokeWidth={2.25} aria-hidden />
    </button>
  );
}
