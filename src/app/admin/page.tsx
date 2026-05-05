import Link from "next/link";
import {
  RiCalendarLine,
  RiCheckboxCircleLine,
  RiClipboardLine,
  RiFileList3Line,
  RiGroupLine,
  RiTimeLine,
} from "@remixicon/react";
import { userHasWorkingScheduleData } from "@/lib/admin/working-hours";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/auth/session";

const leadStatusClass = (status?: string) => {
  const value = String(status ?? "new");
  const map: Record<string, string> = {
    new: "border-rose-200 bg-rose-50 text-rose-700",
    reviewed: "border-cyan-200 bg-cyan-50 text-cyan-700",
    awaiting_response: "border-amber-200 bg-amber-50 text-amber-700",
    lost: "border-red-200 bg-red-50 text-red-800",
    contacted: "border-amber-200 bg-amber-50 text-amber-700",
    brief_pending: "border-violet-200 bg-violet-50 text-violet-700",
    budget_pending: "border-violet-200 bg-violet-50 text-violet-700",
    budget_sent: "border-indigo-200 bg-indigo-50 text-indigo-700",
    awaiting_approval: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    changes_requested: "border-orange-200 bg-orange-50 text-orange-800",
    docs_pending: "border-yellow-200 bg-yellow-50 text-yellow-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-800",
    converted: "border-rose-200 bg-rose-50 text-rose-700",
    in_followup: "border-violet-200 bg-violet-50 text-violet-700",
    qualified: "border-teal-200 bg-teal-50 text-teal-800",
    archived: "border-zinc-300 bg-zinc-100 text-zinc-700",
  };
  return map[value] ?? "border-zinc-200 bg-zinc-100 text-zinc-700";
};

const getCurrentMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  return { startIso: start.toISOString(), endIso: end.toISOString(), monthKey, start, end };
};

const formatMonthRangeLabel = (start: Date, end: Date) => {
  const month = new Intl.DateTimeFormat("es-AR", { month: "long" }).format(start);
  const year = start.getFullYear();
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return `${start.getDate()} – ${end.getDate()} de ${cap(month)}, ${year}`;
};

const formatDuration = (minutesRaw: number) => {
  const minutes = Math.max(0, Math.round(minutesRaw));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
};

const coerceDate = (value: unknown): Date | null => {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as { toDate: () => Date }).toDate === "function") {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  return null;
};

const formatShortEsDate = (value: unknown) => {
  const d = coerceDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d);
};

const formatDueDayMonth = (iso: string) => {
  const d = coerceDate(iso);
  if (!d) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(d);
  return `${day} ${month.replace(".", "")}`;
};

type DashboardUser = {
  id: string;
  fullName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
};

type DashboardTask = Record<string, unknown> & { id: string };
type DashboardLead = Record<string, unknown> & { id: string };
type TimeEntryRow = Record<string, unknown> & { id: string };

const isTaskInCurrentMonth = (task: DashboardTask, monthKey: string, startIso: string, endIso: string) => {
  const assignedMonth = String(task.assignedMonth ?? task.sprintMonth ?? task.month ?? "").trim();
  if (/^\d{4}-\d{2}$/.test(assignedMonth)) return assignedMonth === monthKey;
  const dueDate = String(task.dueDate ?? "");
  if (!dueDate) return false;
  return dueDate >= startIso && dueDate <= endIso;
};

const groupTimeByClient = (entries: TimeEntryRow[]) => {
  const map = new Map<string, { clientId: string; clientName: string; minutes: number }>();
  let total = 0;
  for (const entry of entries) {
    const minutes = Number(entry.minutes ?? 0);
    if (!Number.isFinite(minutes) || minutes <= 0) continue;
    const clientId = String(entry.clientId ?? "") || "no_client";
    const clientName = String(entry.clientName ?? "").trim() || "Sin cliente";
    total += minutes;
    const prev = map.get(clientId) ?? { clientId, clientName, minutes: 0 };
    prev.minutes += minutes;
    map.set(clientId, prev);
  }
  return [...map.values()]
    .sort((a, b) => b.minutes - a.minutes)
    .map((row) => ({ ...row, percentage: total > 0 ? Math.round((row.minutes / total) * 100) : 0 }));
};

