import type { ExpenseMember } from "@/types/expenses";

/** Mapa UID → nombre para UI (seguro en cliente; sin Firebase Admin). */
export function memberNameMap(members: ExpenseMember[]): Record<string, string> {
  return Object.fromEntries(members.map((m) => [m.id, m.name]));
}
