/** Returns normalized https URL or empty string if invalid. */
export function normalizePartnerLinkUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  try {
    const u = new URL(t.startsWith("http") ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.toString();
  } catch {
    return "";
  }
}
