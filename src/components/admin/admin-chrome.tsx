"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState, type PropsWithChildren } from "react";
import type { RemixiconComponentType } from "@remixicon/react";
import {
  RiArticleLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarChartBoxLine,
  RiDashboardLine,
  RiGroupLine,
  RiHistoryLine,
  RiImageLine,
  RiMailLine,
  RiStackLine,
  RiTeamLine,
} from "@remixicon/react";
import { AdminDesktopAlerts } from "@/components/admin/admin-desktop-alerts";
import { firebaseAuth } from "@/lib/firebase/client";

const links: { href: string; label: string; Icon: RemixiconComponentType }[] = [
  { href: "/admin", label: "Dashboard", Icon: RiDashboardLine },
  { href: "/admin/leads", label: "Leads", Icon: RiStackLine },
  { href: "/admin/clients", label: "Clientes", Icon: RiTeamLine },
  { href: "/admin/blog", label: "Blog CMS", Icon: RiArticleLine },
  { href: "/admin/media", label: "Media", Icon: RiImageLine },
  { href: "/admin/users", label: "Equipo", Icon: RiGroupLine },
  { href: "/admin/invitations", label: "Invitaciones", Icon: RiMailLine },
  { href: "/admin/changelog", label: "Changelog", Icon: RiHistoryLine },
  { href: "/admin/stats", label: "Stats", Icon: RiBarChartBoxLine },
];

const SIDEBAR_COLLAPSED_KEY = "lg_admin_sidebar_collapsed";

