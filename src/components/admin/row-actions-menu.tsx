"use client";

import Link from "next/link";
import { RiMore2Fill } from "@remixicon/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
};

type Props = {
  items: MenuItem[];
};

const MENU_MIN_WIDTH = 160;
const GAP = 4;
const VIEWPORT_PAD = 8;

export function RowActionsMenu({ items }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const close = useCallback(() => setOpen(false), []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(
      MENU_MIN_WIDTH,
      menu?.offsetWidth ?? MENU_MIN_WIDTH,
    );
    const menuHeight =
      menu?.offsetHeight ??
      Math.min(items.length * 40 + 8, 320);

    let left = rect.right - menuWidth;
    left = Math.max(
      VIEWPORT_PAD,
      Math.min(left, window.innerWidth - menuWidth - VIEWPORT_PAD),
    );

    let top = rect.bottom + GAP;
    if (top + menuHeight > window.innerHeight - VIEWPORT_PAD) {
      const above = rect.top - menuHeight - GAP;
      if (above >= VIEWPORT_PAD) {
        top = above;
      } else {
        top = Math.max(
          VIEWPORT_PAD,
          window.innerHeight - menuHeight - VIEWPORT_PAD,
        );
      }
    }

    setCoords({ top, left });
  }, [items.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    const onResizeOrScroll = () => updatePosition();
    window.addEventListener("resize", onResizeOrScroll);
    window.addEventListener("scroll", onResizeOrScroll, true);
    return () => {
      window.removeEventListener("resize", onResizeOrScroll);
      window.removeEventListener("scroll", onResizeOrScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const node = e.target as Node;
      if (triggerRef.current?.contains(node)) return;
      if (menuRef.current?.contains(node)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-9999 min-w-[140px] overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg"
      style={{ top: coords.top, left: coords.left }}
    >
      {items.map((item) =>
        item.href ? (
          <Link
            key={item.label}
            href={item.href}
            role="menuitem"
            className={`block px-3 py-2 text-xs ${
              item.danger
                ? "text-red-700 hover:bg-red-50"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            onClick={() => close()}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={`block w-full px-3 py-2 text-left text-xs ${
              item.danger
                ? "text-red-700 hover:bg-red-50"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            onClick={() => {
              close();
              item.onClick?.();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
        onClick={() => {
          setOpen((prev) => {
            if (!prev && triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              let left = rect.right - MENU_MIN_WIDTH;
              left = Math.max(
                VIEWPORT_PAD,
                Math.min(
                  left,
                  window.innerWidth - MENU_MIN_WIDTH - VIEWPORT_PAD,
                ),
              );
              setCoords({ top: rect.bottom + GAP, left });
            }
            return !prev;
          });
        }}
      >
        <RiMore2Fill className="size-4" aria-hidden />
        <span className="sr-only">Acciones</span>
      </button>
      {typeof document !== "undefined" && menu
        ? createPortal(menu, document.body)
        : null}
    </>
  );
}
