import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black bg-black px-4 py-10 text-[#fef8fb] md:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
        <div>
          <p className="font-display text-lg uppercase tracking-wider">Las Girls+</p>
          <p className="mt-2 text-sm text-white/80">
            Agencia liderada por Jean y Mel con equipo interdisciplinario para proyectos que
            quieren crecer con criterio.
          </p>
        </div>
        <div>
          <p className="text-sm uppercase tracking-wider text-white/70">Contacto</p>
          <p className="mt-2 text-sm">hola@lasgirls.com</p>
          <p className="text-sm">+54 9 11 0000-0000</p>
        </div>
        <div className="flex gap-3 self-end">
          <Link className="text-sm underline" href="/privacy-policy">
            Privacidad
          </Link>
          <Link className="text-sm underline" href="/terms">
            Términos
          </Link>
        </div>
      </div>
    </footer>
  );
}
