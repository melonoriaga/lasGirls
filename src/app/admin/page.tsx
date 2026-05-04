import Link from "next/link";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { leadPipelineStatusLabel } from "@/lib/admin/lead-statuses";
import { userHasWorkingScheduleData } from "@/lib/admin/working-hours";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/auth/session";

const leadStatusClass = (status?: string) => {
  const value = String(status ?? "new");
  const map: Record<string, string> = {
    new: "border-sky-200 bg-sky-50 text-sky-700",
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

const countCollection = async (name: string) => {
  const snapshot = await adminDb.collection(name).count().get();
  return snapshot.data().count;
};

type LogRow = {
  id: string;
  action?: string;
  actorName?: string;
  actorEmail?: string;
  path?: string;
  createdAt?: string;
};

type DashboardUser = {
  id: string;
  fullName?: string;
  email?: string;
  photoURL?: string;
};

export default async function AdminDashboardPage() {
  const session = await getServerSession();
  let showScheduleReminder = false;
  if (session?.uid) {
    const me = await adminDb.collection("users").doc(session.uid).get();
    if (me.exists) {
      const d = me.data() as Record<string, unknown>;
      const tz = String(d.timeZone ?? "").trim();
      showScheduleReminder = !tz || !userHasWorkingScheduleData(d);
    }
  }

  const [leadsTotal, clientsTotal, pendingReviewLeadsCount, myTasksSnap, recentLeadsSnap, usersSnap] =
    await Promise.all([
      countCollection("leads"),
      countCollection("clients"),
      adminDb
        .collection("leads")
        .where("status", "==", "new")
        .count()
        .get()
        .then((s) => s.data().count)
        .catch(() => 0),
      session?.uid
        ? adminDb
            .collection("tasks")
            .where("assignedTo", "==", session.uid)
            .limit(20)
            .get()
        : Promise.resolve(null),
      adminDb.collection("leads").orderBy("createdAt", "desc").limit(6).get(),
      adminDb.collection("users").limit(400).get(),
    ]);

  let recentLogs: LogRow[] = [];
  try {
    const logSnap = await adminDb.collection("activityLogs").orderBy("createdAt", "desc").limit(8).get();
    recentLogs = logSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as LogRow[];
  } catch {
    recentLogs = [];
  }

  const recentLeads = recentLeadsSnap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      fullName: String(data.fullName ?? ""),
      email: String(data.email ?? ""),
      status: String(data.status ?? ""),
      createdAt: String(data.createdAt ?? ""),
    };
  });

  const myTasks = (myTasksSnap?.docs ?? [])
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .sort((a, b) => {
      const aDue = String(a.dueDate ?? "");
      const bDue = String(b.dueDate ?? "");
      if (aDue !== bDue) return aDue.localeCompare(bDue);
      return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
    })
    .slice(0, 6);
  const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) })) as DashboardUser[];
  const usersById = new Map(users.map((u) => [u.id, u]));
  const userMeta = (uid: string) => {
    const user = usersById.get(uid);
    const label = user?.fullName || user?.email || (uid ? uid.slice(0, 8) : "Sin asignar");
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return { label, initials, photoURL: user?.photoURL ?? "" };
  };
  const taskStatusClass = (status: string) =>
    status === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "blocked"
        ? "border-red-200 bg-red-50 text-red-800"
        : status === "in_progress"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : status === "cancelled"
            ? "border-zinc-300 bg-zinc-100 text-zinc-700"
            : "border-violet-200 bg-violet-50 text-violet-800";

  const cards = [
    { label: "Total leads", value: leadsTotal, href: "/admin/leads" as const },
    {
      label: "Leads nuevos",
      value: pendingReviewLeadsCount,
      href: "/admin/leads" as const,
      hint: "Pendientes de revisar",
    },
    { label: "Clientes", value: clientsTotal, href: "/admin/clients" as const },
  ];

  return (
    <section className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">Resumen operativo de leads, clientes, tareas y actividad.</p>

      {showScheduleReminder ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
          <p className="text-sm font-semibold">Completá tu zona horaria y horario habitual</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            Sin esos datos el equipo no ve bien cuándo estás disponible y el estado «en horario» en las tarjetas no se
            puede calcular para vos.
          </p>
          <Link
            href="/admin/profile"
            className="mt-2 inline-flex text-xs font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-950"
          >
            Ir a mi perfil → Contacto y notas
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="block rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-rose-200 hover:shadow-md"
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">{card.label}</p>
            {card.hint ? <p className="mt-0.5 text-[10px] text-zinc-400">{card.hint}</p> : null}
            <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">{card.value}</p>
            <div className="mt-3 h-1 w-full rounded-full bg-rose-200" />
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Últimos leads</h2>
            <Link href="/admin/leads" className="text-xs font-medium text-[#db2777] hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-zinc-100">
            {recentLeads.length === 0 ? (
              <li className="py-4 text-sm text-zinc-500">Todavía no hay leads cargados.</li>
            ) : (
              recentLeads.map((row) => (
                <li key={row.id} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/leads/${row.id}`}
                      className="truncate font-medium text-zinc-900 hover:text-[#db2777] hover:underline"
                    >
                      {row.fullName || row.email || row.id}
                    </Link>
                    <p className="truncate text-xs text-zinc-500">{row.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${leadStatusClass(row.status)}`}
                    >
                      {leadPipelineStatusLabel(row.status)}
                    </span>
                    <span>{row.createdAt.slice(0, 10)}</span>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Actividad reciente</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Movimientos registrados en el admin (login, cambios de perfil, notas, etc.).
          </p>
          <ul className="mt-4 divide-y divide-zinc-100">
            {recentLogs.length === 0 ? (
              <li className="py-4 text-sm text-zinc-500">
                Sin registros todavía o la colección no está indexada en Firestore.
              </li>
            ) : (
              recentLogs.map((log) => (
                <li key={log.id} className="py-3 text-sm">
                  <AdminActionBadge action={log.action} className="font-normal" />
                  <p className="mt-2 text-xs text-zinc-500">
                    {log.actorName || log.actorEmail || "—"} · {String(log.createdAt ?? "").slice(0, 16)}
                  </p>
                  {log.path ? <p className="mt-0.5 text-xs text-zinc-400">{log.path}</p> : null}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-end justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Mis tareas</h2>
            <Link href="/admin/tasks" className="text-xs font-medium text-[#db2777] hover:underline">
              Ver sección tareas
            </Link>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Tareas asignadas a tu usuario, ordenadas por vencimiento.</p>
          <ul className="mt-4 divide-y divide-zinc-100">
            {myTasks.length === 0 ? (
              <li className="py-4 text-sm text-zinc-500">Todavia no tenes tareas asignadas.</li>
            ) : (
              myTasks.map((task) => {
                const dueDate = String(task.dueDate ?? "");
                const overdue = dueDate ? dueDate < new Date().toISOString() : false;
                const creator = userMeta(String(task.createdBy ?? ""));
                const assignee = userMeta(String(task.assignedTo ?? ""));
                return (
                  <li key={task.id} className="py-3">
                    <p className="text-sm font-semibold text-zinc-900">{String(task.title ?? "Tarea sin titulo")}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-zinc-500">{String(task.clientName ?? "Sin cliente")}</span>
                      <span className={`inline-flex rounded-full border px-2 py-0.5 font-medium ${taskStatusClass(String(task.status ?? "pending"))}`}>
                        {String(task.status ?? "pending")}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${overdue ? "font-semibold text-red-700" : "text-zinc-500"}`}>
                      Vence: {dueDate ? dueDate.slice(0, 10) : "Sin fecha"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                      <span className="inline-flex items-center gap-1">
                        {assignee.photoURL ? (
                          <img src={assignee.photoURL} alt={assignee.label} className="h-5 w-5 rounded-full border border-zinc-200 object-cover" />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-semibold text-zinc-700">{assignee.initials || "?"}</span>
                        )}
                        Resp: {assignee.label}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {creator.photoURL ? (
                          <img src={creator.photoURL} alt={creator.label} className="h-5 w-5 rounded-full border border-zinc-200 object-cover" />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-semibold text-zinc-700">{creator.initials || "?"}</span>
                        )}
                        Creada por {creator.label}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
