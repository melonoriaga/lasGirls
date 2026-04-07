/**
 * Horarios: varios intervalos por día (ej. mañana + tarde) + días laborales.
 * Compatibilidad con `workingHours` texto libre antiguo.
 */

export type ParsedWorkingHours = {
  /** 0 = domingo … 6 = sábado */
  workdays: Set<number>;
  /** Varios rangos en el mismo día (ej. comida, gym) */
  intervals: Array<{ startMinutes: number; endMinutes: number }>;
};

export type WorkingHoursIntervalStored = { start: string; end: string };

const DEFAULT_WORKDAYS = [1, 2, 3, 4, 5];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Lun–Vie por defecto si no hay días en el texto */
function parseWorkdays(text: string): Set<number> {
  const t = normalize(text);
  const days = new Set<number>();
  const addRange = (from: number, to: number) => {
    for (let d = from; d <= to; d++) days.add(((d % 7) + 7) % 7);
  };

  if (/\blun[\s-–]*vie\b|\blunes[\s-–]*viernes\b|\bweekdays\b|\blun a vie\b/.test(t)) {
    addRange(1, 5);
    return days;
  }
  if (/\blun[\s-–]*sab\b|\blunes[\s-–]*sabado\b/.test(t)) {
    addRange(1, 6);
    return days;
  }
  if (/\btodos[\s-–]*los[\s-–]*d[ií]as\b|\bevery day\b|\b7[\s-–]*d[ií]as\b/.test(t)) {
    addRange(0, 6);
    return days;
  }

  const tokenToDay: [RegExp, number][] = [
    [/\bdom|domingo\b/, 0],
    [/\blun|lunes\b/, 1],
    [/\bmar|martes\b/, 2],
    [/\bmie|miercoles|miércoles\b/, 3],
    [/\bjue|jueves\b/, 4],
    [/\bvie|viernes\b/, 5],
    [/\bsab|sábado|sabado\b/, 6],
  ];
  for (const [re, d] of tokenToDay) {
    if (re.test(t)) days.add(d);
  }

  if (days.size === 0) {
    addRange(1, 5);
  }
  return days;
}

function clampHour(h: number): number {
  if (!Number.isFinite(h) || h < 0 || h > 23) return NaN;
  return h;
}

function clampMin(m: number): number {
  if (!Number.isFinite(m) || m < 0 || m > 59) return 0;
  return m;
}

/** Busca el primer rango: 9-18, 9:30 a 18:00, 8:30 a 23hs, etc. */
function parseTimeRange(text: string): { start: number; end: number } | null {
  let m = text.match(
    /(\d{1,2})\s*:\s*(\d{2})\s*(?:h|hs|hrs)?\s*(?:a|to|-|–|hasta)\s*(\d{1,2})\s*:\s*(\d{2})\s*(?:h|hs|hrs)?/i,
  );
  if (m) {
    const h1 = clampHour(Number(m[1]));
    const min1 = clampMin(Number(m[2]));
    const h2 = clampHour(Number(m[3]));
    const min2 = clampMin(Number(m[4]));
    if (Number.isFinite(h1) && Number.isFinite(h2)) {
      const s = h1 * 60 + min1;
      const e = h2 * 60 + min2;
      if (e > s) return { start: s, end: e };
    }
  }
  m = text.match(
    /(\d{1,2})\s*:\s*(\d{2})\s*(?:h|hs|hrs)?\s*(?:a|to|-|–|hasta)\s*(\d{1,2})\s*(?:h|hs|hrs)?/i,
  );
  if (m) {
    const h1 = clampHour(Number(m[1]));
    const min1 = clampMin(Number(m[2]));
    const h2 = clampHour(Number(m[3]));
    if (Number.isFinite(h1) && Number.isFinite(h2)) {
      const s = h1 * 60 + min1;
      const e = h2 * 60;
      if (e > s) return { start: s, end: e };
    }
  }
  m = text.match(/(\d{1,2})\s*(?:h|hs|hrs)?\s*(?:a|to|-|–|hasta)\s*(\d{1,2})\s*(?:h|hs|hrs)?/i);
  if (m) {
    const h1 = clampHour(Number(m[1]));
    const h2 = clampHour(Number(m[2]));
    if (Number.isFinite(h1) && Number.isFinite(h2) && h2 > h1) {
      return { start: h1 * 60, end: h2 * 60 };
    }
  }
  return null;
}

export function parseWorkingHoursField(raw: string | undefined | null): ParsedWorkingHours | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const range = parseTimeRange(text);
  if (!range || !Number.isFinite(range.start) || !Number.isFinite(range.end)) return null;
  if (range.end <= range.start) return null;
  const workdays = parseWorkdays(text);
  return {
    workdays,
    intervals: [{ startMinutes: range.start, endMinutes: range.end }],
  };
}

