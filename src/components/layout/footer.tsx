import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-4 border-black bg-[#0d0d0d] text-[#fff8f0]">
      <div className="relative mx-auto min-h-[86vh] max-w-[1600px]">
        <div className="absolute inset-x-0 bottom-0 z-[1] flex justify-center">
          <h2 className="font-display text-[16vw] uppercase leading-[0.8] text-[#fff8f0] md:text-[13vw]">
            Las Girls+
          </h2>
        </div>

        <div className="absolute left-[4vw] top-[8vh] z-[3] max-w-[280px] space-y-4">
          <p className="font-accent text-4xl text-[#ff89c0]">hablemos.</p>
          <p className="text-xs leading-relaxed text-white/65">
            Transformamos ideas en productos digitales que convierten. Desde una landing puntual
            hasta una arquitectura completa de marca + sitio + operación.
          </p>
          <div className="h-px w-full bg-[#ff89c0]/25" />
          <nav className="space-y-1">
            <Link href="/#servicios" className="footer-link">SERVICIOS</Link>
            <Link href="/#metodologia" className="footer-link">PROCESO</Link>
            <Link href="/#equipo" className="footer-link">EQUIPO</Link>
            <Link href="/#contacto" className="footer-link">CONTACTO</Link>
            <Link href="/blog" className="footer-link">BLOG</Link>
            <Link href="/stats" className="footer-link">VISITAS</Link>
          </nav>
        </div>

        <div className="absolute right-[4vw] top-[8vh] z-[3] flex flex-col items-end gap-3">
          <a href="mailto:hola@lasgirls.com" className="footer-pill bg-[#ff5faf] text-black">
            hola@lasgirls.com
          </a>
          <a href="https://instagram.com/lasgirlsplus" target="_blank" rel="noreferrer" className="footer-pill border border-[#fff8f0] bg-transparent text-[#fff8f0]">
            instagram
          </a>
          <Link href="/#contacto" className="footer-cta">
            empezar proyecto +
          </Link>
        </div>

        <div className="absolute bottom-0 left-1/2 z-[2] -translate-x-1/2">
          <Image
            src="/brand/stickers/STICKER2.png"
            alt="Las Girls+"
            width={540}
            height={740}
            className="h-[78vh] w-auto object-contain"
          />
        </div>
      </div>

      <div className="relative z-[4] flex flex-wrap items-center justify-between gap-2 border-t border-[#ff89c0]/20 px-6 py-3 text-[10px] uppercase tracking-[0.16em] text-white/50">
        <p>© {new Date().getFullYear()} LAS GIRLS+ · TODOS LOS DERECHOS RESERVADOS</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy-policy" className="hover:text-[#ff89c0]">Privacidad</Link>
          <Link href="/terms" className="hover:text-[#ff89c0]">Términos</Link>
        </div>
      </div>
    </footer>
  );
}
