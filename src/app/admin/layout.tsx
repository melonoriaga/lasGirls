"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState, type PropsWithChildren } from "react";
import { firebaseAuth } from "@/lib/firebase/client";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/clients", label: "Clientes" },
  { href: "/admin/blog", label: "Blog CMS" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/invitations", label: "Invitaciones" },
  { href: "/admin/changelog", label: "Changelog" },
  { href: "/admin/stats", label: "Stats" },
];

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ fullName?: string; username?: string; photoURL?: string } | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLogin) return;
    const loadProfile = async () => {
      const response = await fetch("/api/admin/profile");
      const json = (await response.json().catch(() => null)) as
        | { ok: boolean; profile?: { fullName?: string; username?: string; photoURL?: string } }
        | null;
      if (json?.ok && json.profile) setProfile(json.profile);
    };
    void loadProfile();
  }, [isLogin]);

  useEffect(() => {
    setPendingPath(null);
  }, [pathname]);

  const isLinkActive = (href: string) => {
    const current = pendingPath ?? pathname;
    if (href === "/admin") return current === "/admin";
    return current === href || current.startsWith(`${href}/`);
  };

  if (isLogin) {
    return <div className="min-h-screen bg-zinc-100">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="min-h-screen w-full">
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-[280px] overflow-y-auto border-r border-zinc-200 bg-rose-100 p-5 lg:block">
          <div className="rounded-2xl bg-rose-200 px-4 py-3 text-zinc-800">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-600">Las Girls+</p>
            <p className="mt-1 text-xl font-semibold">Admin Studio</p>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-3">
            <Link
              href="/admin/profile"
              prefetch
              onClick={() => setPendingPath("/admin/profile")}
              className="flex items-center gap-3"
            >
              <div className="h-12 w-12 overflow-hidden rounded-full bg-zinc-200">
                {profile?.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.photoURL} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-xs font-semibold uppercase text-zinc-600">
                    {(profile?.fullName ?? user?.email ?? "U").slice(0, 1)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">{profile?.fullName ?? "Admin"}</p>
                <p className="truncate text-xs text-zinc-500">{user?.email ?? "Cargando usuario..."}</p>
                {profile?.username && <p className="truncate text-[11px] text-zinc-500">@{profile.username}</p>}
              </div>
            </Link>
          </div>
          <nav className="mt-5 grid gap-1.5">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setPendingPath(item.href)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isLinkActive(item.href)
                    ? "bg-rose-300 text-zinc-900"
                    : "text-zinc-700 hover:bg-rose-200/80 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="p-5 lg:ml-[280px] lg:p-8">{children}</main>
      </div>
    </div>
  );
}
