"use client";

import { useEffect, useMemo, useState } from "react";
import { formatTimeZoneForDisplay, getIanaTimeZoneIds } from "@/lib/admin/time-zones";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

type Props = {
  id?: string;
  value: string;
  onChange: (iana: string) => void;
  disabled?: boolean;
};

export function TimeZonePicker({ id, value, onChange, disabled }: Props) {
  const allZones = useMemo(() => getIanaTimeZoneIds(), []);
  const [filter, setFilter] = useState("");
  const [appliedHint, setAppliedHint] = useState<string | null>(null);

  useEffect(() => {
    if (!appliedHint) return;
    const t = window.setTimeout(() => setAppliedHint(null), 4000);
    return () => window.clearTimeout(t);
  }, [appliedHint]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const base = q ? allZones.filter((z) => z.toLowerCase().includes(q)) : allZones;
    const cap = q ? 220 : 500;
    let list = base.slice(0, cap);
    if (value && allZones.includes(value) && !list.includes(value)) {
      list = [value, ...list].slice(0, cap + 1);
    }
    return list;
  }, [allZones, filter, value]);

  /** El valor actual tiene que existir como <option> o el select se ve vacío. */
  const valueMissingFromOptions = Boolean(value.trim()) && !filtered.includes(value);

  const useBrowserTz = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) {
        setAppliedHint("No pudimos leer la zona de este navegador.");
        return;
      }
      setFilter("");
      onChange(tz);
      setAppliedHint(`Listo: ${formatTimeZoneForDisplay(tz)}`);
    } catch {
      setAppliedHint("No pudimos leer la zona de este navegador.");
    }
  };

  return (
    <div className="grid gap-2">
      <label htmlFor={id ? `${id}-filter` : undefined} className="text-[11px] font-medium text-zinc-500">
        Buscar zona (ciudad o región)
      </label>
      <input
        id={id ? `${id}-filter` : undefined}
        type="search"
        className={inputClass}
        placeholder="Ej. Buenos Aires, Madrid, UTC…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        disabled={disabled}
        autoComplete="off"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={useBrowserTz}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
        >
          Usar zona de este dispositivo
        </button>
      </div>
      {appliedHint ? (
        <p className="text-[11px] font-medium text-emerald-800" role="status" aria-live="polite">
          {appliedHint}
        </p>
      ) : null}
      <label htmlFor={id} className="text-[11px] font-medium text-zinc-500">
        Zona horaria IANA
      </label>
      <select
        id={id}
        className={`${inputClass} pr-8`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">— Elegir —</option>
        {valueMissingFromOptions ? (
          <option value={value}>{formatTimeZoneForDisplay(value)}</option>
        ) : null}
        {filtered.map((z) => (
          <option key={z} value={z}>
            {formatTimeZoneForDisplay(z)}
          </option>
        ))}
      </select>
      {value.trim() ? (
        <p className="text-[11px] text-zinc-600">
          Seleccionada: <strong className="text-zinc-800">{formatTimeZoneForDisplay(value)}</strong>
        </p>
      ) : (
        <p className="text-[11px] text-zinc-500">
          Si no elegís una zona, el equipo no podrá ver tu horario con precisión en las tarjetas.
        </p>
      )}
    </div>
  );
}