const groupTimeByUser = (entries: TimeEntryRow[]) => {
  const map = new Map<string, { userId: string; userName: string; minutes: number }>();
  let total = 0;
  for (const entry of entries) {
    const minutes = Number(entry.minutes ?? 0);
    if (!Number.isFinite(minutes) || minutes <= 0) continue;
    const userId = String(entry.userId ?? "") || "unknown_user";
    const userName = String(entry.userName ?? "").trim() || "Usuario";
    total += minutes;
    const prev = map.get(userId) ?? { userId, userName, minutes: 0 };
    prev.minutes += minutes;
    map.set(userId, prev);
  }
  return [...map.values()]
    .sort((a, b) => b.minutes - a.minutes)
    .map((row) => ({ ...row, percentage: total > 0 ? Math.round((row.minutes / total) * 100) : 0 }));
};

const initialsFromName = (name: string, fallbackEmail?: string) => {
  const src = name.trim() || fallbackEmail?.trim() || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  const { startIso, endIso, monthKey, start, end } = getCurrentMonthRange();
  let showScheduleReminder = false;
  let currentUserRole = "";
  if (session?.uid) {
    const me = await adminDb.collection("users").doc(session.uid).get();
    if (me.exists) {
      const d = me.data() as Record<string, unknown>;
      const tz = String(d.timeZone ?? "").trim();
      currentUserRole = String(d.role ?? "").toLowerCase();
      showScheduleReminder = !tz || !userHasWorkingScheduleData(d);
    }
  }

  const [newLeadsSnap, myTasksSnap, usersSnap, myTimeSnap, teamTimeSnap] = await Promise.all([
    adminDb.collection("leads").where("status", "==", "new").limit(300).get(),
    session?.uid
      ? adminDb.collection("tasks").where("assignedTo", "==", session.uid).limit(120).get()
      : Promise.resolve(null),
    adminDb.collection("users").limit(400).get(),
    session?.uid
      ? adminDb.collection("taskTimeEntries").where("userId", "==", session.uid).where("assignedMonth", "==", monthKey).limit(2000).get()
      : Promise.resolve(null),
    adminDb.collection("taskTimeEntries").where("assignedMonth", "==", monthKey).limit(4000).get(),
  ]);

  const newLeadsFiltered = newLeadsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as DashboardLead)
    .filter((lead) => !String(lead.convertedToClientId ?? "").trim())
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));

  const newLeadsCount = newLeadsFiltered.length;
  const newLeads = newLeadsFiltered.slice(0, 6);

  const myTasksFiltered = (myTasksSnap?.docs ?? [])
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as DashboardTask)
    .filter((task) => isTaskInCurrentMonth(task, monthKey, startIso, endIso))
    .sort((a, b) => {
      const aDue = String(a.dueDate ?? "");
      const bDue = String(b.dueDate ?? "");
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return String(a.priority ?? "medium").localeCompare(String(b.priority ?? "medium"));
    });

  const myTasksCount = myTasksFiltered.length;
  const myTasks = myTasksFiltered.slice(0, 6);

  const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as DashboardUser);
  const usersById = new Map(users.map((u) => [u.id, u]));

  const myTimeEntries = (myTimeSnap?.docs ?? [])
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as TimeEntryRow)
    .filter((entry) => String(entry.status ?? "completed") !== "running" && String(entry.status ?? "") !== "cancelled");
  const myTimeTotalMinutes = myTimeEntries.reduce((acc, row) => acc + Math.max(0, Number(row.minutes ?? 0)), 0);
  const myTimeByClient = groupTimeByClient(myTimeEntries);

  const teamTimeEntries = teamTimeSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as TimeEntryRow)
    .filter((entry) => String(entry.status ?? "completed") !== "running" && String(entry.status ?? "") !== "cancelled");
  const teamTotalMinutes = teamTimeEntries.reduce((acc, row) => acc + Math.max(0, Number(row.minutes ?? 0)), 0);
  const teamByUser = groupTimeByUser(teamTimeEntries);
  const teamByClient = groupTimeByClient(teamTimeEntries);

  const taskDashboardStatus = (status: string) => {
    const s = String(status ?? "pending");
    if (s === "pending") {
      return { label: "pendiente", className: "border-violet-200 bg-violet-50 text-violet-800" };
    }
    if (s === "in_progress") {
      return { label: "en proceso", className: "border-orange-200 bg-orange-50 text-orange-800" };
    }
    if (s === "blocked" || s === "cancelled") {
      return { label: s === "blocked" ? "bloqueada" : "cancelada", className: "border-zinc-200 bg-zinc-100 text-zinc-600" };
    }
    if (s === "done") {
      return { label: "terminada", className: "border-emerald-200 bg-emerald-50 text-emerald-800" };
    }
    return { label: "sin empezar", className: "border-zinc-200 bg-zinc-100 text-zinc-600" };
  };

  const assigneeForTask = (task: DashboardTask) => {
    const uid = String(task.assignedTo ?? session?.uid ?? "");
    const u = usersById.get(uid);
    const label = u?.fullName || u?.email || "";
    return {
      initials: initialsFromName(label, u?.email),
      photoURL: u?.photoURL ?? "",
      name: label || "Usuario",
    };
  };

  const kpiCards = [
    {
      title: "Leads nuevos",
      subtitle: "Pendientes de revisar",
      value: String(newLeadsCount),
      Icon: RiGroupLine,
    },
    {
      title: "Mis tareas del mes",
      subtitle: "Asignados a mi",
      value: String(myTasksCount),
      Icon: RiCheckboxCircleLine,
    },
    {
      title: "Mis horas este mes",
      subtitle: "Tiempo registrado",
      value: formatDuration(myTimeTotalMinutes),
      Icon: RiTimeLine,
    },
    {
      title: "Horas del equipo",
      subtitle: "Tiempo registrado",
      value: formatDuration(teamTotalMinutes),
      Icon: RiGroupLine,
    },
  ];

  const isInternalAdminUser = ["admin", "superadmin", "creator", "owner"].includes(currentUserRole);

  const pinkLink = "text-sm font-semibold text-rose-600 transition hover:text-rose-700";

  return (
    <section className="mx-auto max-w-[1200px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">Resumen operativo del mes</p>
        </div>
        <div
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm"
          role="status"
          aria-label="Mes en curso"
        >
          <RiCalendarLine className="size-[18px] text-rose-500" aria-hidden />
          <span>{formatMonthRangeLabel(start, end)}</span>
        </div>
      </div>

      {showScheduleReminder ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
          <p className="text-sm font-semibold">Completá tu zona horaria y horario habitual</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            Sin esos datos el equipo no ve bien cuándo estás disponible y el estado «en horario» en las tarjetas no se puede calcular para vos.
          </p>
          <Link
            href="/admin/profile"
            className="mt-2 inline-flex text-xs font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-950"
          >
            Ir a mi perfil → Contacto y notas
          </Link>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ title, subtitle, value, Icon }) => (
          <div
            key={title}
            className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100">
              <Icon className="size-6 text-rose-500" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="text-xs text-zinc-500">{subtitle}</p>
            </div>
            <p className="shrink-0 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</p>
          </div>
        ))}
      </div>

      {newLeads.length > 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <RiFileList3Line className="size-5 text-rose-500" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Leads nuevos</h2>
                <p className="text-sm text-zinc-500">Pendientes de revisar</p>
              </div>
            </div>
            <Link href="/admin/leads" className={`${pinkLink} shrink-0`}>
              Ver todos
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {newLeads.map((lead) => {
              const name = String(lead.fullName ?? lead.email ?? lead.id);
              const email = String(lead.email ?? "Sin email");
              const initials = initialsFromName(name, email);
              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-5 py-4 sm:flex-row sm:items-start"
                >
                  <div className="flex flex-1 gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-700 shadow-sm ring-1 ring-zinc-100">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">{name}</p>
                          <p className="truncate text-sm text-zinc-500">{email}</p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${leadStatusClass("new")}`}
                        >
                          Nuevo
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500">
                          <RiCalendarLine className="size-4 text-zinc-400" aria-hidden />
                          {formatShortEsDate(lead.createdAt)}
                        </span>
                        <Link
                          href={`/admin/leads/${lead.id}`}
                          className="inline-flex rounded-full border border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                        >
                          Revisar
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <RiClipboardLine className="size-5 text-rose-500" aria-hidden />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900">Mis tareas del mes</h2>
            </div>
            <Link href="/admin/tasks" className={`${pinkLink} shrink-0`}>
              Ver sección tareas
            </Link>
          </div>
          <ul className="divide-y divide-zinc-100">
            {myTasks.length === 0 ? (
              <li className="py-8 text-center text-sm text-zinc-500">No tenés tareas asignadas para este mes.</li>
            ) : (
              myTasks.map((task) => {
                const dueDate = String(task.dueDate ?? "");
                const overdue = dueDate ? dueDate < new Date().toISOString() && String(task.status ?? "") !== "done" : false;
                const statusUi = taskDashboardStatus(String(task.status ?? "pending"));
                const assignee = assigneeForTask(task);
                const dueLabel = formatDueDayMonth(dueDate);
                return (
                  <li key={task.id} className="py-3.5 first:pt-0">
                    <Link href={`/admin/tasks?taskId=${encodeURIComponent(task.id)}`} className="group flex items-start gap-3 rounded-xl px-1 py-1 transition hover:bg-zinc-50">
                      <span className="mt-1.5 flex h-4 w-4 shrink-0 rounded-full border-2 border-zinc-300 bg-white group-hover:border-rose-300" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-zinc-900">{String(task.title ?? "Tarea sin título")}</p>
                        <p className="mt-0.5 text-sm text-zinc-500">{String(task.clientName ?? "Sin cliente")}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusUi.className}`}>{statusUi.label}</span>
                          <span className={`text-xs ${overdue ? "font-semibold text-red-600" : "text-zinc-500"}`}>
                            Vence: {dueLabel ?? "Sin fecha"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 pt-0.5">
                        {assignee.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={assignee.photoURL} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-zinc-100" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                            {assignee.initials}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
          <div className="mt-5 flex justify-center border-t border-zinc-100 pt-4">
            <Link href="/admin/tasks" className={`${pinkLink}`}>
              Ver todas mis tareas
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <RiTimeLine className="size-5 text-rose-500" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Mis tiempos del mes</h2>
                <p className="text-sm text-zinc-500">Tiempo registrado por mi</p>
              </div>
            </div>
            <Link href="/admin/tasks?view=times" className={`${pinkLink} shrink-0`}>
              Ver detalle de tiempos
            </Link>
          </div>
          <p className="text-4xl font-bold tracking-tight text-zinc-900">{formatDuration(myTimeTotalMinutes)}</p>
          {myTimeByClient.length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">Todavía no registraste tiempos este mes.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {myTimeByClient.slice(0, 8).map((row) => (
                <li key={row.clientId}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-800">{row.clientName}</span>
                    <span className="text-zinc-600">
                      {formatDuration(row.minutes)}
                      <span className="mx-2 text-zinc-300">·</span>
                      <span className="tabular-nums">{row.percentage}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                    <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max(4, row.percentage)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {isInternalAdminUser ? (
        <div className="mt-8 rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <RiTimeLine className="size-5 text-rose-500" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Tiempos del equipo</h2>
                <p className="text-sm text-zinc-500">Resumen del tiempo registrado por el equipo este mes</p>
              </div>
            </div>
            <Link href="/admin/tasks?view=times" className={`${pinkLink} shrink-0`}>
              Ver informe completo
            </Link>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold text-zinc-900">Por usuario</p>
              <ul className="space-y-4">
                {teamByUser.map((row) => (
                  <li key={row.userId}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-zinc-800">{row.userName}</span>
                      <span className="text-zinc-600">
                        {formatDuration(row.minutes)}
                        <span className="mx-2 text-zinc-300">·</span>
                        <span className="tabular-nums">{row.percentage}%</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max(4, row.percentage)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 text-sm font-semibold text-zinc-900">Por cliente</p>
              <ul className="space-y-4">
                {teamByClient.map((row) => (
                  <li key={row.clientId}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span className="font-medium text-zinc-800">{row.clientName}</span>
                      <span className="text-zinc-600">
                        {formatDuration(row.minutes)}
                        <span className="mx-2 text-zinc-300">·</span>
                        <span className="tabular-nums">{row.percentage}%</span>
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                      <div className="h-full rounded-full bg-rose-400" style={{ width: `${Math.max(4, row.percentage)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
