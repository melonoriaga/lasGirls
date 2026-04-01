"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type StickerItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  rotate?: number;
  delay?: number;
};

type Props = {
  items: StickerItem[];
  containerClassName?: string;
};

type Pos = {
  x: number;
  y: number;
  rotate: number;
};

export function StickerWindows({ items, containerClassName = "" }: Props) {
  const initial = useMemo(
    () =>
      items.reduce<Record<string, Pos>>((acc, item) => {
        acc[item.id] = { x: item.x, y: item.y, rotate: item.rotate ?? 0 };
        return acc;
      }, {}),
    [items],
  );
  const [positions, setPositions] = useState<Record<string, Pos>>(initial);
  const hoverCountRef = useRef<Record<string, number>>({});
  const dragRef = useRef<{ id: string; startX: number; startY: number; baseX: number; baseY: number } | null>(
    null,
  );

  useEffect(() => {
    const windows = gsap.utils.toArray<HTMLElement>(".sticker-window");
    windows.forEach((node) => {
      const delay = Number(node.dataset.delay || 0);
      const isMega = node.classList.contains("sticker-window--mega");
      gsap.fromTo(
        node,
        { autoAlpha: 0, y: isMega ? 120 : 80, scale: isMega ? 0.72 : 0.8 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: isMega ? 1.15 : 0.8,
          delay,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top 90%" },
        },
      );

      if (isMega) {
        gsap.to(node, {
          yPercent: -12,
          rotate: `+=${node.dataset.rotateDrift ?? "0"}`,
          ease: "none",
          scrollTrigger: {
            trigger: node.closest("section") ?? node,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
          },
        });
      }
    });
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const onPointerDown = (id: string, event: ReactPointerEvent<HTMLDivElement>) => {
    const pos = positions[id];
    dragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      baseX: pos.x,
      baseY: pos.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = ((event.clientX - drag.startX) / window.innerWidth) * 100;
    const dy = ((event.clientY - drag.startY) / window.innerHeight) * 100;
    setPositions((prev) => ({
      ...prev,
      [drag.id]: { ...prev[drag.id], x: drag.baseX + dx, y: drag.baseY + dy },
    }));
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onHover = (id: string) => {
    const nudges = [
      { x: 1.2, y: -0.8, r: 2.5 },
      { x: -0.9, y: 1.1, r: -2.2 },
      { x: 0.7, y: 0.8, r: 1.8 },
      { x: -1.1, y: -0.7, r: -2.7 },
    ];
    const currentCount = hoverCountRef.current[id] ?? 0;
    const nudge = nudges[currentCount % nudges.length];
    hoverCountRef.current[id] = currentCount + 1;
    setPositions((prev) => ({
      ...prev,
      [id]: {
        x: prev[id].x + nudge.x,
        y: prev[id].y + nudge.y,
        rotate: prev[id].rotate + nudge.r,
      },
    }));
  };

  return (
    <div className={`pointer-events-none absolute inset-0 z-[6] hidden md:block ${containerClassName}`}>
      {items.map((item) => {
        const pos = positions[item.id];
        return (
          <div
            key={item.id}
            data-delay={item.delay ?? 0}
            data-rotate-drift={item.w > 520 ? (item.rotate ?? 0) * 1.2 : 0}
            className={`sticker-window pointer-events-auto absolute cursor-grab active:cursor-grabbing ${
              item.w > 520 ? "sticker-window--mega" : ""
            }`}
            onPointerDown={(event) => onPointerDown(item.id, event)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onMouseEnter={() => onHover(item.id)}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: `${item.w}px`,
              transform: `translate(-50%, -50%) rotate(${pos.rotate}deg)`,
            }}
          >
            <Image src={item.src} alt="" aria-hidden width={item.w} height={item.w} className="h-auto w-full select-none" />
          </div>
        );
      })}
    </div>
  );
}
