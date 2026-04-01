import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS } from "@/lib/constants/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black bg-[#fef8fb]/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
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
        <ul className="hidden gap-6 md:flex">
          {NAV_LINKS.map((item) => (
            <li key={item.href}>
              <Link className="text-sm uppercase tracking-wider hover:underline" href={item.href}>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/admin/login"
          className="border border-black px-3 py-1 text-xs uppercase tracking-wider"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}
