"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { useAdminToast } from "@/components/admin/admin-toast-provider";

type TaskRow = Record<string, unknown> & { id: string };
type UserRow = { id: string; fullName?: string; email?: string; photoURL?: string };
type ClientRow = { id: string; fullName?: string; displayName?: string; logoURL?: string };
type ThreadComment = { id: string; content?: string; createdByUserId?: string; createdAt?: string };
type ThreadActivity = { id: string; action?: string; message?: string; createdByUserId?: string; createdAt?: string; metadata?: Record<string, unknown> };

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

export function TasksBoard({
  initialTasks,
  users,
  clients,
  actorUid,
}: {
  initialTasks: TaskRow[];
  users: UserRow[];
  clients: ClientRow[];
  actorUid: string;
}) {
  const toast = useAdminToast();
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingModal, setSavingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<TaskRow | null>(null);
  const [clientFilter, setClientFilter] = useState("all");
  const [threadTab, setThreadTab] = useState<"comments" | "activity">("comments");
  const [threadComments, setThreadComments] = useState<ThreadComment[]>([]);
  const [threadActivity, setThreadActivity] = useState<ThreadActivity[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [detailInitialForm, setDetailInitialForm] = useState<{
    title: string;
    description: string;
    clientId: string;
    assignedTo: string;
    dueDate: string;
    assignedMonth: string;
    priority: string;
    status: string;
    tags: string;
  } | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "due_soon" | "overdue" | "done" | "active">("active");
  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: "",
    assignedTo: "",
    dueDate: "",
    assignedMonth: "",
    priority: "medium",
    status: "pending",
    tags: "",
  });

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const nowIso = new Date().toISOString();
  const dueSoonLimitIso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const filteredTasks = tasks.filter((task) => {
    const assignedTo = String(task.assignedTo ?? "");
    const status = String(task.status ?? "pending");
    const due = String(task.dueDate ?? "");
    const taskClientId = String(task.clientId ?? "");
    const isOverdue = due ? due < nowIso && status !== "done" && status !== "cancelled" : false;
    const isDueSoon = due ? due >= nowIso && due <= dueSoonLimitIso && status !== "done" && status !== "cancelled" : false;
    if (clientFilter !== "all" && taskClientId !== clientFilter) return false;
    if (filter === "mine") return assignedTo === actorUid;
    if (filter === "due_soon") return isDueSoon;
    if (filter === "overdue") return isOverdue;
    if (filter === "done") return status === "done";
    if (filter === "active") return status !== "done" && status !== "cancelled";
    return true;
  });
  const taskMonth = (task: TaskRow) => {
    const assignedMonth = String(task.assignedMonth ?? "");
    if (/^\d{4}-\d{2}$/.test(assignedMonth)) return assignedMonth;
    const dueDate = String(task.dueDate ?? "");
    if (/^\d{4}-\d{2}/.test(dueDate)) return dueDate.slice(0, 7);
    const createdAt = String(task.createdAt ?? "");
    if (/^\d{4}-\d{2}/.test(createdAt)) return createdAt.slice(0, 7);
    return new Date().toISOString().slice(0, 7);
  };
  const monthLabel = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, 1);
    return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  };
  const sortTasksInMonth = (a: TaskRow, b: TaskRow) => {
    const aDue = String(a.dueDate ?? "");
    const bDue = String(b.dueDate ?? "");
    const aStatus = String(a.status ?? "pending");
    const bStatus = String(b.status ?? "pending");
    const aOverdue = aDue ? aDue < nowIso && aStatus !== "done" && aStatus !== "cancelled" : false;
    const bOverdue = bDue ? bDue < nowIso && bStatus !== "done" && bStatus !== "cancelled" : false;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
  };
  const groupedByMonth = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const task of filteredTasks) {
      const month = taskMonth(task);
      const bucket = map.get(month) ?? [];
      bucket.push(task);
      map.set(month, bucket);
    }
    const currentMonth = new Date().toISOString().slice(0, 7);
    return [...map.entries()]
      .map(([month, rows]) => [month, [...rows].sort(sortTasksInMonth)] as const)
      .sort(([a], [b]) => {
        const aDiff = a.localeCompare(currentMonth);
        const bDiff = b.localeCompare(currentMonth);
        const aPast = aDiff < 0;
        const bPast = bDiff < 0;
        if (aPast !== bPast) return aPast ? 1 : -1;
        return a.localeCompare(b);
      });
  }, [filteredTasks]);

  const personMeta = (uid: string) => {
    const user = usersById.get(uid);
    const label = user?.fullName || user?.email || (uid ? uid.slice(0, 8) : "Sin asignar");
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
    return { label, initials, photoURL: user?.photoURL ?? "" };
  };
  const statusClass = (value: string) =>
    value === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value === "blocked"
        ? "border-red-200 bg-red-50 text-red-800"
        : value === "in_progress"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : value === "cancelled"
            ? "border-zinc-300 bg-zinc-100 text-zinc-600"
            : "border-violet-200 bg-violet-50 text-violet-800";
  const statusLabel = (value: string) =>
    value === "pending"
      ? "Pendiente"
      : value === "in_progress"
        ? "En proceso"
        : value === "blocked"
          ? "Bloqueada"
          : value === "done"
            ? "Terminada"
            : value === "cancelled"
              ? "Cancelada"
              : value;
  const priorityClass = (value: string) =>
    value === "high"
      ? "border-red-200 bg-red-50 text-red-800"
      : value === "low"
        ? "border-zinc-300 bg-zinc-100 text-zinc-700"
        : "border-amber-200 bg-amber-50 text-amber-800";
  const priorityLabel = (value: string) =>
    value === "high" ? "Alta" : value === "medium" ? "Media" : value === "low" ? "Baja" : value;

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      clientId: "",
      assignedTo: "",
      dueDate: "",
      assignedMonth: "",
      priority: "medium",
      status: "pending",
      tags: "",
    });
    setEditingTaskId(null);
  };

  const taskToForm = (task: TaskRow) => ({
    title: String(task.title ?? ""),
    description: String(task.description ?? ""),
    clientId: String(task.clientId ?? ""),
    assignedTo: String(task.assignedTo ?? ""),
    dueDate: String(task.dueDate ?? "").slice(0, 10),
    assignedMonth: String(task.assignedMonth ?? ""),
    priority: String(task.priority ?? "medium"),
    status: String(task.status ?? "pending"),
    tags: Array.isArray(task.tags) ? (task.tags as string[]).join(", ") : "",
  });

  const hasUnsavedDetailChanges =
    !!expandedTask &&
    !!detailInitialForm &&
    Object.entries(detailInitialForm).some(([key, value]) => {
      const currentValue = form[key as keyof typeof form];
      return String(currentValue ?? "").trim() !== String(value ?? "").trim();
    });

  const reloadTasks = async () => {
    const res = await fetch("/api/admin/tasks", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; items?: TaskRow[]; error?: string };
    if (!res.ok || !json.ok || !json.items) {
      toast.error(json.error ?? "No se pudieron refrescar las tareas.");
      return null;
    }
    setTasks(json.items);
    return json.items;
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const insertInDescription = (token: string) => {
    setForm((prev) => ({ ...prev, description: `${prev.description}${prev.description ? "\n" : ""}${token}` }));
  };

  const loadTaskThread = async (taskId: string) => {
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/thread`, { cache: "no-store", credentials: "include" });
      const json = (await res.json()) as { ok?: boolean; comments?: ThreadComment[]; activity?: ThreadActivity[]; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo cargar actividad de la tarea.");
        return;
      }
      setThreadComments(json.comments ?? []);
      setThreadActivity(json.activity ?? []);
    } finally {
      setThreadLoading(false);
    }
  };

  const openTaskDetail = (task: TaskRow) => {
    setExpandedTask(task);
    setEditingTaskId(task.id);
    const nextForm = taskToForm(task);
    setForm(nextForm);
    setDetailInitialForm(nextForm);
    setThreadTab("comments");
    setCommentDraft("");
    void loadTaskThread(task.id);
  };

  const closeTaskDetail = () => {
    if (savingModal) return;
    if (hasUnsavedDetailChanges) {
      const shouldSave = window.confirm(
        "Tenés cambios sin guardar. Aceptar para guardar cambios o Cancelar para descartarlos y cerrar.",
      );
      if (shouldSave) {
        void saveTask({ closeDetailOnSuccess: true });
        return;
      }
    }
    setExpandedTask(null);
    setDetailInitialForm(null);
    setEditingTaskId(null);
  };

  const submitComment = async () => {
    if (!expandedTask?.id || !commentDraft.trim() || commentSaving) return;
    setCommentSaving(true);
    try {
      const res = await fetch(`/api/admin/tasks/${expandedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentDraft.trim() }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo guardar el comentario.");
        return;
      }
      setCommentDraft("");
      await loadTaskThread(expandedTask.id);
      await reloadTasks();
    } finally {
      setCommentSaving(false);
    }
  };

  const saveTask = async ({ closeDetailOnSuccess = false }: { closeDetailOnSuccess?: boolean } = {}) => {
    if (!form.title.trim() || !form.clientId) {
      toast.error("Completá al menos título y cliente.");
      return;
    }
    setSavingModal(true);
    try {
      const endpoint = editingTaskId ? `/api/admin/tasks/${editingTaskId}` : "/api/admin/tasks";
      const method = editingTaskId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          assignedMonth: form.assignedMonth || (form.dueDate ? form.dueDate.slice(0, 7) : new Date().toISOString().slice(0, 7)),
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo guardar la tarea.");
        return;
      }
      toast.success(editingTaskId ? "Tarea actualizada." : "Tarea creada.");
      const refreshedTasks = await reloadTasks();
      if (expandedTask && editingTaskId === expandedTask.id && refreshedTasks) {
        const updatedTask = refreshedTasks.find((item) => item.id === expandedTask.id) ?? expandedTask;
        setExpandedTask(updatedTask);
        const syncedForm = taskToForm(updatedTask);
        setForm(syncedForm);
        setDetailInitialForm(syncedForm);
        if (closeDetailOnSuccess) {
          setExpandedTask(null);
          setDetailInitialForm(null);
          setEditingTaskId(null);
        }
      } else {
        resetForm();
        setIsModalOpen(false);
      }
    } finally {
      setSavingModal(false);
    }
  };

  const patchTaskStatus = async (taskId: string, status: string) => {
    setSavingTaskId(taskId);
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "No se pudo actualizar estado.");
      setSavingTaskId(null);
      return;
    }
    await reloadTasks();
    setSavingTaskId(null);
  };

  const deleteTask = async (taskId: string) => {
    setSavingTaskId(taskId);
    const res = await fetch(`/api/admin/tasks/${taskId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "No se pudo eliminar tarea.");
      setSavingTaskId(null);
      return;
    }
    await reloadTasks();
    setSavingTaskId(null);
  };

  const renderPerson = (meta: { label: string; initials: string; photoURL: string }) =>
    meta.photoURL ? (
      <span className="inline-flex items-center gap-1">
        <img src={meta.photoURL} alt={meta.label} className="h-5 w-5 rounded-full border border-zinc-200 object-cover" />
        {meta.label}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-semibold text-zinc-700">{meta.initials || "?"}</span>
        {meta.label}
      </span>
    );

  return (
    <section className="grid gap-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="max-w-xs mr-10">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName || client.displayName || client.id}
                </option>
              ))}
            </select>
          </div>

          {[
            { id: "all", label: "Todas" },
            { id: "mine", label: "Mías" },
            { id: "due_soon", label: "Próx. a vencer" },
            { id: "overdue", label: "Vencidas" },
            { id: "active", label: "Activas" },
            { id: "done", label: "Terminadas" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === item.id
                ? "border-rose-300 bg-rose-100 text-rose-900"
                : "border-zinc-300 bg-zinc-50 text-zinc-700"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            Nueva tarea
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                {editingTaskId ? "Editar tarea" : "Crear tarea"}
              </h3>
              <button
                type="button"
                onClick={() => !savingModal && setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input className={inputClass} placeholder="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <select className={inputClass} value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}>
                <option value="">Cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName || client.displayName || client.id}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => insertInDescription("**texto en negrita**")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Negrita</button>
                  <button type="button" onClick={() => insertInDescription("## Título")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Título</button>
                  <button type="button" onClick={() => insertInDescription("- Item")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Lista</button>
                  <button type="button" onClick={() => insertInDescription("Salto de línea\nSiguiente línea")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Salto línea</button>
                </div>
                <textarea className={`${inputClass} min-h-[180px]`} placeholder="Descripción con formato Markdown (**negrita**, ## títulos, listas y saltos)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <select className={inputClass} value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Responsable</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email || u.id}
                  </option>
                ))}
              </select>
              <input className={inputClass} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              <input className={inputClass} type="month" value={form.assignedMonth} onChange={(e) => setForm((p) => ({ ...p, assignedMonth: e.target.value }))} />
              <select className={inputClass} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En proceso</option>
                <option value="blocked">Bloqueada</option>
                <option value="done">Terminada</option>
                <option value="cancelled">Cancelada</option>
              </select>
              <input className={`${inputClass} md:col-span-2`} placeholder="Tags (coma)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
            </div>
            <button type="button" disabled={savingModal} onClick={() => void saveTask()} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60">
              {savingModal ? "Guardando..." : editingTaskId ? "Guardar cambios" : "Crear tarea"}
            </button>
          </div>
        </div>
      ) : null}

      {expandedTask ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-4">
          <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-100">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{String(expandedTask.title ?? "Tarea")}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Cliente: {String(expandedTask.clientName ?? "—")} · Vence: {String(expandedTask.dueDate ?? "").slice(0, 10) || "Sin fecha"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={savingModal || !hasUnsavedDetailChanges} onClick={() => setForm(detailInitialForm ?? form)} className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 disabled:opacity-50">
                  Descartar cambios
                </button>
                <button type="button" disabled={savingModal || !hasUnsavedDetailChanges} onClick={() => void saveTask()} className="rounded-lg border border-emerald-500/60 bg-emerald-900/30 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-50">
                  {savingModal ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTask(expandedTask.id)}
                  className="rounded-lg border border-red-500/60 bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-200"
                >
                  Eliminar
                </button>
                <button type="button" onClick={closeTaskDetail} className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  Cerrar
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <input className={inputClass} placeholder="Título" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
                  <select className={inputClass} value={form.clientId} onChange={(e) => setForm((p) => ({ ...p, clientId: e.target.value }))}>
                    <option value="">Cliente</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.fullName || client.displayName || client.id}
                      </option>
                    ))}
                  </select>
                  <div className="md:col-span-2">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => insertInDescription("**texto en negrita**")} className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300">Negrita</button>
                      <button type="button" onClick={() => insertInDescription("## Título")} className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300">Título</button>
                      <button type="button" onClick={() => insertInDescription("- Item")} className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300">Lista</button>
                      <button type="button" onClick={() => insertInDescription("Salto de línea\nSiguiente línea")} className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300">Salto línea</button>
                    </div>
                    <textarea className={`${inputClass} min-h-[180px]`} placeholder="Descripción con formato Markdown (**negrita**, ## títulos, listas y saltos)" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                  </div>
                  <select className={inputClass} value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}>
                    <option value="">Responsable</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email || u.id}
                      </option>
                    ))}
                  </select>
                  <input className={inputClass} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
                  <input className={inputClass} type="month" value={form.assignedMonth} onChange={(e) => setForm((p) => ({ ...p, assignedMonth: e.target.value }))} />
                  <select className={inputClass} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                  <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En proceso</option>
                    <option value="blocked">Bloqueada</option>
                    <option value="done">Terminada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                  <input className={`${inputClass} md:col-span-2`} placeholder="Tags (coma)" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} />
                </div>
                <div className="prose prose-invert mt-4 max-w-none rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-relaxed prose-headings:mb-2 prose-p:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {form.description || "Sin descripción"}
                  </ReactMarkdown>
                </div>
              </div>
              <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                <div className="flex border-b border-zinc-800 text-sm">
                  <button type="button" onClick={() => setThreadTab("comments")} className={`px-4 py-2.5 font-semibold ${threadTab === "comments" ? "text-white" : "text-zinc-400"}`}>Comentarios</button>
                  <button type="button" onClick={() => setThreadTab("activity")} className={`px-4 py-2.5 font-semibold ${threadTab === "activity" ? "text-white" : "text-zinc-400"}`}>Toda la actividad</button>
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-4">
                  {threadLoading ? <p className="text-xs text-zinc-400">Cargando...</p> : null}
                  {!threadLoading && threadTab === "comments" ? (
                    <div className="grid gap-3">
                      {threadComments.length === 0 ? <p className="text-xs text-zinc-400">Sin comentarios todavía.</p> : null}
                      {threadComments.map((item) => {
                        const author = personMeta(String(item.createdByUserId ?? ""));
                        return (
                          <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                            <p className="text-xs font-semibold text-zinc-200">{author.label} · {String(item.createdAt ?? "").slice(0, 16)}</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">{String(item.content ?? "")}</p>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                  {!threadLoading && threadTab === "activity" ? (
                    <div className="grid gap-2">
                      {threadActivity.length === 0 ? <p className="text-xs text-zinc-400">Sin actividad registrada.</p> : null}
                      {threadActivity.map((item) => (
                        <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                          <AdminActionBadge action={String(item.action ?? "")} />
                          <p className="mt-1 text-xs text-zinc-400">{String(item.createdAt ?? "").slice(0, 16)} · {personMeta(String(item.createdByUserId ?? "")).label}</p>
                          {item.message ? <p className="mt-1 text-sm text-zinc-100">{String(item.message)}</p> : null}
                          {Array.isArray((item.metadata as Record<string, unknown> | undefined)?.changes) ? (
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-300">
                              {((item.metadata as Record<string, unknown>).changes as Array<Record<string, unknown>>).slice(0, 6).map((change, idx) => (
                                <li key={`${item.id}-${idx}`}>
                                  {String(change.field ?? "campo")}: "{String(change.from ?? "—")}" {"->"} "{String(change.to ?? "—")}"
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-zinc-800 p-3">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    className="min-h-[82px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    placeholder="Agregar un comentario"
                  />
                  <button
                    type="button"
                    onClick={() => void submitComment()}
                    disabled={commentSaving || !commentDraft.trim()}
                    className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {commentSaving ? "Comentando..." : "Comentar"}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {groupedByMonth.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600">
          No hay tareas para este filtro.
        </div>
      ) : null}

      <div className="grid gap-4">
        {groupedByMonth.map(([month, monthTasks], index) => (
          <details key={month} open={index === 0} className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-800">
              {monthLabel(month)} ({monthTasks.length})
            </summary>
            <div className="grid gap-3 border-t border-zinc-100 p-4 md:grid-cols-2 xl:grid-cols-3">
              {monthTasks.map((task) => {
                const due = String(task.dueDate ?? "");
                const overdue = due ? due < new Date().toISOString() && String(task.status ?? "") !== "done" : false;
                const assignee = personMeta(String(task.assignedTo ?? ""));
                const creator = personMeta(String(task.createdBy ?? ""));
                const client = clientsById.get(String(task.clientId ?? ""));
                return (
                  <article
                    key={task.id}
                    onClick={() => openTaskDetail(task)}
                    className={`cursor-pointer overflow-hidden rounded-xl border p-4 shadow-sm transition hover:shadow-md ${overdue ? "border-red-200 bg-red-50/30" : "border-zinc-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={savingTaskId === task.id || String(task.status ?? "") === "done"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void patchTaskStatus(task.id, "done");
                          }}
                          className={
                            String(task.status ?? "") === "done" ? `inline-flex h-6 w-6 items-center justify-center rounded-full border
                           border-emerald-300 bg-emerald-50 text-emerald-700 disabled:opacity-60`
                              : `inline-flex h-6 w-6 items-center justify-center rounded-full border
                           border-zinc-300 bg-zinc-50 text-zinc-700 disabled:opacity-60`}
                          aria-label="Marcar como finalizada"
                          title="Marcar como finalizada"
                        >
                          {savingTaskId === task.id ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                          ) : (
                            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                              <path d="M7.8 13.4 4.9 10.5 3.8 11.6l4 4 8-8-1.1-1.1-6.9 6.9z" fill="currentColor" />
                            </svg>
                          )}
                        </button>

                        <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{String(task.title ?? "Tarea")}</p>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${priorityClass(String(task.priority ?? "medium"))}`}>{priorityLabel(String(task.priority ?? "medium"))}</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(String(task.status ?? "pending"))}`}>{statusLabel(String(task.status ?? "pending"))}</span>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-1 text-xs text-zinc-700">
                      <p className="flex items-center gap-2">
                        <span>Cliente:</span>
                        {client?.logoURL ? <img src={client.logoURL} alt="Logo cliente" className="h-5 w-5 rounded-full border border-zinc-200 object-cover" /> : null}
                        <strong>{client?.fullName || client?.displayName || String(task.clientName ?? "—")}</strong>
                      </p>
                      <p className={overdue ? "font-semibold text-red-700" : ""}>Vence: <strong>{due ? due.slice(0, 10) : "Sin fecha"}</strong>{overdue ? " · Vencida" : ""}</p>
                      <p>Responsable: {renderPerson(assignee)}</p>
                      <p>Creador: {renderPerson(creator)}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <select
                        value={String(task.status ?? "pending")}
                        disabled={savingTaskId === task.id}
                        onChange={(e) => void patchTaskStatus(task.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300 pr-6"
                        aria-label="Cambiar estado"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En proceso</option>
                        <option value="blocked">Bloqueada</option>
                        <option value="done">Terminada</option>
                        <option value="cancelled">Cancelada</option>
                      </select>
                    </div>
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
