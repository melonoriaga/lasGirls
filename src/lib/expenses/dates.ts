/** Normaliza fecha del form (YYYY-MM-DD o ISO) a ISO UTC medianoche del día civil. */
export function normalizeMovementDateInput(input: string): string {
  const trimmed = input.trim();
  const dm = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dm) {
    const y = Number(dm[1]);
    const mo = Number(dm[2]);
    const d = Number(dm[3]);
    return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0)).toISOString();
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Fecha inválida.");
  }
  return new Date(
    Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0, 0),
  ).toISOString();
}

export function periodIdFromMovementDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