/** Normaliza "9:5" → minutos; acepta HH:mm de input type="time". */
export function parseHmToMinutes(hm: string): number | null {
  const t = hm.trim();
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export function formatMinutesAsHm(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeWorkdaysArray(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_WORKDAYS];
  const out: number[] = [];
  for (const n of raw) {
    if (typeof n === "number" && n >= 0 && n <= 6 && !out.includes(n)) out.push(n);
  }
  out.sort((a, b) => a - b);
  return out.length ? out : [...DEFAULT_WORKDAYS];
}

function intervalsFromStored(rows: WorkingHoursIntervalStored[]): Array<{ startMinutes: number; endMinutes: number }> | null {
  const out: Array<{ startMinutes: number; endMinutes: number }> = [];
  for (const row of rows) {
    const a = parseHmToMinutes(row.start);
    const b = parseHmToMinutes(row.end);
    if (a === null || b === null) continue;
    if (b <= a) continue;
    out.push({ startMinutes: a, endMinutes: b });
  }
  return out.length ? out : null;
}

/**
 * Prioridad: `workingHoursIntervals` en Firestore; si no hay, texto `workingHours` legacy.
 */
export function parseUserWorkingSchedule(user: {
  workingHoursIntervals?: unknown;
  workdays?: unknown;
  workingHours?: string | null;
}): ParsedWorkingHours | null {
  const rawIntervals = user.workingHoursIntervals;
  if (Array.isArray(rawIntervals) && rawIntervals.length > 0) {
    const rows: WorkingHoursIntervalStored[] = [];
    for (const item of rawIntervals) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (typeof o.start !== "string" || typeof o.end !== "string") continue;
      rows.push({ start: o.start, end: o.end });
    }
    const intervals = intervalsFromStored(rows);
    if (!intervals) return null;
    const wd = normalizeWorkdaysArray(user.workdays);
    return { workdays: new Set(wd), intervals };
  }
  return parseWorkingHoursField(user.workingHours ?? "");
}

const DAY_SHORT_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatWorkdaysShort(workdays: Set<number>): string {
  const arr = [...workdays].sort((a, b) => a - b);
  if (arr.length === 7) return "Todos los días";
  if (arr.length === 5 && [1, 2, 3, 4, 5].every((d) => workdays.has(d))) return "Lun–Vie";
  if (arr.length === 2 && workdays.has(0) && workdays.has(6)) return "Fin de semana";
  return arr.map((d) => DAY_SHORT_ES[d] ?? "?").join(", ");
}

export function formatScheduleSummary(workdays: number[], intervals: WorkingHoursIntervalStored[]): string {
  if (!intervals.length) return "";
  const wd = formatWorkdaysShort(new Set(workdays));
  const ranges = intervals
    .map(({ start, end }) => `${start}–${end}`)
    .filter(Boolean)
    .join(", ");
  return `${wd} · ${ranges}`;
}

/** Para el dashboard: hay intervalos guardados o texto legacy. */
export function userHasWorkingScheduleData(d: Record<string, unknown>): boolean {
  const intervals = d.workingHoursIntervals;
  if (Array.isArray(intervals)) {
    for (const row of intervals) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      if (typeof o.start === "string" && o.start.trim() && typeof o.end === "string" && o.end.trim()) return true;
    }
  }
  return String(d.workingHours ?? "").trim().length > 0;
}

const WEEKDAY_SHORT_EN: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getWallClockInIanaTimeZone(date: Date, iana: string): { dow: number; minutes: number } | null {
  const tz = iana.trim();
  if (!tz) return null;
  try {
    const wdStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(date);
    const dow = WEEKDAY_SHORT_EN[wdStr];
    if (dow === undefined) return null;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === "hour")?.value);
    const m = Number(parts.find((p) => p.type === "minute")?.value);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return { dow, minutes: h * 60 + m };
  } catch {
    return null;
  }
}

export function isNowWithinWorkingHoursInTimeZone(
  parsed: ParsedWorkingHours,
  iana: string | undefined | null,
  now: Date,
): boolean | null {
  const wall = getWallClockInIanaTimeZone(now, String(iana ?? ""));
  if (!wall) return null;
  if (!parsed.workdays.has(wall.dow)) return false;
  return parsed.intervals.some(
    ({ startMinutes, endMinutes }) => wall.minutes >= startMinutes && wall.minutes < endMinutes,
  );
}

/** @deprecated */
export function isNowWithinWorkingHours(parsed: ParsedWorkingHours, now: Date): boolean {
  const dow = now.getDay();
  if (!parsed.workdays.has(dow)) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return parsed.intervals.some(
    ({ startMinutes, endMinutes }) => mins >= startMinutes && mins < endMinutes,
  );
}
