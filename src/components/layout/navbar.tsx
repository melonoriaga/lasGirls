"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_LINKS } from "@/lib/constants/site";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) {
      return;
    }

    const updateHeroVisibility = () => {
      const hero = document.getElementById("hero");
      if (!hero) {
        setHeroVisible(false);
        return;
      }

      const rect = hero.getBoundingClientRect();
      setHeroVisible(rect.bottom > window.innerHeight * 0.28);
    };

    updateHeroVisibility();
    window.addEventListener("scroll", updateHeroVisibility, { passive: true });
    window.addEventListener("resize", updateHeroVisibility);

    return () => {
      window.removeEventListener("scroll", updateHeroVisibility);
      window.removeEventListener("resize", updateHeroVisibility);
    };
  }, [isHome]);

  return (
    <>
      <Link
        href="/"
        className={`floating-brand ${isHome && heroVisible ? "is-hero" : "is-scrolled"}`}
        aria-label="Ir al inicio"
      >
        <Image
          src={isHome && heroVisible ? "/brand/logos/las-girls-horizontal-negro.png" : "/brand/logos/las-girls-vertical-rosa.png"}
          alt="Las Girls+"
          width={300}
          height={300}
          priority
          className="floating-brand__logo"
        />
      </Link>

      <div className="menu-fab">
        <button
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
          aria-expanded={open}
          className={`hamburger ${open ? "is-open" : ""}`}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      <div className={`mobile-menu ${open ? "is-open" : ""}`}>
        <div className="mobile-menu__panel">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-6 py-20 md:px-10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-black/60">Las Girls+ navigation</p>
            <div className="mt-8 grid gap-3">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="mobile-menu__link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
