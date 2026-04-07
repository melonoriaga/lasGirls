/** Lista acotada si el motor no expone `Intl.supportedValuesOf("timeZone")`. */
const FALLBACK_IANA_ZONES = [
  "UTC",
  "America/Argentina/Buenos_Aires",
  "America/Argentina/Cordoba",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/**
 * IDs IANA ordenados (p. ej. `America/Argentina/Buenos_Aires`).
 * En navegadores y Node recientes usa la lista completa del motor.
 */
export function getIanaTimeZoneIds(): string[] {
  try {
    if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl && typeof Intl.supportedValuesOf === "function") {
      const list = Intl.supportedValuesOf("timeZone");
      return [...list].sort((a, b) => a.localeCompare(b));
    }
  } catch {
    // ignore
  }
  return [...FALLBACK_IANA_ZONES].sort((a, b) => a.localeCompare(b));
}

/** Nombre legible en español + ID entre paréntesis cuando aplica */
export function formatTimeZoneForDisplay(iana: string, locale = "es-AR"): string {
  const raw = iana.trim();
  if (!raw) return "";
  try {
    const name =
      new Intl.DateTimeFormat(locale, {
        timeZone: raw,
        timeZoneName: "long",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    return name && name !== raw ? `${name} · ${raw}` : raw;
  } catch {
    return raw;
  }
}
