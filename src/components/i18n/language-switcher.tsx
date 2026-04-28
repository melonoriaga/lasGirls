"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/locale-provider";
import type { Locale } from "@/i18n/messages";

const CHOICES: { id: Locale; labelKey: "es" | "en" }[] = [
  { id: "es", labelKey: "es" },
  { id: "en", labelKey: "en" },
];

type Props = {
  className?: string;
  /** Tighter grouping for stacked footer row. */
  compact?: boolean;
  /**
   * `header`: pastel shell + dark text for readability on light or black sections.
   * `footer`: same shell on the dark footer strip.
   */
  variant?: "header" | "footer";
};

export function LanguageSwitcher({ className, compact, variant = "footer" }: Props) {
  const { locale, setLocale, t } = useLocale();

  const shell =
    variant === "header"
      ? cn(
          "border border-black/15 bg-[#ffd6e8]/95 text-neutral-900 backdrop-blur-md",
          "shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_2px_16px_rgba(0,0,0,0.2)]",
        )
      : "border border-black/10 bg-[#ffd6e8]/95 text-neutral-900 shadow-[0_2px_14px_rgba(0,0,0,0.2)] backdrop-blur-md";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full p-0.5 touch-manipulation",
        shell,
        compact ? "gap-0" : "gap-1",
        className,
      )}
      role="group"
      aria-label={t("lang.label")}
    >
      {CHOICES.map(({ id, labelKey }) => {
        const active = locale === id;
        return (
          <button
            key={id}
            type="button"
            onMouseDown={(e) => {
              /** Reduces focus-scroll / layout jump on tap (esp. footer / iOS). */
              if (e.button === 0) e.preventDefault();
            }}
            onClick={() => setLocale(id)}
            className={cn(
              "rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] transition-colors md:px-3",
              "outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#ff3ea5]",
              active
                ? "bg-[#ff3ea5] text-black shadow-inner"
                : "text-neutral-800/85 hover:bg-black/[0.06] hover:text-neutral-950",
            )}
            aria-pressed={active}
          >
            {t(`lang.${labelKey}`)}
          </button>
        );
      })}
    </div>
  );
}
