"use client";

import Link from "next/link";
import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";

const DEFAULT_INNER_GRADIENT =
  "linear-gradient(145deg, rgba(60, 18, 45, 0.55) 0%, rgba(20, 6, 22, 0.55) 100%)";
const DEFAULT_BEHIND_GLOW = "rgba(255, 62, 165, 0.62)";
const DEFAULT_ICON_URL = "/brand/logos/las-girls-vertical-rosa.png";

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180,
} as const;

const clamp = (v: number, min = 0, max = 100): number =>
  Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3): number =>
  parseFloat(v.toFixed(precision));
const adjust = (
  v: number,
  fMin: number,
  fMax: number,
  tMin: number,
  tMax: number,
): number => round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

// One-time injection of the holo card stylesheet (with ::before/::after
// pseudo-elements that React inline styles cannot express). Uses the exact
// React Bits source structure but with Las Girls brand pillars + plain white
// text + larger spacing for the logo mask.
const STYLE_ID = "pc-las-girls-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .pc-card-wrapper {
      --pointer-x: 50%;
      --pointer-y: 50%;
      --pointer-from-center: 0;
      --pointer-from-top: 0.5;
      --pointer-from-left: 0.5;
      --card-opacity: 0;
      --rotate-x: 0deg;
      --rotate-y: 0deg;
      --background-x: 50%;
      --background-y: 50%;
      --grain: none;
      --icon: none;
      --behind-glow-color: rgba(255, 62, 165, 0.62);
      --behind-glow-size: 55%;
      --inner-gradient: none;
      --avatar-bottom: -1px;
      --avatar-blend: normal;
      /* Brand palette: rosas, magentas, violetas */
      --sunpillar-1: hsl(330, 100%, 78%);
      --sunpillar-2: hsl(316, 95%, 72%);
      --sunpillar-3: hsl(295, 92%, 74%);
      --sunpillar-4: hsl(278, 95%, 78%);
      --sunpillar-5: hsl(345, 100%, 80%);
      --sunpillar-6: hsl(0, 95%, 82%);
      --sunpillar-clr-1: var(--sunpillar-1);
      --sunpillar-clr-2: var(--sunpillar-2);
      --sunpillar-clr-3: var(--sunpillar-3);
      --sunpillar-clr-4: var(--sunpillar-4);
      --sunpillar-clr-5: var(--sunpillar-5);
      --sunpillar-clr-6: var(--sunpillar-6);
      --card-radius: 30px;
      perspective: 500px;
      transform: translate3d(0, 0, 0.1px);
      position: relative;
      touch-action: none;
    }

    .pc-behind {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: radial-gradient(
        circle at var(--pointer-x) var(--pointer-y),
        var(--behind-glow-color) 0%,
        transparent var(--behind-glow-size)
      );
      filter: blur(50px) saturate(1.1);
      opacity: calc(0.85 * var(--card-opacity));
      transition: opacity 200ms ease;
    }

    .pc-card-wrapper:hover,
    .pc-card-wrapper.active { --card-opacity: 1; }

    .pc-card {
      height: 80svh;
      max-height: 540px;
      display: grid;
      aspect-ratio: 0.718;
      border-radius: var(--card-radius);
      position: relative;
      background-blend-mode: color-dodge, normal, normal, normal;
      box-shadow: rgba(0, 0, 0, 0.55)
        calc((var(--pointer-from-left) * 10px) - 3px)
        calc((var(--pointer-from-top) * 20px) - 6px) 24px -5px;
      transition: transform 1s ease;
      transform: translateZ(0) rotateX(0deg) rotateY(0deg);
      background: rgba(8, 4, 12, 0.96);
      backface-visibility: hidden;
      overflow: hidden;
    }

    .pc-card:hover,
    .pc-card.active {
      transition: none;
      transform: translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x));
    }

    .pc-card-shell.entering .pc-card { transition: transform 180ms ease-out; }
    .pc-card-shell { position: relative; z-index: 1; }

    .pc-card * {
      display: grid;
      grid-area: 1/-1;
      border-radius: var(--card-radius);
      pointer-events: none;
    }

    /* Beat .pc-card universal selector (0,1,1): footer UI must receive clicks / taps. */
    .pc-card .pc-user-info,
    .pc-card .pc-user-info * {
      pointer-events: auto;
    }

    .pc-inside {
      inset: 0;
      position: absolute;
      background-image: var(--inner-gradient);
      background-color: rgba(8, 4, 12, 0.96);
      transform: none;
      isolation: isolate;
    }

    .pc-shine {
      mask-image: var(--icon);
      -webkit-mask-image: var(--icon);
      mask-mode: luminance;
      mask-repeat: repeat;
      -webkit-mask-repeat: repeat;
      /* Larger mask-size = fewer, more spaced logo repeats */
      mask-size: 65%;
      -webkit-mask-size: 65%;
      mask-position: top calc(200% - (var(--background-y) * 5)) left
        calc(100% - var(--background-x));
      -webkit-mask-position: top calc(200% - (var(--background-y) * 5)) left
        calc(100% - var(--background-x));
      transition: filter 0.8s ease, opacity 0.6s ease;
      /* Almost invisible at rest — just a subtle glass shimmer */
      filter: brightness(0.85) contrast(1.25) saturate(0.6) opacity(0.28);
      animation: pc-holo-bg 18s linear infinite;
      animation-play-state: running;
      mix-blend-mode: color-dodge;
    }

    .pc-shine,
    .pc-shine::after {
      --space: 5%;
      --angle: -45deg;
      transform: translate3d(0, 0, 1px);
      overflow: hidden;
      /* Below foreground UI (avatar strip + footer); still above card base */
      z-index: 1;
      background: transparent;
      background-size: cover;
      background-position: center;
      background-image:
        repeating-linear-gradient(
          0deg,
          var(--sunpillar-clr-1) calc(var(--space) * 1),
          var(--sunpillar-clr-2) calc(var(--space) * 2),
          var(--sunpillar-clr-3) calc(var(--space) * 3),
          var(--sunpillar-clr-4) calc(var(--space) * 4),
          var(--sunpillar-clr-5) calc(var(--space) * 5),
          var(--sunpillar-clr-6) calc(var(--space) * 6),
          var(--sunpillar-clr-1) calc(var(--space) * 7)
        ),
        repeating-linear-gradient(
          var(--angle),
          #1a0717 0%,
          hsl(330, 35%, 55%) 3.8%,
          hsl(320, 60%, 70%) 4.5%,
          hsl(330, 35%, 55%) 5.2%,
          #1a0717 10%,
          #1a0717 12%
        ),
        radial-gradient(
          farthest-corner circle at var(--pointer-x) var(--pointer-y),
          hsla(0, 0%, 0%, 0.1) 12%,
          hsla(0, 0%, 0%, 0.15) 20%,
          hsla(0, 0%, 0%, 0.25) 120%
        );
      background-position:
        0 var(--background-y),
        var(--background-x) var(--background-y),
        center;
      background-blend-mode: color, hard-light;
      background-size: 500% 500%, 300% 300%, 200% 200%;
      background-repeat: repeat;
    }

    .pc-shine::before,
    .pc-shine::after {
      content: '';
      background-position: center;
      background-size: cover;
      grid-area: 1/1;
      opacity: 0;
      transition: opacity 0.8s ease;
    }

    .pc-card:hover .pc-shine,
    .pc-card.active .pc-shine {
      filter: brightness(1) contrast(1.5) saturate(0.9) opacity(0.92);
      animation-play-state: paused;
    }

    .pc-card:hover .pc-shine::before,
    .pc-card.active .pc-shine::before,
    .pc-card:hover .pc-shine::after,
    .pc-card.active .pc-shine::after { opacity: 1; }

    .pc-shine::before {
      background-image:
        linear-gradient(
          45deg,
          var(--sunpillar-4),
          var(--sunpillar-5),
          var(--sunpillar-6),
          var(--sunpillar-1),
          var(--sunpillar-2),
          var(--sunpillar-3)
        ),
        radial-gradient(
          circle at var(--pointer-x) var(--pointer-y),
          hsl(330, 55%, 78%) 0%,
          hsla(330, 30%, 30%, 0.2) 90%
        ),
        var(--grain);
      background-size: 250% 250%, 100% 100%, 220px 220px;
      background-position:
        var(--pointer-x) var(--pointer-y),
        center,
        calc(var(--pointer-x) * 0.01) calc(var(--pointer-y) * 0.01);
      background-blend-mode: color-dodge;
      filter: brightness(calc(2 - var(--pointer-from-center)))
        contrast(calc(var(--pointer-from-center) + 2))
        saturate(calc(0.5 + var(--pointer-from-center)));
      mix-blend-mode: luminosity;
    }

    .pc-shine::after {
      background-position:
        0 var(--background-y),
        calc(var(--background-x) * 0.4) calc(var(--background-y) * 0.5),
        center;
      background-size: 200% 300%, 700% 700%, 100% 100%;
      mix-blend-mode: difference;
      filter: brightness(0.85) contrast(1.5);
    }

    .pc-glare {
      transform: translate3d(0, 0, 1.1px);
      overflow: hidden;
      background-image: radial-gradient(
        farthest-corner circle at var(--pointer-x) var(--pointer-y),
        hsl(330, 70%, 88%) 12%,
        hsla(310, 50%, 30%, 0.85) 90%
      );
      mix-blend-mode: overlay;
      filter: brightness(0.85) contrast(1.18);
      z-index: 2;
    }

    .pc-content.pc-avatar-content {
      position: relative;
      z-index: 5;
    }

    .pc-avatar-content {
      mix-blend-mode: var(--avatar-blend);
      overflow: visible;
      transform: translateZ(2px);
      backface-visibility: hidden;
    }

    .pc-avatar-content .avatar {
      width: 100%;
      position: absolute;
      left: 50%;
      transform-origin: 50% 100%;
      transform: translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 6px))
        translateZ(0)
        scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02))
        scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01));
      bottom: var(--avatar-bottom);
      backface-visibility: hidden;
      will-change: transform;
      transition: transform 120ms ease-out;
    }

    .pc-avatar-content::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      backdrop-filter: none;
      pointer-events: none;
    }

    .pc-user-info {
      position: absolute;
      --ui-inset: 20px;
      --ui-radius-bias: 6px;
      bottom: var(--ui-inset);
      left: var(--ui-inset);
      right: var(--ui-inset);
      /* Above avatar parallax + holo layers inside this stacking context */
      z-index: 4;
      display: flex !important;
      align-items: center;
      justify-content: space-between;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(30px);
      -webkit-backdrop-filter: blur(30px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: calc(
        max(0px, var(--card-radius) - var(--ui-inset) + var(--ui-radius-bias))
      );
      padding: 12px 14px;
    }

    .pc-user-details {
      display: flex !important;
      align-items: center;
      gap: 12px;
    }

    .pc-mini-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
    }

    .pc-mini-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      border-radius: 50%;
    }

    .pc-user-text {
      display: flex !important;
      align-items: flex-start;
      flex-direction: column;
      gap: 4px;
    }

    .pc-handle {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      line-height: 1;
      letter-spacing: 0.02em;
    }

    .pc-status {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.75);
      line-height: 1;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .pc-contact-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #fff;
      background: #ff3ea5;
      cursor: pointer;
      transition: all 0.2s ease;
      backdrop-filter: blur(10px);
    }

    .pc-contact-btn:hover {
      background: #ff5fb6;
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-1px);
    }

    .pc-content:not(.pc-avatar-content) {
      max-height: 100%;
      overflow: hidden;
      text-align: center;
      position: relative;
      transform: translate3d(
        calc(var(--pointer-from-left) * -6px + 3px),
        calc(var(--pointer-from-top) * -6px + 3px),
        0.1px
      );
      z-index: 5;
    }

    .pc-details {
      width: 100%;
      position: absolute;
      top: 2.5em;
      display: flex !important;
      flex-direction: column;
      padding: 0 1.2em;
    }

    .pc-details h3 {
      font-weight: 900;
      margin: 0;
      font-size: min(7svh, 3.4em);
      line-height: 0.95;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 2px 18px rgba(0, 0, 0, 0.55);
      font-family: var(--font-display, inherit);
    }

    .pc-details p {
      font-weight: 600;
      position: relative;
      margin: 10px auto 0;
      max-width: 22ch;
      font-size: 13px;
      line-height: 1.3;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #ffffff;
      text-shadow: 0 1px 12px rgba(0, 0, 0, 0.6);
    }

    @keyframes pc-holo-bg {
      0% {
        background-position: 0 var(--background-y), 0 0, center;
      }
      100% {
        background-position: 0 var(--background-y), 90% 90%, center;
      }
    }

    @media (max-width: 768px) {
      .pc-card { height: 70svh; max-height: 460px; }
      .pc-details { top: 2em; }
      .pc-details h3 { font-size: min(5svh, 2.6em); }
      .pc-details p { font-size: 12px; }
      .pc-user-info { --ui-inset: 14px; padding: 10px 12px; }
      .pc-mini-avatar { width: 36px; height: 36px; }
      .pc-contact-btn { padding: 8px 12px; font-size: 10px; }
    }
  `;
  document.head.appendChild(style);
}

interface ProfileCardProps {
  avatarUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
  /** When set, the primary CTA is a real link (cmd+click, prefetch) — preferred over `onContactClick` alone. */
  contactHref?: string;
  /** Offset in CSS units to push the avatar image up/down from the card
   *  bottom edge. Negative values overflow downward (e.g. "-40px"). */
  avatarBottom?: string;
  /** CSS mix-blend-mode for the avatar layer. Defaults to "normal" so the
   *  photo shows its real colors. Use "luminosity" for the holo/tinted look
   *  of the original React Bits demo. */
  avatarBlend?: CSSProperties["mixBlendMode"];
}

interface TiltEngine {
  setImmediate: (x: number, y: number) => void;
  setTarget: (x: number, y: number) => void;
  toCenter: () => void;
  beginInitial: (durationMs: number) => void;
  getCurrent: () => { x: number; y: number; tx: number; ty: number };
  cancel: () => void;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl,
  iconUrl,
  grainUrl,
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = "",
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = "",
  title = "",
  handle = "",
  status = "",
  contactText = "Contact",
  showUserInfo = true,
  onContactClick,
  contactHref,
  avatarBottom,
  avatarBlend,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  const tiltEngine = useMemo<TiltEngine | null>(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const DEFAULT_TAU = 0.14;
    const INITIAL_TAU = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number): void => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;

      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);

      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(
          Math.hypot(percentY - 50, percentX - 50) / 50,
          0,
          1,
        )}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
      };

      for (const [k, v] of Object.entries(properties))
        wrap.style.setProperty(k, v);
    };

    const step = (ts: number): void => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);

      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;

      setVarsFromXY(currentX, currentY);

      const stillFar =
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05;

      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };

    const start = (): void => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number): void {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x: number, y: number): void {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter(): void {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs: number): void {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent(): { x: number; y: number; tx: number; ty: number } {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel(): void {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      },
    };
  }, [enableTilt]);

  const getOffsets = (
    evt: PointerEvent,
    el: HTMLElement,
  ): { x: number; y: number } => {
    const rect = el.getBoundingClientRect();
    return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent): void => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const handlePointerEnter = useCallback(
    (event: PointerEvent): void => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      shell.classList.add("active");
      shell.classList.add("entering");
      const card = shell.querySelector(".pc-card");
      if (card) card.classList.add("active");
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => {
        shell.classList.remove("entering");
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const wrap = wrapRef.current;
      if (wrap) wrap.classList.add("active");

      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const handlePointerLeave = useCallback((): void => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;

    tiltEngine.toCenter();

    const checkSettle = (): void => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove("active");
        const card = shell.querySelector(".pc-card");
        if (card) card.classList.remove("active");
        const wrap = wrapRef.current;
        if (wrap) wrap.classList.remove("active");
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };
    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent): void => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(
        centerX + gamma * mobileTiltSensitivity,
        0,
        shell.clientWidth,
      );
      const y = clamp(
        centerY +
        (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity,
        0,
        shell.clientHeight,
      );

      tiltEngine.setTarget(x, y);
    },
    [tiltEngine, mobileTiltSensitivity],
  );

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;

    const shell = shellRef.current;
    if (!shell) return;

    const pointerMoveHandler = handlePointerMove as EventListener;
    const pointerEnterHandler = handlePointerEnter as EventListener;
    const pointerLeaveHandler = handlePointerLeave as EventListener;
    const deviceOrientationHandler = handleDeviceOrientation as EventListener;

    shell.addEventListener("pointerenter", pointerEnterHandler);
    shell.addEventListener("pointermove", pointerMoveHandler);
    shell.addEventListener("pointerleave", pointerLeaveHandler);

    const handleClick = (): void => {
      if (!enableMobileTilt || location.protocol !== "https:") return;
      const anyMotion = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<string>;
      };
      if (anyMotion && typeof anyMotion.requestPermission === "function") {
        anyMotion
          .requestPermission()
          .then((state: string) => {
            if (state === "granted") {
              window.addEventListener(
                "deviceorientation",
                deviceOrientationHandler,
              );
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener(
          "deviceorientation",
          deviceOrientationHandler,
        );
      }
    };
    shell.addEventListener("click", handleClick);

    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener("pointerenter", pointerEnterHandler);
      shell.removeEventListener("pointermove", pointerMoveHandler);
      shell.removeEventListener("pointerleave", pointerLeaveHandler);
      shell.removeEventListener("click", handleClick);
      window.removeEventListener("deviceorientation", deviceOrientationHandler);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove("entering");
    };
  }, [
    enableTilt,
    enableMobileTilt,
    tiltEngine,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handleDeviceOrientation,
  ]);

  const resolvedIconUrl = iconUrl ?? DEFAULT_ICON_URL;

  const cardStyle = useMemo<CSSProperties>(
    () =>
      ({
        "--icon": resolvedIconUrl ? `url(${resolvedIconUrl})` : "none",
        "--grain": grainUrl ? `url(${grainUrl})` : "none",
        "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
        "--behind-glow-color": behindGlowColor ?? DEFAULT_BEHIND_GLOW,
        "--behind-glow-size": behindGlowSize ?? "55%",
        ...(avatarBottom ? { "--avatar-bottom": avatarBottom } : {}),
        ...(avatarBlend ? { "--avatar-blend": avatarBlend } : {}),
      }) as CSSProperties,
    [
      resolvedIconUrl,
      grainUrl,
      innerGradient,
      behindGlowColor,
      behindGlowSize,
      avatarBottom,
      avatarBlend,
    ],
  );

  const handleContactClick = useCallback((): void => {
    onContactClick?.();
  }, [onContactClick]);

  return (
    <div
      ref={wrapRef}
      className={`pc-card-wrapper ${className}`.trim()}
      style={cardStyle}
    >
      {behindGlowEnabled && <div className="pc-behind" />}
      <div ref={shellRef} className="pc-card-shell   cursor-pointer">
        <section className="pc-card border-2 border-[#ff3ea5]/20">
          <div className="pc-inside">
            <div className="pc-shine" />
            <div className="pc-glare" />
            <div className="pc-content pc-avatar-content">
              {avatarUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="avatar bottom-[-40px] md:bottom-[-60px]"
                  src={avatarUrl}
                  alt={`${name || "User"} avatar`}
                  loading="lazy"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = "none";
                  }}
                />
              )}
              {showUserInfo && (
                <div className="pc-user-info">
                  <div className="pc-user-details">
                    <div className="pc-mini-avatar">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={miniAvatarUrl || avatarUrl}
                        alt={`${name || "User"} mini avatar`}
                        loading="lazy"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.opacity = "0.5";
                          if (avatarUrl) t.src = avatarUrl;
                        }}
                      />
                    </div>
                    <div className="pc-user-text">
                      <div className="pc-handle">@{handle}</div>
                      <div className="pc-status">{status}</div>
                    </div>
                  </div>
                  {contactHref ? (
                    <Link
                      href={contactHref}
                      className="pc-contact-btn"
                      aria-label={`Ver perfil de ${name || "usuario"}`}
                    >
                      {contactText}
                    </Link>
                  ) : (
                    <button
                      className="pc-contact-btn"
                      onClick={handleContactClick}
                      type="button"
                      aria-label={`Contact ${name || "user"}`}
                    >
                      {contactText}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="pc-content">
              <div className="pc-details">
                <h3>{name}</h3>
                <p>{title}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
