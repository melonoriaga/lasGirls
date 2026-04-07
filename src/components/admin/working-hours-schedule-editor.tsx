"use client";

import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { formatWorkdaysShort } from "@/lib/admin/working-hours";

const inputTimeClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-2 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

export type IntervalRow = { start: string; end: string };

const DAY_DEF: { bit: number; label: string }[] = [
  { bit: 1, label: "Lun" },
  { bit: 2, label: "Mar" },
  { bit: 3, label: "Mié" },
  { bit: 4, label: "Jue" },
  { bit: 5, label: "Vie" },
  { bit: 6, label: "Sáb" },
  { bit: 0, label: "Dom" },
];

type Props = {
  workdays: number[];
  onWorkdaysChange: (days: number[]) => void;
  intervals: IntervalRow[];
  onIntervalsChange: (rows: IntervalRow[]) => void;
  disabled?: boolean;
};

export function WorkingHoursScheduleEditor({
  workdays,
  onWorkdaysChange,
  intervals,
  onIntervalsChange,
  disabled,
}: Props) {
  const toggleDay = (d: number) => {
    if (disabled) return;
    const set = new Set(workdays);
    if (set.has(d)) set.delete(d);
    else set.add(d);
    onWorkdaysChange([...set].sort((a, b) => a - b));
  };

  const updateRow = (index: number, field: "start" | "end", value: string) => {
    const next = intervals.map((row, i) => (i === index ? { ...row, [field]: value } : row));
    onIntervalsChange(next);
  };

  const addRow = () => {
    onIntervalsChange([...intervals, { start: "", end: "" }]);
  };

  const removeRow = (index: number) => {
    onIntervalsChange(intervals.filter((_, i) => i !== index));
  };

  const preview = workdays.length ? formatWorkdaysShort(new Set(workdays)) : "—";

  return (
    <div className="grid gap-3">
      <div>
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Días laborales</span>
        <p className="mt-1 text-[11px] text-zinc-500">Los intervalos de abajo aplican a cada día marcado.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DAY_DEF.map(({ bit, label }) => {
            const on = workdays.includes(bit);
            return (
              <button
                key={bit}
                type="button"
                disabled={disabled}
                onClick={() => toggleDay(bit)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-50 ${
                  on
                    ? "border-rose-300 bg-rose-200 text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          Vista previa: <strong className="text-zinc-700">{preview}</strong>
        </p>
      </div>

      <div>
        <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Intervalos (uno o varios por día)</span>
        <p className="mt-1 text-[11px] text-zinc-500">
          Ej.: 08:30–13:00 y 14:00–18:00 si cortás por almuerzo u otra actividad.
        </p>
        <ul className="mt-2 grid gap-2">
          {intervals.map((row, i) => (
            <li
              key={i}
              className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-2 sm:flex-nowrap"
            >
              <label className="grid flex-1 gap-0.5 text-[10px] font-medium text-zinc-500 sm:min-w-[120px]">
                Desde
                <input
                  type="time"
                  className={inputTimeClass}
                  value={row.start}
                  onChange={(e) => updateRow(i, "start", e.target.value)}
                  disabled={disabled}
                />
              </label>
              <label className="grid flex-1 gap-0.5 text-[10px] font-medium text-zinc-500 sm:min-w-[120px]">
                Hasta
                <input
                  type="time"
                  className={inputTimeClass}
                  value={row.end}
                  onChange={(e) => updateRow(i, "end", e.target.value)}
                  disabled={disabled}
                />
              </label>
              <button
                type="button"
                disabled={disabled || intervals.length <= 1}
                onClick={() => removeRow(i)}
                className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                aria-label="Quitar intervalo"
              >
                <RiDeleteBinLine className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          disabled={disabled}
          onClick={addRow}
          className="mt-2 inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RiAddLine className="size-4" aria-hidden />
          Agregar intervalo
        </button>
      </div>
    </div>
  );
}
