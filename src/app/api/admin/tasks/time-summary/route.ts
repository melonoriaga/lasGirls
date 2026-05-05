import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type SummaryRow = {
  month: string;
  clientId: string;
  clientName: string;
  totalMinutes: number;
  tasksCount: number;
  users: Array<{ userId: string; userName: string; minutes: number; percentage: number }>;
  tasks: Array<{ taskId: string; taskTitle: string; minutes: number }>;
};

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const month = String(searchParams.get("month") ?? new Date().toISOString().slice(0, 7));
  const clientIdFilter = String(searchParams.get("clientId") ?? "");
  const userIdFilter = String(searchParams.get("userId") ?? "");
  const sourceFilter = String(searchParams.get("source") ?? "all");

  const entriesSnap = await adminDb.collection("taskTimeEntries").where("assignedMonth", "==", month).orderBy("date", "desc").limit(3000).get();
  if (entriesSnap.empty) return NextResponse.json({ ok: true, month, rows: [] });

  const taskIds = [...new Set(entriesSnap.docs.map((doc) => String((doc.data() as Record<string, unknown>).taskId ?? "")).filter(Boolean))];
  const taskSnaps = await Promise.all(taskIds.map((id) => adminDb.collection("tasks").doc(id).get()));
  const taskById = new Map(
    taskSnaps
      .filter((snap) => snap.exists)
      .map((snap) => [snap.id, snap.data() as Record<string, unknown>]),
  );

  const grouped = new Map<
    string,
    {
      month: string;
      clientId: string;
      clientName: string;
      totalMinutes: number;
      byUser: Map<string, { userId: string; userName: string; minutes: number }>;
      byTask: Map<string, { taskId: string; taskTitle: string; minutes: number }>;
    }
  >();

  for (const doc of entriesSnap.docs) {
    const entry = doc.data() as Record<string, unknown>;
    const taskId = String(entry.taskId ?? "");
    const task = taskById.get(taskId);
    if (!task || !canAccessRecord(task, actor.uid)) continue;

    const clientId = String(entry.clientId ?? task.clientId ?? "");
    if (clientIdFilter && clientId !== clientIdFilter) continue;
    const userId = String(entry.userId ?? "");
    if (userIdFilter && userId !== userIdFilter) continue;
    const source = String(entry.source ?? "manual");
    if (sourceFilter !== "all" && source !== sourceFilter) continue;
    const status = String(entry.status ?? "completed");
    if (status === "running" || status === "cancelled") continue;

    const key = `${month}::${clientId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        month,
        clientId,
        clientName: String(task.clientName ?? "Cliente"),
        totalMinutes: 0,
        byUser: new Map(),
        byTask: new Map(),
      });
    }
    const bucket = grouped.get(key)!;
    const minutes = Math.max(0, Number(entry.minutes ?? 0));
    bucket.totalMinutes += minutes;

    const userName = String(entry.userName ?? "");
    const userRow = bucket.byUser.get(userId) ?? { userId, userName, minutes: 0 };
    userRow.minutes += minutes;
    if (!userRow.userName) userRow.userName = userName;
    bucket.byUser.set(userId, userRow);

    const taskTitle = String(task.title ?? taskId);
    const taskRow = bucket.byTask.get(taskId) ?? { taskId, taskTitle, minutes: 0 };
    taskRow.minutes += minutes;
    bucket.byTask.set(taskId, taskRow);
  }

  const rows: SummaryRow[] = [...grouped.values()]
    .map((item) => {
      const users = [...item.byUser.values()]
        .map((row) => ({
          ...row,
          percentage: item.totalMinutes > 0 ? Math.round((row.minutes / item.totalMinutes) * 100) : 0,
        }))
        .sort((a, b) => b.minutes - a.minutes);
      const tasks = [...item.byTask.values()].sort((a, b) => b.minutes - a.minutes);
      return {
        month: item.month,
        clientId: item.clientId,
        clientName: item.clientName,
        totalMinutes: item.totalMinutes,
        tasksCount: tasks.length,
        users,
        tasks,
      };
    })
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return NextResponse.json({ ok: true, month, rows });
}

