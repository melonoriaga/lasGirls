"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTimeZoneForDisplay, getIanaTimeZoneIds } from "@/lib/admin/time-zones";

type Props = {
  id?: string;
  value: string;
  onChange: (iana: string) => void;
  disabled?: boolean;
};

export function TimeZonePicker({ id, value, onChange, disabled }: Props) {
  const allZones = useMemo(() => getIanaTimeZoneIds(), []);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 4000);
    return () => window.clearTimeout(t);
  }, [hint]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? allZones.filter((z) => z.toLowerCase().includes(q)).slice(0, 200) : allZones.slice(0, 300);
  }, [allZones, query]);

  const displayValue = value ? formatTimeZoneForDisplay(value) : "";

  const openDropdown = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const select = (tz: string) => {
    onChange(tz);
    setOpen(false);
    setQuery("");
  };

  const useBrowserTz = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) { setHint("No pudimos leer la zona de este navegador."); return; }
      onChange(tz);
      setOpen(false);
      setQuery("");
      setHint(`Listo: ${formatTimeZoneForDisplay(tz)}`);
    } catch {
      setHint("No pudimos leer la zona de este navegador.");
    }
  };

  return (
    <div ref={containerRef} className="grid gap-1.5">
      {/* Single row: combobox trigger + device button */}
      <div className="flex gap-2">
        {/* Trigger / selected value display */}
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={openDropdown}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-left text-sm text-zinc-900 transition hover:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:opacity-50"
        >
          <span className={`truncate ${!displayValue ? "text-zinc-400" : ""}`}>
            {displayValue || "Buscar zona (ciudad o región)…"}
          </span>
          <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Device timezone button */}
        <button
          type="button"
          disabled={disabled}
          onClick={useBrowserTz}
          className="shrink-0 rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-zinc-700 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
          title="Usar la zona horaria de este dispositivo"
        >
          Usar este dispositivo
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="relative z-50">
          <div className="absolute left-0 right-0 top-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            {/* Fixed search */}
            <div className="border-b border-zinc-100 px-2 py-2">
              <input
                ref={inputRef}
                type="search"
                className="block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-300 focus:outline-none focus:ring-1 focus:ring-rose-300"
                placeholder="Buscar (ej. Buenos Aires, UTC…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
            </div>
            {/* Scrollable list */}
            <ul className="max-h-56 overflow-y-auto" role="listbox">
              {filtered.length === 0 && (
                <li className="px-3 py-2.5 text-xs text-zinc-400">Sin resultados</li>
              )}
              {filtered.map((z) => (
                <li
                  key={z}
                  role="option"
                  aria-selected={z === value}
                  onMouseDown={() => select(z)}
                  className={`cursor-pointer px-3 py-2 text-sm transition ${
                    z === value
                      ? "bg-rose-50 font-medium text-rose-700"
                      : "text-zinc-800 hover:bg-zinc-50"
                  }`}
                >
                  {formatTimeZoneForDisplay(z)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Feedback */}
      {hint && (
        <p className="text-[11px] font-medium text-emerald-700" role="status" aria-live="polite">
          {hint}
        </p>
      )}
      {!hint && value && (
        <p className="text-[11px] text-zinc-500">
          Seleccionada: <strong className="text-zinc-700">{formatTimeZoneForDisplay(value)}</strong>
        </p>
      )}
    </div>
  );
}
