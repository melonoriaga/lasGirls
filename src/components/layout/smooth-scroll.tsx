"use client";

import { useEffect, type PropsWithChildren } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Global smooth-scroll provider. Uses Lenis and wires its RAF into
 * GSAP's ticker so ScrollTrigger stays perfectly in sync.
 *
 * Tune feel via `duration` (seconds per scroll "glide") and `lerp`
 * (inertia smoothness, lower = more drift).
 */
export function SmoothScroll({ children }: PropsWithChildren) {
  useEffect(() => {
    /** Safari / Chrome restore scroll position mid-page after reload → breaks hero + pinned GSAP sections. */
    const scrollWinAndDocToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
    scrollWinAndDocToTop();

    const lenis = new Lenis({
      duration: 1.45,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.scrollTo(0, { immediate: true, force: true });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /** After paint / layout, browsers may still apply delayed restoration on mobile — pin again from y=0. */
    let rafId = 0;
    const settleScrollToTop = () => {
      scrollWinAndDocToTop();
      lenis.scrollTo(0, { immediate: true, force: true });
      ScrollTrigger.refresh();
    };
    settleScrollToTop();
    rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        settleScrollToTop();
      });
    });

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      settleScrollToTop();
    };
    window.addEventListener("pageshow", onPageShow);

    // Expose so other components can `stop()` / `start()` it if needed.
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("pageshow", onPageShow);
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}
