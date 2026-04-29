/** Normalize VIP discount codes for storage / lookup (e.g. JEAN20OFF). */
export function normalizeVipCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function isValidVipCodePattern(code: string): boolean {
  return /^[A-Z0-9]{4,40}$/.test(code);
}
