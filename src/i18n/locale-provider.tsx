"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { dictionaries, type Locale } from "@/i18n/messages";

export const LOCALE_STORAGE_KEY = "las-girls-locale";

export type { Locale };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof makeT>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getPath(obj: Record<string, unknown>, pathParts: string[]): unknown {
  let cur: unknown = obj;
  for (const p of pathParts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** Dot-path translator; interpolates `{name}` placeholders. */
export function makeT(messages: Record<string, unknown>) {
  return function t(key: string, vars?: Record<string, string>): string {
    const parts = key.split(".").flatMap((p) => {
      const m = /^(\w+)\[(\d+)\]$/.exec(p);
      return m ? [m[1], m[2]] : [p];
    });
    const raw = getPath(messages, parts);
    if (typeof raw !== "string") return key;
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
  };
}

export function fallbackLocale(navigatorLang: string): Locale {
  const base = navigatorLang.toLowerCase();
  return base.startsWith("es") ? "es" : "en";
}

function readStoredLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (v === "es" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Syncs `<html lang>` with current locale after mount. */
function HtmlLang({ locale }: { locale: Locale }) {
  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "es";
    document.documentElement.setAttribute(
      "data-locale",
      locale,
    );
  }, [locale]);
  return null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const stored = readStoredLocale();
    if (stored) {
      setLocaleState(stored);
      return;
    }
    setLocaleState(fallbackLocale(navigator.language || "es"));
  }, []);

  const setLocale = useCallback((next: Locale) => {
    if (next === locale) return;

    let y = 0;
    if (typeof window !== "undefined") {
      const lenis = (
        window as unknown as {
          __lenis?: { scroll: number; scrollTo: (n: number, o: { immediate?: boolean; force?: boolean }) => void };
        }
      ).__lenis;
      y = lenis ? lenis.scroll : window.scrollY;
    }

    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }

    if (typeof window === "undefined") return;

    queueMicrotask(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const lenis = (
            window as unknown as {
              __lenis?: { scrollTo: (n: number, o: { immediate?: boolean; force?: boolean }) => void };
            }
          ).__lenis;
          if (lenis) {
            lenis.scrollTo(y, { immediate: true, force: true });
          } else {
            window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
          }
        });
      });
    });
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    const dict =
      dictionaries[locale] as unknown as Record<string, unknown>;
    return {
      locale,
      setLocale,
      t: makeT(dict),
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <HtmlLang locale={locale} />
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useLocaleOptional(): LocaleContextValue | null {
  return useContext(LocaleContext);
}

export function useDictionary() {
  const { locale } = useLocale();
  return useMemo(() => dictionaries[locale], [locale]);
}
