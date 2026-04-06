"use client";

import { useEffect, useRef } from "react";
import { adminActionLabel } from "@/lib/admin/admin-actions";

const POLL_MS = 35_000;

/**
 * Polls admin APIs and shows native desktop notifications for new leads
 * and activity from other admin users (session cookie auth).
 */
export function AdminDesktopAlerts() {
  const watermarkRef = useRef<string>(new Date().toISOString());
  const isFirstPollRef = useRef(true);

  useEffect(() => {
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      try {
        const after = watermarkRef.current;
        const res = await fetch(`/api/admin/live-updates?after=${encodeURIComponent(after)}`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          ok?: boolean;
          serverTime?: string;
          leads?: Array<{ id: string; fullName?: string; email?: string }>;
          teamActivity?: Array<{ id: string; action?: string; actorName?: string; path?: string }>;
        };
        if (!data.ok || !data.serverTime) return;

        watermarkRef.current = data.serverTime;

        if (isFirstPollRef.current) {
          isFirstPollRef.current = false;
          return;
        }

        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

        for (const lead of data.leads ?? []) {
          const name = lead.fullName || lead.email || "Lead";
          new Notification("Nuevo lead", {
            body: name,
            tag: `lead-${lead.id}`,
            icon: "/brand/logos/las-girls-vertical-rosa.png",
          });
        }
        for (const act of data.teamActivity ?? []) {
          new Notification("Actividad en el admin", {
            body: `${act.actorName || "Admin"}: ${adminActionLabel(act.action)}${act.path ? ` · ${act.path}` : ""}`,
            tag: `act-${act.id}`,
            icon: "/brand/logos/las-girls-vertical-rosa.png",
          });
        }
      } catch {
        // Polling must not break the shell.
      }
    };

    const id = window.setInterval(tick, POLL_MS);
    void tick();
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, []);

  return null;
}
