import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function adminJson(body: Record<string, unknown>, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function serializeRouteError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (rec.code != null) return String(rec.code);
  }
  return "Error al cargar el panel de tiempos.";
}

function prevMonthKey(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function daysInCalendarMonth(monthKey: string): number {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return 31;
  return new Date(y, m, 0).getDate();
}

function taskBelongsToMonth(task: Record<string, unknown>, monthKey: string): boolean {
  const assignedMonth = String(task.assignedMonth ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(assignedMonth)) return assignedMonth === monthKey;
  const dueDate = String(task.dueDate ?? "");
  if (/^\d{4}-\d{2}/.test(dueDate)) return dueDate.slice(0, 7) === monthKey;
  const createdAt = String(task.createdAt ?? "");
  if (/^\d{4}-\d{2}/.test(createdAt)) return createdAt.slice(0, 7) === monthKey;
  return false;
}

function toIso(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return "";
    }
  }
  return String(value);
}

export async function GET(request: Request) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return adminJson({ ok: false, error: "No autorizado." }, 401);

    const { searchParams } = new URL(request.url);
    const month = String(searchParams.get("month") ?? new Date().toISOString().slice(0, 7));
    const clientIdFilter = String(searchParams.get("clientId") ?? "");
    const userIdFilter = String(searchParams.get("userId") ?? "");
    const taskIdFilter = String(searchParams.get("taskId") ?? "");

    const prevKey = prevMonthKey(month);
    const dim = daysInCalendarMonth(month);

    // Single-field queries only (no assignedMonth + date composite index); sort in memory.
    const [currentSnap, prevSnap, allTasksSnap] = await Promise.all([
      adminDb.collection("taskTimeEntries").where("assignedMonth", "==", month).limit(3000).get(),
      adminDb.collection("taskTimeEntries").where("assignedMonth", "==", prevKey).limit(3000).get(),
      adminDb.collection("tasks").orderBy("createdAt", "desc").limit(800).get(),
    ]);

  const taskIdsFromEntries = new Set<string>();
  currentSnap.docs.forEach((d) => taskIdsFromEntries.add(String((d.data() as Record<string, unknown>).taskId ?? "")));
  prevSnap.docs.forEach((d) => taskIdsFromEntries.add(String((d.data() as Record<string, unknown>).taskId ?? "")));

  const entryTaskSnaps = await Promise.all(
    [...taskIdsFromEntries].filter(Boolean).map((id) => adminDb.collection("tasks").doc(id).get()),
  );

  const taskById = new Map<string, Record<string, unknown>>();
  entryTaskSnaps.forEach((snap) => {
    if (snap.exists) taskById.set(snap.id, snap.data() as Record<string, unknown>);
  });

  const tasksInMonthDocs = allTasksSnap.docs.filter((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return canAccessRecord(data, actor.uid) && taskBelongsToMonth(data, month);
  });

  for (const doc of tasksInMonthDocs) {
    if (!taskById.has(doc.id)) taskById.set(doc.id, doc.data() as Record<string, unknown>);
  }

  const taskOptions = tasksInMonthDocs
    .map((doc) => ({
      taskId: doc.id,
      title: String((doc.data() as Record<string, unknown>).title ?? "Sin título"),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));

  const tasksInMonth = tasksInMonthDocs.length;

  const entryAllowed = (taskId: string) => {
    const task = taskById.get(taskId);
    if (!task) return false;
    return canAccessRecord(task, actor.uid);
  };

  const applyFilters = (entry: Record<string, unknown>) => {
    const taskId = String(entry.taskId ?? "");
    if (!entryAllowed(taskId)) return false;
    const task = taskById.get(taskId) ?? {};
    const clientId = String(entry.clientId ?? task.clientId ?? "");
    if (clientIdFilter && clientId !== clientIdFilter) return false;
    const userId = String(entry.userId ?? "");
    if (userIdFilter && userId !== userIdFilter) return false;
    if (taskIdFilter && taskId !== taskIdFilter) return false;
    return true;
  };

  const dailyMinutes = new Array(dim).fill(0);
  const clientAgg = new Map<string, { clientId: string; clientName: string; minutes: number }>();
  const workedDates = new Set<string>();
  const tasksWithTime = new Set<string>();
  let totalMinutes = 0;

  type EntryOut = {
    id: string;
    date: string;
    taskId: string;
    taskTitle: string;
    clientId: string;
    clientName: string;
    clientLogoURL: string;
    userId: string;
    userName: string;
    userPhotoURL: string;
    minutes: number;
    status: string;
    source: string;
    startedAt: string;
    createdAt: string;
  };

  const entriesOut: EntryOut[] = [];

  for (const doc of currentSnap.docs) {
    const entry = doc.data() as Record<string, unknown>;
    if (!applyFilters(entry)) continue;
    const status = String(entry.status ?? "completed");
    if (status === "cancelled") continue;

    const taskId = String(entry.taskId ?? "");
    const task = taskById.get(taskId) ?? {};
    const clientId = String(entry.clientId ?? task.clientId ?? "");
    const clientName = String(entry.clientName ?? task.clientName ?? "Cliente");
    const minutes = Math.max(0, Number(entry.minutes ?? 0));
    const dateStr = String(entry.date ?? "").slice(0, 10);
    const startedAt = String(entry.startedAt ?? "");
    const createdAt = toIso(entry.createdAt);

    if (status === "completed") {
      totalMinutes += minutes;
      if (minutes > 0 && dateStr.length >= 10) {
        workedDates.add(dateStr);
        const day = Number(dateStr.slice(8, 10));
        if (day >= 1 && day <= dim) dailyMinutes[day - 1] += minutes;
      }
      tasksWithTime.add(taskId);

      const prevC = clientAgg.get(clientId) ?? { clientId, clientName, minutes: 0 };
      prevC.minutes += minutes;
      prevC.clientName = clientName || prevC.clientName;
      clientAgg.set(clientId, prevC);
    } else if (status === "running") {
      tasksWithTime.add(taskId);
    }

    entriesOut.push({
      id: doc.id,
      date: dateStr,
      taskId,
      taskTitle: String(entry.taskTitle ?? task.title ?? "Tarea"),
      clientId,
      clientName,
      clientLogoURL: "",
      userId: String(entry.userId ?? ""),
      userName: String(entry.userName ?? ""),
      userPhotoURL: "",
      minutes,
      status,
      source: String(entry.source ?? "manual"),
      startedAt,
      createdAt,
    });
  }

  entriesOut.sort((a, b) => {
    const cmp = b.date.localeCompare(a.date);
    if (cmp !== 0) return cmp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  let prevMonthTotalMinutes = 0;
  const prevWorkedDates = new Set<string>();
  for (const doc of prevSnap.docs) {
    const entry = doc.data() as Record<string, unknown>;
    if (!applyFilters(entry)) continue;
    if (String(entry.status ?? "") !== "completed") continue;
    const minutes = Math.max(0, Number(entry.minutes ?? 0));
    prevMonthTotalMinutes += minutes;
    const dateStr = String(entry.date ?? "").slice(0, 10);
    if (minutes > 0 && dateStr.length >= 10) prevWorkedDates.add(dateStr);
  }
  const prevWorkedDays = prevWorkedDates.size;
  const prevAvgDailyMinutes = prevWorkedDays > 0 ? prevMonthTotalMinutes / prevWorkedDays : 0;

  const workedDays = workedDates.size;
  const avgDailyMinutes = workedDays > 0 ? totalMinutes / workedDays : 0;

  let bestIdx = -1;
  let bestDayMinutes = 0;
  dailyMinutes.forEach((m, i) => {
    if (m > bestDayMinutes) {
      bestDayMinutes = m;
      bestIdx = i;
    }
  });
  const bestDay = bestIdx >= 0 ? bestIdx + 1 : null;

  const weeksInMonth = Math.max(1, dim / 7);
  const weeklyAvgMinutes = totalMinutes / weeksInMonth;

  const clientBreakdown = [...clientAgg.values()]
    .map((row) => ({
      ...row,
      percentage: totalMinutes > 0 ? Math.round((row.minutes / totalMinutes) * 100) : 0,
    }))
    .sort((a, b) => b.minutes - a.minutes);

  const userIds = [...new Set(entriesOut.map((e) => e.userId).filter(Boolean))];
  const clientIds = [...new Set(entriesOut.map((e) => e.clientId).filter(Boolean))];

  const [userSnaps, clientSnaps] = await Promise.all([
    Promise.all(userIds.map((id) => adminDb.collection("users").doc(id).get())),
    Promise.all(clientIds.map((id) => adminDb.collection("clients").doc(id).get())),
  ]);

  const userPhotoById = new Map<string, string>();
  userSnaps.forEach((snap, i) => {
    if (!snap.exists) return;
    const photo = String((snap.data() as Record<string, unknown>).photoURL ?? "").trim();
    if (photo) userPhotoById.set(userIds[i], photo);
  });

  const clientLogoById = new Map<string, string>();
  clientSnaps.forEach((snap, i) => {
    if (!snap.exists) return;
    const logo = String((snap.data() as Record<string, unknown>).logoURL ?? "").trim();
    if (logo) clientLogoById.set(clientIds[i], logo);
  });

  for (const row of entriesOut) {
    row.userPhotoURL = userPhotoById.get(row.userId) ?? "";
    row.clientLogoURL = clientLogoById.get(row.clientId) ?? "";
  }

  const [y, mm] = month.split("-").map(Number);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const bestDayLabel =
    bestDay != null && y && mm
      ? `${bestDay} ${cap(new Intl.DateTimeFormat("es-AR", { month: "short" }).format(new Date(y, mm - 1, 1)).replace(".", ""))} ${y}`
      : "—";

  return adminJson({
    ok: true,
    month,
    prevMonthKey: prevKey,
    prevMonthLabel: cap(new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(prevKey + "-01T12:00:00"))),
    taskOptions,
    metrics: {
      totalMinutes,
      prevMonthTotalMinutes,
      avgDailyMinutes,
      prevAvgDailyMinutes,
      workedDays,
      daysInMonth: dim,
      tasksWithTime: tasksWithTime.size,
      tasksInMonth,
      bestDay,
      bestDayLabel,
      bestDayMinutes,
      weeklyAvgMinutes,
    },
    clientBreakdown,
    dailyMinutes,
    entries: entriesOut,
  });
  } catch (error) {
    console.error("[GET /api/admin/tasks/time-dashboard]", error);
    return adminJson({ ok: false, error: serializeRouteError(error) }, 500);
  }
}
