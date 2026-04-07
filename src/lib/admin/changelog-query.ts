import type { Query } from "firebase-admin/firestore";
import type { ChangelogFiltersInput } from "@/lib/admin/changelog-filters";
import { adminDb } from "@/lib/firebase/admin";

export type { ChangelogFiltersInput } from "@/lib/admin/changelog-filters";

/**
 * Consulta activityLogs con filtros opcionales.
 * Requiere índices compuestos en Firestore (ver firestore.indexes.json).
 */
export function buildActivityLogsQuery(filters: ChangelogFiltersInput): Query {
  let ref: Query = adminDb.collection("activityLogs");

  const action = filters.action?.trim();
  const actorUid = filters.actorUid?.trim();
  const from = filters.from?.trim();
  const to = filters.to?.trim();

  if (action) ref = ref.where("action", "==", action);
  if (actorUid) ref = ref.where("actorUid", "==", actorUid);
  if (from) ref = ref.where("createdAt", ">=", `${from}T00:00:00.000Z`);
  if (to) ref = ref.where("createdAt", "<=", `${to}T23:59:59.999Z`);

  return ref.orderBy("createdAt", "desc");
}
