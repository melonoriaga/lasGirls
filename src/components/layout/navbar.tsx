"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/constants/site";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="absolute left-0 right-0 top-0 z-50 border-b border-black/20 bg-[#f4ede6]/40 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/logos/logo-color-1.png"
            alt="Las Girls+"
            width={124}
            height={34}
            priority
            className="h-8 w-auto object-contain"
          />
          <span className="sr-only">Las Girls+</span>
        </Link>
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
        </nav>
      </header>

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
              <Link href="/admin/login" className="mobile-menu__link text-[#ff2f9d]" onClick={() => setOpen(false)}>
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
