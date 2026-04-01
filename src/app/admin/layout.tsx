import Link from "next/link";
import type { PropsWithChildren } from "react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/clients", label: "Clientes" },
  { href: "/admin/blog", label: "Blog CMS" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/invitations", label: "Invitaciones" },
  { href: "/admin/stats", label: "Stats" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
        <aside className="border-r border-black bg-white p-4">
          <p className="font-display text-3xl uppercase">Admin</p>
          <nav className="mt-5 grid gap-2">
            {links.map((item) => (
              <Link key={item.href} href={item.href} className="border border-black px-3 py-2 text-sm">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
