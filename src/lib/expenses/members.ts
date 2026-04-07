import type { ExpenseMember } from "@/types/expenses";
import type { MergedTeamUser } from "@/lib/admin/team-users";
import { listMergedTeamUsers } from "@/lib/admin/team-users";

function teamUserDisplayName(u: MergedTeamUser): string {
  const n = (u.fullName ?? "").trim();
  if (n) return n;
  const em = (u.authEmail ?? u.email ?? "").trim();
  if (em) return em;
  const un = (u.username ?? "").trim();
  if (un) return `@${un}`;
  return `Usuario ${u.id.slice(0, 6)}…`;
}

/**
 * Integrantes elegibles para repartir gastos: cuentas reales de Firebase Auth activas
 * (mismo universo que el listado de equipo en admin).
 */
export async function listExpenseSharingMembers(): Promise<ExpenseMember[]> {
  const team = await listMergedTeamUsers();
  const eligible = team.filter((u) => u.hasAuthAccount && !u.authDisabled && u.isActive !== false);
  const now = new Date().toISOString();

  const rows: ExpenseMember[] = eligible.map((u) => {
    const emailRaw = (u.authEmail ?? u.email ?? "").trim();
    const usernameRaw = (u.username ?? "").trim();
    const photoRaw = (u.photoURL ?? "").trim();
    const base: ExpenseMember = {
      /** UID de Firebase Auth — se guarda en movimientos como memberId */
      id: u.id,
      name: teamUserDisplayName(u),
      active: true,
      createdAt: typeof u.createdAt === "string" ? u.createdAt : now,
      updatedAt: typeof u.lastLoginAt === "string" ? u.lastLoginAt : now,
    };
    const out: ExpenseMember = { ...base };
    if (emailRaw) out.email = emailRaw;
    if (usernameRaw) out.username = usernameRaw;
    if (photoRaw) out.photoURL = photoRaw;
    return out;
  });

  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

const allowedIdSet = (members: ExpenseMember[]) => new Set(members.map((m) => m.id));

/** Valida que todos los memberId existan en el equipo con sesión (Auth). */
export function assertExpenseMemberIdsInTeam(memberIds: string[], team: ExpenseMember[]): void {
  const allowed = allowedIdSet(team);
  for (const id of memberIds) {
    if (!id) continue;
    if (!allowed.has(id)) {
      throw new Error(
        "Participante no válido: solo podés incluir usuarios del equipo con cuenta activa (Firebase Auth).",
      );
    }
  }
}
