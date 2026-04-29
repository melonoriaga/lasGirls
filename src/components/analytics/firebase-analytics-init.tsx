"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { firebaseApp } from "@/lib/firebase/client";

/** Inicializa Google Analytics (GA4) ligado al proyecto Firebase. Requiere `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. */
export function FirebaseAnalyticsInit() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim();
    if (!id) return;

    let cancelled = false;
    void isSupported().then((ok) => {
      if (!ok || cancelled) return;
      try {
        getAnalytics(firebaseApp);
      } catch {
        // idempotente en HMR / doble mount
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
