"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { AdminToastProvider } from "@/components/admin/admin-toast-provider";

export default function AdminLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <div className="min-h-screen bg-zinc-100">{children}</div>;
  }

  return (
    <AdminToastProvider>
      <AdminChrome>{children}</AdminChrome>
    </AdminToastProvider>
  );
}
