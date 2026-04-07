/**
 * Interpreta textos libres tipo "Lun-Vie 9 a 18" o "9-18" para mostrar estado
 * "dentro de horario" en la zona horaria del navegador del visitante.
 * Si no se puede interpretar, devuelve null (solo se muestra el texto).
 */
export type ParsedWorkingHours = {
  /** 0 = domingo … 6 = sábado */
  workdays: Set<number>;
  startMinutes: number;
  endMinutes: number;
};

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

/** Busca el primer rango horario tipo 9-18, 9:30 a 18, 9hs a 18hs */
function parseTimeRange(text: string): { start: number; end: number } | null {
  const patterns = [
    /(\d{1,2})\s*:\s*(\d{2})\s*(?:h|hs|hrs)?\s*(?:a|to|-|–|hasta)\s*(\d{1,2})\s*:\s*(\d{2})/i,
    /(\d{1,2})\s*(?:h|hs|hrs|:)?\s*(?:a|to|-|–|hasta)\s*(\d{1,2})\s*(?:h|hs|hrs)?/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    if (m.length >= 5 && m[4] !== undefined) {
      const h1 = clampHour(Number(m[1]));
      const min1 = clampMin(Number(m[2]));
      const h2 = clampHour(Number(m[3]));
      const min2 = clampMin(Number(m[4]));
      return { start: h1 * 60 + min1, end: h2 * 60 + min2 };
    }
    const h1 = clampHour(Number(m[1]));
    const h2 = clampHour(Number(m[2]));
    if (Number.isFinite(h1) && Number.isFinite(h2) && h2 > h1) {
      return { start: h1 * 60, end: h2 * 60 };
    }
  }
  return null;
}

function clampHour(h: number): number {
  if (!Number.isFinite(h) || h < 0 || h > 23) return NaN;
  return h;
}

function clampMin(m: number): number {
  if (!Number.isFinite(m) || m < 0 || m > 59) return 0;
  return m;
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
    startMinutes: range.start,
    endMinutes: range.end,
  };
}

/** `now` en hora local del entorno (navegador o servidor) */
export function isNowWithinWorkingHours(parsed: ParsedWorkingHours, now: Date): boolean {
  const dow = now.getDay();
  if (!parsed.workdays.has(dow)) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= parsed.startMinutes && mins < parsed.endMinutes;
}