export function AdminChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ fullName?: string; username?: string; photoURL?: string } | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifHint, setNotifHint] = useState<string | null>(null);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const response = await fetch("/api/admin/profile", { credentials: "include" });
      const json = (await response.json().catch(() => null)) as
        | { ok: boolean; profile?: { fullName?: string; username?: string; photoURL?: string } }
        | null;
      if (json?.ok && json.profile) setProfile(json.profile);
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    setPendingPath(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      setNotifHint("Podés activar alertas de escritorio para nuevos leads y actividad del equipo.");
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      setDesktopCollapsed(raw === "1");
    } catch {
      setDesktopCollapsed(false);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, desktopCollapsed ? "1" : "0");
    } catch {
      // noop
    }
  }, [desktopCollapsed]);

  const isLinkActive = (href: string) => {
    const current = pendingPath ?? pathname;
    if (href === "/admin") return current === "/admin";
    return current === href || current.startsWith(`${href}/`);
  };

  const requestDesktopNotif = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        setNotifHint(null);
        new Notification("Alertas activadas", {
          body: "Vas a ver avisos cuando entren leads o haya actividad de otras admins.",
          icon: "/brand/logos/las-girls-vertical-rosa.png",
        });
      } else {
        setNotifHint("El navegador bloqueó las notificaciones. Revisá permisos del sitio.");
      }
    } catch {
      setNotifHint("No pudimos pedir permiso de notificaciones en este navegador.");
    }
  };

  const NavLinks = ({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) => (
    <nav className="grid gap-1.5">
      {links.map((item) => {
        const Icon = item.Icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => {
              setPendingPath(item.href);
              onNavigate?.();
            }}
            title={compact ? item.label : undefined}
            className={`flex items-center ${compact ? "justify-center" : ""} gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isLinkActive(item.href)
              ? "bg-rose-300 text-zinc-900"
              : "text-zinc-700 hover:bg-rose-200/80 hover:text-zinc-900"
              }`}
          >
            <Icon className="size-[18px] shrink-0 opacity-90" aria-hidden />
            {!compact ? item.label : null}
          </Link>
        );
      })}
    </nav>
  );

  const ProfileBlock = ({ compact = false }: { compact?: boolean }) => (
    <div className={`rounded-2xl bg-white/50 ${compact ? "p-2.5" : "p-3"}`}>
      <Link
        href="/admin/profile"
        prefetch
        onClick={() => {
          setPendingPath("/admin/profile");
          setMobileOpen(false);
        }}
        className={`flex items-center ${compact ? "justify-center" : ""} gap-3`}
        title={compact ? "Mi perfil" : undefined}
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-zinc-200">
          {profile?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoURL} alt="Perfil" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-xs font-semibold uppercase text-zinc-600">
              {(profile?.fullName ?? user?.email ?? "U").slice(0, 1)}
            </span>
          )}
        </div>

        {!compact ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">{profile?.fullName ?? "Admin"}</p>
            {/* <p className="truncate text-xs text-zinc-500">{user?.email ?? "…"}</p> */}
            {profile?.username ? <p className="truncate text-[11px] text-zinc-500">@{profile.username}</p> : null}
          </div>
        ) : null}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100">
      <AdminDesktopAlerts />

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-rose-100/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">Las Girls+</p>
          <p className="text-sm font-semibold text-zinc-900">Admin</p>
        </div>

        <button
          type="button"
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-800"
          aria-expanded={mobileOpen}
          aria-controls="admin-mobile-nav"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {mobileOpen ? "Cerrar" : "Menú"}
        </button>
      </header>

      {mobileOpen ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-x-0 bottom-0 top-[52px] z-30 overflow-y-auto border-b border-zinc-200 bg-rose-100 px-4 py-4 lg:hidden"
        >
          <ProfileBlock />
          <div className="mt-4">
            <NavLinks />
          </div>
          {notifHint && Notification.permission === "default" ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
              <p>{notifHint}</p>
              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white"
                onClick={() => void requestDesktopNotif()}
              >
                Activar alertas de escritorio
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="min-h-screen w-full">
        <aside
          className={`fixed inset-y-0 left-0 z-20 hidden overflow-y-auto border-r border-zinc-200 bg-rose-100 transition-all lg:block ${desktopCollapsed ? "w-[92px] p-3" : "w-[280px] p-5"
            }`}
        >
          <div className={`relative rounded-2xl bg-rose-300 text-zinc-800 flex items-center justify-between ${desktopCollapsed ? "px-2 py-3" : "px-4 py-3"}`}>
            <button
              type="button"
              onClick={() => setDesktopCollapsed((v) => !v)}
              className="absolute right-2 flex items-center justify-center h-[30px] w-[30px]
                text-white hover:bg-rose-400"
              aria-label={desktopCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
              title={desktopCollapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
            >
              {desktopCollapsed ? (
                <RiArrowRightSLine className="size-4" aria-hidden />
              ) : (
                <RiArrowLeftSLine className="size-4" aria-hidden />
              )}
            </button>

            <div className={`flex ${desktopCollapsed ? "justify-center" : "justify-start"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  desktopCollapsed
                    ? "/brand/logos/las-girls-vertical-negro.png"
                    : "/brand/logos/las-girls-horizontal-negro.png"
                }
                alt="Las Girls"
                className={desktopCollapsed ? "h-12 w-auto object-contain" : "h-8 w-auto object-contain"}
              />
            </div>
          </div>

          {!desktopCollapsed && notifHint && typeof Notification !== "undefined" && Notification.permission === "default" ? (
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700">
              <p>{notifHint}</p>
              <button
                type="button"
                className="mt-2 w-full rounded-lg bg-zinc-900 py-2 text-xs font-semibold text-white"
                onClick={() => void requestDesktopNotif()}
              >
                Activar alertas de escritorio
              </button>
            </div>
          ) : null}

          <div className="mt-4">
            <ProfileBlock compact={desktopCollapsed} />
          </div>
          <nav className="mt-5">
            <NavLinks compact={desktopCollapsed} />
          </nav>
        </aside>

        <main className={`min-w-0 p-4 sm:p-5 lg:p-8 ${desktopCollapsed ? "lg:ml-[92px]" : "lg:ml-[280px]"}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
