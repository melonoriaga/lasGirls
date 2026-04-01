import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants/site";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-black bg-[#fef8fb]/95 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="font-display text-xl uppercase tracking-widest">
          Las Girls+
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
