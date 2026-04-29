"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type LenisApi = {
  scrollTo: (value: number, options?: { immediate?: boolean; force?: boolean }) => void;
};

/**
 * Pinned ScrollTrigger sections (e.g. methodology) reparent DOM nodes. On
 * Next.js client navigations that can race React’s unmount and throw
 * `removeChild` / “not a child of this node”. Kill triggers on each route
 * change so wrappers are cleared before the old page tears down.
 */
function killAllScrollTriggersAndSyncLenis() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  ScrollTrigger.clearScrollMemory?.();
  ScrollTrigger.refresh(true);

  const lenis = (typeof window !== "undefined"
    ? (window as unknown as { __lenis?: LenisApi }).__lenis
    : undefined) as LenisApi | undefined;
  lenis?.scrollTo(0, { immediate: true, force: true });
}

/**
 * Revert pin-wrappers *before* the next route’s DOM commit. The effect
 * cleanup runs in the layout phase; `useEffect`+ScrollTrigger (passive) was
 * too late and caused `removeChild` with pinned nodes.
 */
export function ScrollTriggerRouteSync() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    killAllScrollTriggersAndSyncLenis();
    return () => {
      killAllScrollTriggersAndSyncLenis();
    };
  }, [pathname]);

  return null;
}
