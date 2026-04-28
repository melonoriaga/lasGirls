"use client";

import Link from "next/link";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/i18n/locale-provider";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="relative overflow-hidden border-t-4 border-black bg-[#0d0d0d] text-[#fff8f0]">
      <div className="relative mx-auto min-h-[86vh] max-w-[1600px]">
        <div className="pointer-events-none absolute left-1/2 top-[36%] z-[25] flex w-full -translate-x-1/2 -translate-y-1/2 justify-center px-4 sm:top-[39%] md:top-[40%] lg:top-[41%]">
          <h2 className="max-w-[min(96vw,1200px)] text-center font-accent text-[14vw] leading-[0.85] text-[#ff5faf] sm:text-[12vw] md:text-[10.5vw] lg:text-[min(9rem,11vw)]">
            Las Girls+
          </h2>
        </div>

        <div className="absolute left-[4vw] top-[8vh] z-[3] max-w-[280px] space-y-4">
          <p className="font-accent text-4xl text-[#ff89c0]">{t("footer.taglineHeading")}</p>
          <p className="text-xs leading-relaxed text-white/65">
            {t("footer.taglineBody")}
          </p>
          <div className="h-px w-full bg-[#ff89c0]/25" />
          <nav className="space-y-1">
            <Link href="/#servicios" className="footer-link">
              {t("footer.navServicios")}
            </Link>
            <Link href="/#metodologia" className="footer-link">
              {t("footer.navProceso")}
            </Link>
            <Link href="/#equipo" className="footer-link">
              {t("footer.navEquipo")}
            </Link>
            <Link href="/#contacto" className="footer-link">
              {t("footer.navContacto")}
            </Link>
            <Link href="/blog" className="footer-link">
              {t("footer.navBlog")}
            </Link>
          </nav>
        </div>

        <div className="absolute right-[4vw] top-[8vh] z-[3] flex flex-col items-end gap-3">
          <a href="mailto:hola@lasgirls.com" className="footer-pill bg-[#ff5faf] text-black">
            hola@lasgirls.com
          </a>
          <a
            href="https://www.instagram.com/lasgirls.plus?igsh=MWdyZXEybXYyOW9tOQ%3D%3D&utm_source=qr"
            target="_blank"
            rel="noreferrer"
            className="footer-pill border border-[#fff8f0] bg-transparent text-[#fff8f0]"
          >
            instagram
          </a>
          <Link href="/#contacto" className="footer-cta">
            {t("footer.ctaStart")}
          </Link>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[12] flex justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))]">
          <Image
            src="/brand/stickers/STICKER13.png"
            alt=""
            width={960}
            height={560}
            className="h-auto w-auto max-h-[min(56vh,640px)] max-w-[min(96vw,760px)] select-none object-contain object-bottom sm:max-h-[min(58vh,680px)] md:max-h-[min(60vh,720px)] md:max-w-[min(94vw,820px)]"
          />
        </div>
      </div>

      <div className="relative z-[4] flex flex-wrap items-center justify-between gap-3 border-t border-[#ff89c0]/20 px-6 py-3 text-[10px] uppercase tracking-[0.16em] text-white/50">
        <p>© {new Date().getFullYear()} {t("footer.rights")}</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <LanguageSwitcher variant="footer" compact />
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:text-[#ff89c0]">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-[#ff89c0]">
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
