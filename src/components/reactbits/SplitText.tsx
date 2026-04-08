"use client";

/**
 * React Bits–style Split Text: staggered reveal with GSAP + ScrollTrigger.
 * Mirrors https://reactbits.dev/text-animations/split-text — uses manual spans
 * because `gsap/SplitText` is a Club plugin and is not shipped in the public npm package.
 */
import {
  createElement,
  useLayoutEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export type SplitTextSplitType = "chars" | "words" | "lines" | "words, chars";

export interface SplitTextProps {
  text: string;
  className?: string;
  as?: ElementType;
  delay?: number;
  duration?: number;
  ease?: string | gsap.EaseFunction;
  splitType?: SplitTextSplitType;
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  threshold?: number;
  rootMargin?: string;
  textAlign?: CSSProperties["textAlign"];
  onLetterAnimationComplete?: () => void;
}

function buildSpans(text: string, splitType: SplitTextSplitType): ReactNode[] {
  if (splitType === "lines") {
    return text.split("\n").map((line, li) => (
      <span key={li} className="split-line block">
        {buildSpans(line, "words")}
      </span>
    ));
  }

  if (splitType === "words" || splitType === "words, chars") {
    const parts = text.split(/(\s+)/u);
    return parts.map((part, i) => {
      if (/^\s+$/u.test(part)) {
        return (
          <span key={i} className="split-whitespace">
            {part}
          </span>
        );
      }
      if (splitType === "words, chars") {
        return (
          <span key={i} className="split-word inline-block whitespace-nowrap">
            {Array.from(part).map((ch, ci) => (
              <span key={ci} className="split-target inline-block">
                {ch}
              </span>
            ))}
          </span>
        );
      }
      return (
        <span key={i} className="split-target inline-block">
          {part}
        </span>
      );
    });
  }

  return Array.from(text).map((ch, i) => (
    <span key={i} className="split-target inline-block">
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

const defaultFrom: gsap.TweenVars = { opacity: 0, y: 40 };
const defaultTo: gsap.TweenVars = { opacity: 1, y: 0 };

export function SplitText({
  text,
  className = "",
  as: Component = "div",
  delay = 100,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from,
  to,
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  onLetterAnimationComplete,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>(".split-target");
    if (!targets.length) return;

    const fromVars = { ...defaultFrom, ...from };
    const toVars = { ...defaultTo, ...to };

    const ctx = gsap.context(() => {
      const startPct = (1 - threshold) * 100;
      const m = /^(-?\d+)px$/u.exec(rootMargin);
      const raw = m ? Number.parseInt(m[1], 10) : 0;
      const sign = raw < 0 ? `-=${Math.abs(raw)}px` : `+=${raw}px`;
      const start = `top ${startPct}%${sign}`;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: "play none none none",
          once: true,
        },
        smoothChildTiming: true,
        onComplete: onLetterAnimationComplete,
      });

      tl.set(targets, { ...fromVars, immediateRender: false, force3D: true });
      tl.to(targets, {
        ...toVars,
        duration,
        ease,
        stagger: delay / 1000,
        force3D: true,
      });
    }, el);

    return () => ctx.revert();
  }, [
    text,
    delay,
    duration,
    ease,
    splitType,
    threshold,
    rootMargin,
    onLetterAnimationComplete,
    from,
    to,
  ]);

  return createElement(
    Component,
    {
      ref,
      className,
      style: { textAlign },
    },
    buildSpans(text, splitType),
  );
}
