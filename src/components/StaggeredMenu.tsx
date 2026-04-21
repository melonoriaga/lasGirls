"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export interface StaggeredMenuItem {
  label: string;
  ariaLabel: string;
  link: string;
}
export interface StaggeredMenuSocialItem {
  label: string;
  link: string;
}
export interface StaggeredMenuProps {
  position?: "left" | "right";
  colors?: string[];
  items?: StaggeredMenuItem[];
  socialItems?: StaggeredMenuSocialItem[];
  displaySocials?: boolean;
  displayItemNumbering?: boolean;
  className?: string;
  logoUrl?: string;
  scrolledLogoUrl?: string;
  scrollThreshold?: number;
  menuButtonColor?: string;
  openMenuButtonColor?: string;
  accentColor?: string;
  isFixed?: boolean;
  changeMenuColorOnOpen?: boolean;
  closeOnClickAway?: boolean;
  smartContrast?: boolean;
  smartContrastDarkBgColor?: string;
  smartContrastLightBgColor?: string;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  forceScrolled?: boolean;
  /** Optional slot between logo and MENU (e.g. breadcrumb on inner routes). */
  headerCenter?: React.ReactNode;
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = "right",
  colors = ["#F8BBD0", "#ff3ea5"],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl = "/brand/logos/las-girls-horizontal-negro.png",
  scrolledLogoUrl,
  scrollThreshold = 80,
  menuButtonColor = "#111",
  openMenuButtonColor = "#111",
  changeMenuColorOnOpen = true,
  accentColor = "#ff3ea5",
  isFixed = true,
  closeOnClickAway = true,
  smartContrast = true,
  smartContrastDarkBgColor = "#ff3ea5",
  smartContrastLightBgColor,
  onMenuOpen,
  onMenuClose,
  forceScrolled = false,
  headerCenter,
}: StaggeredMenuProps) => {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [scrolled, setScrolled] = useState(false);
  const effectiveScrolled = forceScrolled || scrolled;

  const panelRef = useRef<HTMLDivElement | null>(null);
  const preLayersRef = useRef<HTMLDivElement | null>(null);
  const preLayerElsRef = useRef<HTMLElement[]>([]);

  const plusHRef = useRef<HTMLSpanElement | null>(null);
  const plusVRef = useRef<HTMLSpanElement | null>(null);
  const iconRef = useRef<HTMLSpanElement | null>(null);

  const textInnerRef = useRef<HTMLSpanElement | null>(null);
  const textWrapRef = useRef<HTMLSpanElement | null>(null);
  const [textLines, setTextLines] = useState<string[]>(["Menú", "Cerrar"]);

  const openTlRef = useRef<gsap.core.Timeline | null>(null);
  const closeTweenRef = useRef<gsap.core.Tween | null>(null);
  const spinTweenRef = useRef<gsap.core.Timeline | null>(null);
  const textCycleAnimRef = useRef<gsap.core.Tween | null>(null);
  const colorTweenRef = useRef<gsap.core.Tween | null>(null);

  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const breadcrumbColorRef = useRef<HTMLDivElement | null>(null);
  const logoLinkRef = useRef<HTMLAnchorElement | null>(null);
  const busyRef = useRef(false);

  const [scrolledLogoFilter, setScrolledLogoFilter] = useState<"none" | "black" | "white">("none");

  const itemEntranceTweenRef = useRef<gsap.core.Tween | null>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;

      const plusH = plusHRef.current;
      const plusV = plusVRef.current;
      const icon = iconRef.current;
      const textInner = textInnerRef.current;

      if (!panel || !plusH || !plusV || !icon || !textInner) return;

      let preLayers: HTMLElement[] = [];
      if (preContainer) {
        preLayers = Array.from(preContainer.querySelectorAll(".sm-prelayer")) as HTMLElement[];
      }
      preLayerElsRef.current = preLayers;

      const offscreen = position === "left" ? -100 : 100;
      gsap.set([panel, ...preLayers], { xPercent: offscreen, opacity: 1 });
      if (preContainer) {
        gsap.set(preContainer, { xPercent: 0, opacity: 1 });
      }

      gsap.set(plusH, { transformOrigin: "50% 50%", rotate: 0 });
      gsap.set(plusV, { transformOrigin: "50% 50%", rotate: 90 });
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });

      gsap.set(textInner, { yPercent: 0 });

      const navColorTargets = [toggleBtnRef.current, breadcrumbColorRef.current].filter(Boolean);
      if (navColorTargets.length) gsap.set(navColorTargets, { color: menuButtonColor });
    });
    return () => ctx.revert();
  }, [menuButtonColor, position]);

  const buildOpenTimeline = useCallback(() => {
    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return null;

    openTlRef.current?.kill();
    if (closeTweenRef.current) {
      closeTweenRef.current.kill();
      closeTweenRef.current = null;
    }
    itemEntranceTweenRef.current?.kill();

    const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
    const numberEls = Array.from(
      panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")
    ) as HTMLElement[];
    const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
    const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];

    const offscreen = position === "left" ? -100 : 100;
    const layerStates = layers.map((el) => ({ el, start: offscreen }));
    const panelStart = offscreen;

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    layerStates.forEach((ls, i) => {
      tl.fromTo(ls.el, { xPercent: ls.start }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: "power4.out" },
      panelInsertTime
    );

    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        { yPercent: 0, rotate: 0, duration: 1, ease: "power4.out", stagger: { each: 0.1, from: "start" } },
        itemsStart
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          { duration: 0.6, ease: "power2.out", ["--sm-num-opacity" as any]: 1, stagger: { each: 0.08, from: "start" } },
          itemsStart + 0.1
        );
      }
    }

    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: "power2.out" }, socialsStart);
      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power3.out",
            stagger: { each: 0.08, from: "start" },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: "opacity" });
            },
          },
          socialsStart + 0.04
        );
      }
    }

    openTlRef.current = tl;
    return tl;
  }, [position]);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    const tl = buildOpenTimeline();
    if (tl) {
      tl.eventCallback("onComplete", () => {
        busyRef.current = false;
      });
      tl.play(0);
    } else {
      busyRef.current = false;
    }
  }, [buildOpenTimeline]);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    itemEntranceTweenRef.current?.kill();

    const panel = panelRef.current;
    const layers = preLayerElsRef.current;
    if (!panel) return;

    const all: HTMLElement[] = [...layers, panel];
    closeTweenRef.current?.kill();

    const offscreen = position === "left" ? -100 : 100;

    closeTweenRef.current = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll(".sm-panel-itemLabel")) as HTMLElement[];
        if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });

        const numberEls = Array.from(
          panel.querySelectorAll(".sm-panel-list[data-numbering] .sm-panel-item")
        ) as HTMLElement[];
        if (numberEls.length) gsap.set(numberEls, { ["--sm-num-opacity" as any]: 0 });

        const socialTitle = panel.querySelector(".sm-socials-title") as HTMLElement | null;
        const socialLinks = Array.from(panel.querySelectorAll(".sm-socials-link")) as HTMLElement[];
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        busyRef.current = false;
      },
    });
  }, [position]);

  const animateIcon = useCallback((opening: boolean) => {
    const icon = iconRef.current;
    const h = plusHRef.current;
    const v = plusVRef.current;
    if (!icon || !h || !v) return;

    spinTweenRef.current?.kill();

    if (opening) {
      gsap.set(icon, { rotate: 0, transformOrigin: "50% 50%" });
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .to(h, { rotate: 45, duration: 0.5 }, 0)
        .to(v, { rotate: -45, duration: 0.5 }, 0);
    } else {
      spinTweenRef.current = gsap
        .timeline({ defaults: { ease: "power3.inOut" } })
        .to(h, { rotate: 0, duration: 0.35 }, 0)
        .to(v, { rotate: 90, duration: 0.35 }, 0)
        .to(icon, { rotate: 0, duration: 0.001 }, 0);
    }
  }, []);

  const animateColor = useCallback(
    (opening: boolean) => {
      const btn = toggleBtnRef.current;
      const crumbs = breadcrumbColorRef.current;
      const targets = [btn, crumbs].filter(Boolean) as HTMLElement[];
      if (!targets.length) return;
      colorTweenRef.current?.kill();
      if (changeMenuColorOnOpen) {
        const targetColor = opening ? openMenuButtonColor : menuButtonColor;
        colorTweenRef.current = gsap.to(targets, {
          color: targetColor,
          delay: 0.18,
          duration: 0.3,
          ease: "power2.out",
        });
      } else {
        gsap.set(targets, { color: menuButtonColor });
      }
    },
    [openMenuButtonColor, menuButtonColor, changeMenuColorOnOpen]
  );

  React.useEffect(() => {
    const targets = [toggleBtnRef.current, breadcrumbColorRef.current].filter(Boolean) as HTMLElement[];
    if (!targets.length) return;
    if (changeMenuColorOnOpen) {
      const targetColor = openRef.current ? openMenuButtonColor : menuButtonColor;
      gsap.set(targets, { color: targetColor });
    } else {
      gsap.set(targets, { color: menuButtonColor });
    }
  }, [changeMenuColorOnOpen, menuButtonColor, openMenuButtonColor]);

  const animateText = useCallback((opening: boolean) => {
    const inner = textInnerRef.current;
    if (!inner) return;

    textCycleAnimRef.current?.kill();

    const currentLabel = opening ? "Menú" : "Cerrar";
    const targetLabel = opening ? "Cerrar" : "Menú";
    const cycles = 3;

    const seq: string[] = [currentLabel];
    let last = currentLabel;
    for (let i = 0; i < cycles; i++) {
      last = last === "Menú" ? "Cerrar" : "Menú";
      seq.push(last);
    }
    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    setTextLines(seq);
    gsap.set(inner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    textCycleAnimRef.current = gsap.to(inner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: "power4.out",
    });
  }, []);

  const toggleMenu = useCallback(() => {
    const target = !openRef.current;
    openRef.current = target;
    setOpen(target);

    if (target) {
      onMenuOpen?.();
      playOpen();
    } else {
      onMenuClose?.();
      playClose();
    }

    animateIcon(target);
    animateColor(target);
    animateText(target);
  }, [playOpen, playClose, animateIcon, animateColor, animateText, onMenuOpen, onMenuClose]);

  const closeMenu = useCallback(() => {
    if (openRef.current) {
      openRef.current = false;
      setOpen(false);
      onMenuClose?.();
      playClose();
      animateIcon(false);
      animateColor(false);
      animateText(false);
    }
  }, [playClose, animateIcon, animateColor, animateText, onMenuClose]);

  React.useEffect(() => {
    if (forceScrolled) return;
    const update = () => {
      setScrolled(window.scrollY > scrollThreshold);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [scrollThreshold, forceScrolled]);

  React.useEffect(() => {
    if (!smartContrast) return;
    if (open) return;

    const lightFallback = smartContrastLightBgColor ?? menuButtonColor;

    const parseColor = (str: string): [number, number, number, number] | null => {
      const m = str.match(/-?\d+(\.\d+)?/g);
      if (!m) return null;
      const nums = m.map(Number);
      const [r, g, b] = nums;
      const a = nums[3] ?? 1;
      return [r, g, b, a];
    };

    const luminance = (r: number, g: number, b: number) => {
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };

    const sample = () => {
      const btn = toggleBtnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const prevPe = btn.style.pointerEvents;
      btn.style.pointerEvents = "none";
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      btn.style.pointerEvents = prevPe;

      let r = 255;
      let g = 255;
      let b = 255;
      while (el && el !== document.body) {
        const c = window.getComputedStyle(el).backgroundColor;
        const parsed = parseColor(c);
        if (parsed && parsed[3] > 0.4) {
          [r, g, b] = parsed;
          break;
        }
        el = el.parentElement;
      }

      const lum = luminance(r, g, b);
      const target = lum < 0.5 ? smartContrastDarkBgColor : lightFallback;
      const crumbs = breadcrumbColorRef.current;
      const targets = [btn, crumbs].filter(Boolean) as HTMLElement[];
      colorTweenRef.current?.kill();
      colorTweenRef.current = gsap.to(targets, {
        color: target,
        duration: 0.25,
        ease: "power2.out",
        overwrite: true,
      });
    };

    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sample();
      });
    };

    sample();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [smartContrast, smartContrastDarkBgColor, smartContrastLightBgColor, menuButtonColor, open]);

  React.useEffect(() => {
    if (!effectiveScrolled || !scrolledLogoUrl) {
      setScrolledLogoFilter("none");
      return;
    }

    const parseColor = (str: string): [number, number, number, number] | null => {
      const m = str.match(/-?\d+(\.\d+)?/g);
      if (!m) return null;
      const nums = m.map(Number);
      const [r, g, b] = nums;
      const a = nums[3] ?? 1;
      return [r, g, b, a];
    };

    const relLum = (r: number, g: number, b: number) => {
      const lin = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };

    const LOGO_PINK_LUM = relLum(255, 62, 165);
    const MIN_CONTRAST = 2.2;

    const sample = () => {
      const el0 = logoLinkRef.current;
      if (!el0) return;
      const rect = el0.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      const prevPe = el0.style.pointerEvents;
      el0.style.pointerEvents = "none";
      let el = document.elementFromPoint(x, y) as HTMLElement | null;
      el0.style.pointerEvents = prevPe;

      let r = 255;
      let g = 255;
      let b = 255;
      while (el && el !== document.body) {
        const c = window.getComputedStyle(el).backgroundColor;
        const parsed = parseColor(c);
        if (parsed && parsed[3] > 0.4) {
          [r, g, b] = parsed;
          break;
        }
        el = el.parentElement;
      }

      const bgLum = relLum(r, g, b);
      const lighter = Math.max(bgLum, LOGO_PINK_LUM);
      const darker = Math.min(bgLum, LOGO_PINK_LUM);
      const contrast = (lighter + 0.05) / (darker + 0.05);

      if (contrast >= MIN_CONTRAST) {
        setScrolledLogoFilter("none");
      } else {
        setScrolledLogoFilter(bgLum > 0.5 ? "black" : "white");
      }
    };

    let raf = 0;
    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        sample();
      });
    };

    sample();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [effectiveScrolled, scrolledLogoUrl]);

  React.useEffect(() => {
    if (!closeOnClickAway || !open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnClickAway, open, closeMenu]);

  const logoShellClass = forceScrolled
    ? "h-7 sm:h-9 bg-white/15 backdrop-blur-sm rounded-sm px-3 sm:px-4 py-1"
    : effectiveScrolled
      ? "h-8 sm:h-12 bg-white/10 backdrop-blur-sm rounded-sm px-6 py-2"
      : "h-12 sm:h-20";

  return (
    <div
      className={`sm-scope z-[70] ${isFixed ? "fixed top-0 left-0 w-screen h-screen overflow-hidden pointer-events-none" : "w-full h-full"}`}
    >
      <div
        className={
          (className ? className + " " : "") + "staggered-menu-wrapper pointer-events-none relative w-full h-full z-[70]"
        }
        style={accentColor ? ({ ["--sm-accent" as any]: accentColor } as React.CSSProperties) : undefined}
        data-position={position}
        data-open={open || undefined}
      >
        <div
          ref={preLayersRef}
          className="sm-prelayers absolute top-0 right-0 bottom-0 pointer-events-none z-[5]"
          aria-hidden="true"
        >
          {(() => {
            const raw = colors && colors.length ? colors.slice(0, 4) : ["#F8BBD0", "#ff3ea5"];
            const arr = [...raw];
            if (arr.length >= 3) {
              const mid = Math.floor(arr.length / 2);
              arr.splice(mid, 1);
            }
            return arr.map((c, i) => (
              <div
                key={i}
                className="sm-prelayer absolute top-0 right-0 h-full w-full translate-x-0"
                style={{ background: c }}
              />
            ));
          })()}
        </div>

        <header
          className="staggered-menu-header absolute top-0 left-0 w-full p-[1.25em_1.5em] sm:p-[1.5em_2em] bg-transparent pointer-events-none z-20"
          aria-label="Main navigation header"
        >
          <a
            ref={logoLinkRef}
            href="/"
            className="sm-logo flex items-center select-none pointer-events-auto"
            aria-label="Las Girls+ home"
            data-scrolled={effectiveScrolled || undefined}
          >
            <span
              className={`sm-logo-shell relative inline-flex items-center transition-[height,padding] duration-300 ease-out ${logoShellClass}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Las Girls+"
                className={`sm-logo-img block h-full w-auto object-contain transition-opacity duration-300 ease-out ${effectiveScrolled && scrolledLogoUrl ? "opacity-0" : "opacity-100"
                  }`}
                draggable={false}
                width={240}
                height={64}
              />
              {scrolledLogoUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={scrolledLogoUrl}
                  alt=""
                  aria-hidden="true"
                  className={`sm-logo-img sm-logo-img--scrolled absolute left-0 top-0 block h-full w-auto object-contain transition-[opacity,filter] duration-300 ease-out ${effectiveScrolled ? "opacity-100" : "opacity-0"
                    }`}
                  style={{
                    filter:
                      scrolledLogoFilter === "black"
                        ? "brightness(0)"
                        : scrolledLogoFilter === "white"
                          ? "brightness(0) invert(1)"
                          : undefined,
                  }}
                  draggable={false}
                  width={240}
                  height={64}
                />
              )}
            </span>
          </a>

          <div className="sm-header-center flex min-w-0 justify-center self-center pointer-events-none">
            {headerCenter ? (
              <div
                ref={breadcrumbColorRef}
                className="pointer-events-auto flex min-w-0 max-w-full justify-center text-inherit transition-none"
              >
                {headerCenter}
              </div>
            ) : null}
          </div>

          <button
            ref={toggleBtnRef}
            className="sm-toggle relative inline-flex items-center gap-[0.4rem] bg-transparent border-0 cursor-pointer font-bold uppercase tracking-[0.18em] leading-none overflow-visible pointer-events-auto"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="staggered-menu-panel"
            onClick={toggleMenu}
            type="button"
          >
            <span
              ref={textWrapRef}
              className="sm-toggle-textWrap relative inline-block h-[1em] overflow-hidden whitespace-nowrap text-sm sm:text-base"
              aria-hidden="true"
            >
              <span ref={textInnerRef} className="sm-toggle-textInner flex flex-col leading-none">
                {textLines.map((l, i) => (
                  <span className="sm-toggle-line block h-[1em] leading-none" key={i}>
                    {l}
                  </span>
                ))}
              </span>
            </span>

            <span
              ref={iconRef}
              className="sm-icon relative w-[16px] h-[16px] shrink-0 inline-flex items-center justify-center [will-change:transform]"
              aria-hidden="true"
            >
              <span
                ref={plusHRef}
                className="sm-icon-line absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
              />
              <span
                ref={plusVRef}
                className="sm-icon-line sm-icon-line-v absolute left-1/2 top-1/2 w-full h-[2px] bg-current rounded-[2px] -translate-x-1/2 -translate-y-1/2 [will-change:transform]"
              />
            </span>
          </button>
        </header>

        <aside
          id="staggered-menu-panel"
          ref={panelRef}
          className="staggered-menu-panel absolute top-0 right-0 h-full bg-white flex flex-col p-[6em_2em_2em_2em] overflow-y-auto z-10 backdrop-blur-[12px] pointer-events-auto"
          style={{ WebkitBackdropFilter: "blur(12px)" }}
          aria-hidden={!open}
        >
          <div className="sm-panel-inner flex-1 flex flex-col gap-5">
            <ul
              className="sm-panel-list list-none m-0 p-0 flex flex-col gap-2"
              role="list"
              data-numbering={displayItemNumbering || undefined}
            >
              {items && items.length ? (
                items.map((it, idx) => (
                  <li className="sm-panel-itemWrap relative overflow-hidden leading-none" key={it.label + idx}>
                    <a
                      className="sm-panel-item font-display"
                      href={it.link}
                      aria-label={it.ariaLabel}
                      data-index={idx + 1}
                    >
                      <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                        {it.label}
                      </span>
                    </a>
                  </li>
                ))
              ) : (
                <li className="sm-panel-itemWrap relative overflow-hidden leading-none" aria-hidden="true">
                  <span className="sm-panel-item font-display">
                    <span className="sm-panel-itemLabel inline-block [transform-origin:50%_100%] will-change-transform">
                      Sin items
                    </span>
                  </span>
                </li>
              )}
            </ul>

            {displaySocials && socialItems && socialItems.length > 0 && (
              <div className="sm-socials mt-auto pt-8 flex flex-col gap-3" aria-label="Social links">
                <h3 className="sm-socials-title font-display tracking-[0.15em]">Socials</h3>
                <ul
                  className="sm-socials-list list-none m-0 p-0 flex flex-row items-center gap-4 flex-wrap"
                  role="list"
                >
                  {socialItems.map((s, i) => (
                    <li key={s.label + i} className="sm-socials-item">
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sm-socials-link"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      <style>{`
.sm-scope .staggered-menu-wrapper { position: relative; width: 100%; height: 100%; z-index: 40; pointer-events: none; }
.sm-scope .staggered-menu-header { position: absolute; top: 0; left: 0; width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 0.5rem; align-items: center; background: transparent; pointer-events: none; z-index: 20; }
@media (min-width: 640px) {
  .sm-scope .staggered-menu-header { gap: 0.75rem; }
}
.sm-scope .staggered-menu-header > * { pointer-events: auto; }
.sm-scope .staggered-menu-header .sm-header-center { pointer-events: none; }
.sm-scope .sm-logo { display: flex; align-items: center; user-select: none; }
.sm-scope .sm-toggle:focus-visible { outline: 2px solid var(--sm-accent, #ff3ea5); outline-offset: 4px; border-radius: 4px; }
.sm-scope .sm-toggle-textWrap { width: var(--sm-toggle-width, auto); min-width: var(--sm-toggle-width, auto); margin-right: 0.5em; font-family: var(--font-display), sans-serif; }
.sm-scope .sm-icon { position: relative; will-change: transform; }
.sm-scope .sm-panel-itemWrap { position: relative; overflow: hidden; line-height: 1; }
.sm-scope .sm-icon-line { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); will-change: transform; }
.sm-scope .staggered-menu-panel { width: clamp(280px, 38vw, 460px); }
.sm-scope [data-position='left'] .staggered-menu-panel { right: auto; left: 0; }
.sm-scope .sm-prelayers { width: clamp(280px, 38vw, 460px); }
.sm-scope [data-position='left'] .sm-prelayers { right: auto; left: 0; }
.sm-scope .sm-prelayer { transform: translateX(0); }
.sm-scope .sm-panel-inner { flex: 1; display: flex; flex-direction: column; gap: 1.25rem; }
.sm-scope .sm-socials { margin-top: auto; padding-top: 2rem; display: flex; flex-direction: column; gap: 0.75rem; }
.sm-scope .sm-socials-title { margin: 0; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--sm-accent, #ff3ea5); }
.sm-scope .sm-socials-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: row; align-items: center; gap: 1rem; flex-wrap: wrap; }
.sm-scope .sm-socials-list .sm-socials-link { opacity: 1; transition: opacity 0.3s ease; }
.sm-scope .sm-socials-list:hover .sm-socials-link:not(:hover) { opacity: 0.35; }
.sm-scope .sm-socials-list:focus-within .sm-socials-link:not(:focus-visible) { opacity: 0.35; }
.sm-scope .sm-socials-list .sm-socials-link:hover,
.sm-scope .sm-socials-list .sm-socials-link:focus-visible { opacity: 1; }
.sm-scope .sm-socials-link:focus-visible { outline: 2px solid var(--sm-accent, #ff3ea5); outline-offset: 3px; }
.sm-scope .sm-socials-link { font-size: 1.1rem; font-weight: 600; color: #111; text-decoration: none; position: relative; padding: 2px 0; display: inline-block; transition: color 0.3s ease, opacity 0.3s ease; letter-spacing: 0.04em; }
.sm-scope .sm-socials-link:hover { color: var(--sm-accent, #ff3ea5); }
.sm-scope .sm-panel-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.sm-scope .sm-panel-item { position: relative; color: #000; font-weight: 400; font-size: clamp(2.8rem, 7vw, 4.5rem); cursor: pointer; line-height: 0.95; letter-spacing: -1.5px; text-transform: uppercase; transition: color 0.25s ease; display: inline-flex; align-items: flex-start; gap: 0.35em; text-decoration: none; font-family: var(--font-display), sans-serif; }
.sm-scope .sm-panel-itemLabel { display: inline-block; will-change: transform; transform-origin: 50% 100%; }
.sm-scope .sm-panel-item:hover { color: var(--sm-accent, #ff3ea5); }
.sm-scope .sm-panel-list[data-numbering] { counter-reset: smItem; }
.sm-scope .sm-panel-list[data-numbering] .sm-panel-item::after { counter-increment: smItem; content: counter(smItem, decimal-leading-zero); font-size: 16px; font-weight: 700; color: var(--sm-accent, #ff3ea5); letter-spacing: 0; pointer-events: none; user-select: none; opacity: var(--sm-num-opacity, 0); font-family: var(--font-display), sans-serif; margin-top: 0.4em; }
@media (max-width: 1024px) { .sm-scope .staggered-menu-panel, .sm-scope .sm-prelayers { width: 100%; left: 0; right: 0; } }
@media (max-width: 640px) { .sm-scope .staggered-menu-panel, .sm-scope .sm-prelayers { width: 100%; left: 0; right: 0; } }
      `}</style>
    </div>
  );
};

export default StaggeredMenu;
