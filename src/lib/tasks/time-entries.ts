import { adminDb } from "@/lib/firebase/admin";

export function resolveAssignedMonth(dateRaw: string, assignedMonthRaw: string, fallbackMonth: string): string {
  if (/^\d{4}-\d{2}$/.test(assignedMonthRaw)) return assignedMonthRaw;
  if (/^\d{4}-\d{2}/.test(dateRaw)) return dateRaw.slice(0, 7);
  return fallbackMonth;
}

export function parseMinutesInput(input: unknown): number {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, Math.round(input));
  if (typeof input !== "string") return 0;
  const raw = input.trim().toLowerCase();
  if (!raw) return 0;

  const direct = Number(raw.replace(",", "."));
  if (Number.isFinite(direct) && direct > 0) {
    return Math.round(direct <= 24 ? direct * 60 : direct);
  }

  let total = 0;
  const hoursMatches = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(h|hs|hora|horas)\b/g)];
  const minutesMatches = [...raw.matchAll(/(\d+(?:[.,]\d+)?)\s*(m|min|mins|minuto|minutos)\b/g)];
  for (const match of hoursMatches) {
    total += Math.round(Number(match[1].replace(",", ".")) * 60);
  }
  for (const match of minutesMatches) {
    total += Math.round(Number(match[1].replace(",", ".")));
  }
  return Math.max(0, total);
}

export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function isActorAdmin(uid: string): Promise<boolean> {
  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) return false;
  const role = String((userSnap.data() as Record<string, unknown>)?.role ?? "").toLowerCase();
  return role === "admin" || role === "superadmin";
}

export async function recomputeTaskTimeTotals(taskId: string, clientId: string): Promise<void> {
  const entriesSnap = await adminDb.collection("taskTimeEntries").where("taskId", "==", taskId).get();
  let totalMinutes = 0;
  const byUser: Record<string, number> = {};
  for (const doc of entriesSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const status = String(data.status ?? "completed");
    const minutes = Number(data.minutes ?? 0);
    const userId = String(data.userId ?? "");
    if (!Number.isFinite(minutes) || minutes <= 0 || status === "cancelled" || status === "running") continue;
    totalMinutes += minutes;
    byUser[userId] = (byUser[userId] ?? 0) + minutes;
  }

  const payload = { timeTotalMinutes: totalMinutes, timeByUserMinutes: byUser, updatedAt: new Date().toISOString() };
  await Promise.all([
    adminDb.collection("tasks").doc(taskId).set(payload, { merge: true }),
    clientId ? adminDb.collection("clients").doc(clientId).collection("tasks").doc(taskId).set(payload, { merge: true }) : Promise.resolve(),
  ]);
}

export async function getRunningTimerForUser(userId: string): Promise<{ id: string; taskId: string; startedAt: string } | null> {
  // Single-field query + filter in memory (matches running-timer GET) so we don't depend on a composite index.
  const snap = await adminDb.collection("taskTimeEntries").where("userId", "==", userId).limit(200).get();
  const row = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<string, unknown> & { id: string })
    .filter((data) => String(data.source ?? "") === "timer" && String(data.status ?? "") === "running")
    .sort((a, b) => String(b.startedAt ?? "").localeCompare(String(a.startedAt ?? "")))[0];
  if (!row) return null;
  return { id: row.id, taskId: String(row.taskId ?? ""), startedAt: String(row.startedAt ?? "") };
}

