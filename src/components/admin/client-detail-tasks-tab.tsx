"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiBuilding2Line,
  RiCalendarLine,
  RiCalendarTodoLine,
  RiDraggable,
  RiFlagLine,
  RiLink,
  RiMore2Fill,
  RiPlayLargeFill,
  RiStopFill,
  RiUserFollowLine,
  RiUserLine,
} from "@remixicon/react";
import { TaskRichTextEditor, taskDescriptionEditorContentFromTask } from "@/components/admin/task-rich-text-editor";
import { attachTaskCardDragPreview } from "@/lib/admin/task-card-drag-preview";

type AdminUser = { id: string; fullName: string; email: string; photoURL?: string };
type TaskRow = Record<string, unknown> & { id: string };

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

async function parseJson(res: Response): Promise<Record<string, unknown> & { ok?: boolean; error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: `Sin respuesta (${res.status}).` };
  try {
    return JSON.parse(trimmed) as Record<string, unknown> & { ok?: boolean; error?: string };
  } catch {
    return { ok: false, error: "Respuesta inválida." };
  }
}

export function ClientDetailTasksTab({
  clientId,
  actorUid,
  rows,
  users,
  clientLogoURL,
  clientDisplayName,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  actorUid: string;
  rows: TaskRow[];
  users: AdminUser[];
  clientLogoURL?: string;
  clientDisplayName: string;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [runningTimer, setRunningTimer] = useState<{ id: string; taskId: string; startedAt: string } | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [timeSaving, setTimeSaving] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragPreviewIds, setDragPreviewIds] = useState<string[] | null>(null);
  const lastOverTaskIdRef = useRef<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    descriptionJson: null as Record<string, unknown> | null,
    descriptionText: "",
    descriptionHtml: "",
    assignedTo: "",
    dueDate: "",
    assignedMonth: "",
    priority: "medium",
    status: "pending",
  });
  const inFlightRef = useRef(false);

  const loadRunningTimer = useCallback(async () => {
    const res = await fetch("/api/admin/tasks/running-timer", { cache: "no-store", credentials: "include" });
    const json = await parseJson(res);
    const running = json.running as { id?: string; taskId?: string; startedAt?: string } | null | undefined;
    if (!res.ok || !json.ok || !running?.id || !running.taskId) {
      setRunningTimer(null);
      return;
    }
    setRunningTimer({
      id: String(running.id),
      taskId: String(running.taskId),
      startedAt: String(running.startedAt ?? ""),
    });
  }, []);

  useEffect(() => {
    void loadRunningTimer();
    const poll = window.setInterval(() => void loadRunningTimer(), 15000);
    return () => window.clearInterval(poll);
  }, [loadRunningTimer]);

  useEffect(() => {
    if (!runningTimer) return;
    setNowTick(Date.now());
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningTimer]);

  useEffect(() => {
    if (!openCardMenuId) return;
    const close = (ev: MouseEvent) => {
      const t = ev.target;
      if (t instanceof Element && t.closest("[data-task-card-menu-root]")) return;
      setOpenCardMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openCardMenuId]);

  const openCreateModal = () => {
    const nowMonth = new Date().toISOString().slice(0, 7);
    setEditingTaskId(null);
    setForm({
      title: "",
      description: "",
      descriptionJson: null,
      descriptionText: "",
      descriptionHtml: "",
      assignedTo: actorUid || "",
      dueDate: "",
      assignedMonth: nowMonth,
      priority: "medium",
      status: "pending",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskRow) => {
    const seed = taskDescriptionEditorContentFromTask(task);
    setEditingTaskId(task.id);
    setForm({
      title: String(task.title ?? ""),
      description: String(task.descriptionText ?? task.description ?? ""),
      descriptionJson: typeof seed === "object" ? seed : null,
      descriptionText: String(task.descriptionText ?? task.description ?? ""),
      descriptionHtml: String(task.descriptionHtml ?? ""),
      assignedTo: String(task.assignedTo ?? ""),
      dueDate: String(task.dueDate ?? "").slice(0, 10),
      assignedMonth: String(task.assignedMonth ?? "") || new Date().toISOString().slice(0, 7),
      priority: String(task.priority ?? "medium"),
      status: String(task.status ?? "pending"),
    });
    setIsModalOpen(true);
  };

  const saveTask = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = form.title.trim();
    if (!trimmed || saving || inFlightRef.current) return;
    inFlightRef.current = true;
    setSaving(true);
    try {
      const endpoint = editingTaskId
        ? `/api/admin/clients/${clientId}/tasks/${editingTaskId}`
        : `/api/admin/clients/${clientId}/tasks`;
      const method = editingTaskId ? "PATCH" : "POST";
      const assignedMonth =
        form.assignedMonth.trim() ||
        (form.dueDate ? form.dueDate.slice(0, 7) : new Date().toISOString().slice(0, 7));
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: trimmed,
          description: form.descriptionText.trim(),
          descriptionText: form.descriptionText.trim(),
          descriptionHtml: form.descriptionHtml.trim(),
          descriptionJson: form.descriptionJson,
          assignedTo: form.assignedTo.trim() || undefined,
          dueDate: form.dueDate,
          assignedMonth,
          priority: form.priority,
          status: form.status,
          tags: [],
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "Error" });
        return;
      }
      onFlash({ type: "ok", text: editingTaskId ? "Tarea actualizada." : "Tarea creada." });
      setIsModalOpen(false);
      onRefresh();
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  };

  const updateTask = async (taskId: string, nextStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo actualizar la tarea." });
        return;
      }
      onFlash({ type: "ok", text: "Tarea actualizada." });
      onRefresh();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const removeTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar la tarea." });
        return;
      }
      onFlash({ type: "ok", text: "Tarea eliminada." });
      onRefresh();
    } finally {
      setDeletingTaskId(null);
    }
  };

  const startTimerForTask = async (task: TaskRow) => {
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/tasks/${encodeURIComponent(task.id)}/time-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: actorUid,
          date: new Date().toISOString().slice(0, 10),
          assignedMonth:
            String(task.assignedMonth ?? "").trim() || new Date().toISOString().slice(0, 7),
          source: "timer",
          action: "start",
        }),
      });
      const j = await parseJson(res);
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: String(j.error ?? "No se pudo iniciar el timer.") });
        return;
      }
      await loadRunningTimer();
      onRefresh();
    } finally {
      setTimeSaving(false);
    }
  };

  const stopTimerFromCard = async () => {
    if (!runningTimer?.id) return;
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/time-entries/${encodeURIComponent(runningTimer.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "stop" }),
      });
      const j = await parseJson(res);
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: String(j.error ?? "No se pudo detener.") });
        return;
      }
      await loadRunningTimer();
      onRefresh();
    } finally {
      setTimeSaving(false);
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const aOrder = Number(a.resolutionOrder ?? Number.NaN);
    const bOrder = Number(b.resolutionOrder ?? Number.NaN);
    const aHasOrder = Number.isFinite(aOrder);
    const bHasOrder = Number.isFinite(bOrder);
    if (aHasOrder && bHasOrder && aOrder !== bOrder) return aOrder - bOrder;
    if (aHasOrder && !bHasOrder) return -1;
    if (!aHasOrder && bHasOrder) return 1;
    const aDue = String(a.dueDate ?? "");
    const bDue = String(b.dueDate ?? "");
    if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
  });
  const reorderIds = (ids: string[], dragId: string, targetId: string) => {
    if (!dragId || !targetId || dragId === targetId) return ids;
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex < 0 || toIndex < 0) return ids;
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };
  const visibleRows = sortedRows.filter((row) => {
    const status = String(row.status ?? "pending");
    if (filter === "done") return status === "done";
    if (filter === "pending") return status !== "done";
    return true;
  });
  const persistResolutionOrder = async (taskIds: string[]) => {
    const stamp = Date.now();
    const requests = taskIds.map((taskId, index) =>
      fetch(`/api/admin/clients/${encodeURIComponent(clientId)}/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resolutionOrder: stamp + index }),
      }),
    );
    const results = await Promise.all(requests);
    if (results.some((res) => !res.ok)) {
      onFlash({ type: "err", text: "No se pudo guardar el orden de resolución." });
      return;
    }
    onFlash({ type: "ok", text: "Orden de resolución actualizado." });
    onRefresh();
  };
  const visibleRowsById = new Map(visibleRows.map((row) => [row.id, row]));
  const renderedVisibleRows = dragPreviewIds
    ? dragPreviewIds
      .map((id) => visibleRowsById.get(id))
      .filter((row): row is TaskRow => Boolean(row))
    : visibleRows;
  const groupedRows = (() => {
    const map = new Map<string, TaskRow[]>();
    for (const row of renderedVisibleRows) {
      const assignedMonth = String(row.assignedMonth ?? "");
      const fallbackDue = String(row.dueDate ?? "");
      const month = /^\d{4}-\d{2}$/.test(assignedMonth)
        ? assignedMonth
        : /^\d{4}-\d{2}/.test(fallbackDue)
          ? fallbackDue.slice(0, 7)
          : new Date().toISOString().slice(0, 7);
      const list = map.get(month) ?? [];
      list.push(row);
      map.set(month, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();
  const monthLabel = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, 1);
    return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  };
  const userById = new Map(users.map((u) => [u.id, u]));
  const personMeta = (userId: string) => {
    const u = userById.get(userId);
    const label = u?.fullName || u?.email || (userId ? userId.slice(0, 8) : "Sin asignar");
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return { label, initials, photoURL: u?.photoURL || "" };
  };

  const formatMinutes = (minutes: number) => {
    const total = Math.max(0, Math.round(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (!h) return `${m}m`;
    if (!m) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatRunningClock = (totalSeconds: number) => {
    const sec = Math.max(0, totalSeconds);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
    return `${m}m ${String(s).padStart(2, "0")}s`;
  };

  const formatTaskDueLong = (due: string) => {
    if (!due || due.length < 10) return null;
    const d = new Date(`${due.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(d);
  };
  const formatAssignedMonthLabel = (monthRaw: string) => {
    const month = String(monthRaw ?? "").trim();
    if (!/^\d{4}-\d{2}$/.test(month)) return "—";
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, (m || 1) - 1, 1);
    return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
  };
  const shareTaskLink = async (taskId: string) => {
    const url = `${window.location.origin}/admin/tasks/${encodeURIComponent(taskId)}`;
    try {
      await navigator.clipboard.writeText(url);
      onFlash({ type: "ok", text: "Link de tarea copiado." });
    } catch {
      onFlash({ type: "err", text: "No se pudo copiar el link." });
    }
  };

  const statusLabelCard = (value: string) =>
    value === "pending"
      ? "pendiente"
      : value === "in_progress"
        ? "en proceso"
        : value === "blocked"
          ? "en revisión"
          : value === "done"
            ? "completada"
            : value === "cancelled"
              ? "cancelada"
              : value;

  const statusClassCard = (value: string) =>
    value === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : value === "blocked"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : value === "in_progress"
          ? "border-orange-200 bg-orange-50 text-orange-800"
          : "border-violet-200 bg-violet-50 text-violet-800";

  const priorityLabelCard = (value: string) =>
    value === "high" ? "Alta" : value === "medium" ? "Media" : value === "low" ? "Baja" : value;

  const priorityClassCard = (value: string) =>
    value === "high"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : value === "low"
        ? "border-sky-200 bg-sky-50 text-sky-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

  const hasRunningTimer = Boolean(runningTimer?.taskId);

  const runningElapsedSeconds =
    runningTimer?.startedAt && !Number.isNaN(new Date(runningTimer.startedAt).getTime())
      ? Math.max(0, Math.floor((nowTick - new Date(runningTimer.startedAt).getTime()) / 1000))
      : 0;

  const minutesForActor = (task: TaskRow) => {
    const raw = task.timeByUserMinutes as Record<string, unknown> | undefined;
    if (!raw || typeof raw !== "object") return 0;
    const v = raw[actorUid];
    return Number(typeof v === "number" ? v : Number(v ?? 0)) || 0;
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Tareas del cliente</h3>
            <p className="mt-1 text-xs text-zinc-500">Mismo formato que el tablero global; el tiempo mostrado es el tuyo en cada tarea.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            + Nueva tarea
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "pending", label: "Pendientes" },
            { id: "done", label: "Finalizadas" },
            { id: "all", label: "Todas" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filter === item.id
                  ? "border-rose-300 bg-rose-100 text-rose-900"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form className="w-full max-w-3xl rounded-2xl bg-zinc-100 p-4" onSubmit={(e) => void saveTask(e)}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                {editingTaskId ? "Editar tarea" : "Crear tarea"}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Título"
              />
              <select
                className={inputClass}
                value={form.assignedTo}
                onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
              >
                <option value="">Responsable</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Descripción
                </label>
                <TaskRichTextEditor
                  key={editingTaskId ?? "new-task"}
                  variant="modal"
                  valueJson={
                    form.descriptionJson ?? (form.descriptionHtml.trim() ? form.descriptionHtml : null)
                  }
                  onChange={(payload) =>
                    setForm((p) => ({
                      ...p,
                      description: payload.text,
                      descriptionText: payload.text,
                      descriptionHtml: payload.html,
                      descriptionJson: payload.json,
                    }))
                  }
                />
              </div>
              <input
                className={inputClass}
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              />
              <input
                className={inputClass}
                type="month"
                value={form.assignedMonth}
                onChange={(e) => setForm((p) => ({ ...p, assignedMonth: e.target.value }))}
              />
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En proceso</option>
                <option value="blocked">Bloqueada</option>
                <option value="done">Terminada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="mt-3 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-semibold text-zinc-900 disabled:opacity-50"
            >
              {saving ? "Guardando…" : editingTaskId ? "Guardar cambios" : "Crear tarea"}
            </button>
          </form>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">Todavía no hay tareas para este cliente</p>
          <p className="mt-1 text-xs text-zinc-500">Creá la primera tarea para empezar a ordenar el sprint mensual.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            Crear primera tarea
          </button>
        </div>
      ) : null}

      {rows.length > 0 && groupedRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">No hay resultados para este filtro</p>
          <p className="mt-1 text-xs text-zinc-500">Probá con otro filtro o creá una nueva tarea.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            + Nueva tarea
          </button>
        </div>
      ) : null}

      <div className="grid gap-4">
        {groupedRows.map(([month, monthRows], index) => (
          <details key={month} open={index === 0} className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-800">
              {monthLabel(month)} ({monthRows.length})
            </summary>
            <div
              className="grid gap-4 border-t border-zinc-100 p-4 md:grid-cols-2"
              onDragOver={(e) => {
                e.preventDefault();
                const t = e.target;
                if (!(t instanceof Element)) return;
                const hit = t.closest("[data-task-card-id]");
                const id = hit?.getAttribute("data-task-card-id") ?? null;
                lastOverTaskIdRef.current = id;
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dragId =
                  e.dataTransfer.getData("text/task-id") || e.dataTransfer.getData("text/plain");
                if (!dragId) return;
                const preview = dragPreviewIds ?? visibleRows.map((row) => row.id);
                const targetId = lastOverTaskIdRef.current ?? dragId;
                const normalized = reorderIds(preview, dragId, targetId);
                void persistResolutionOrder(normalized);
                lastOverTaskIdRef.current = null;
                setDraggingTaskId(null);
                setDragPreviewIds(null);
              }}
            >
              {monthRows.map((task) => {
                const due = String(task.dueDate ?? "");
                const overdue =
                  Boolean(due) && due < new Date().toISOString() && String(task.status ?? "") !== "done";
                const assignee = personMeta(String(task.assignedTo ?? ""));
                const st = String(task.status ?? "pending");
                const isDone = st === "done";
                const isRunningHere = runningTimer?.taskId === task.id;
                const dueLong = due ? formatTaskDueLong(due) : null;
                const clientLabel = String(task.clientName ?? "").trim() || clientDisplayName;
                const myMins = minutesForActor(task);
                const blockedStart =
                  hasRunningTimer && runningTimer?.taskId !== task.id && !isRunningHere;
                const taskTitle = String(task.title ?? "Tarea");
                const informer = personMeta(String(task.createdBy ?? ""));
                const assignedMonthLabel = formatAssignedMonthLabel(String(task.assignedMonth ?? ""));
                const isDragPlaceholder = draggingTaskId === task.id;

                return (
                  <article
                    key={task.id}
                    draggable
                    data-task-card-id={task.id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", task.id);
                      e.dataTransfer.setData("text/task-id", task.id);
                      attachTaskCardDragPreview(e);
                      setDraggingTaskId(task.id);
                      setDragPreviewIds(visibleRows.map((row) => row.id));
                    }}
                    onDragEnd={() => {
                      window.setTimeout(() => {
                        setDraggingTaskId(null);
                        setDragPreviewIds(null);
                      }, 0);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!draggingTaskId || draggingTaskId === task.id) return;
                      e.dataTransfer.dropEffect = "move";
                      setDragPreviewIds((prev) => {
                        const base = prev ?? visibleRows.map((row) => row.id);
                        const next = reorderIds(base, draggingTaskId, task.id);
                        return next.join("|") === base.join("|") ? prev ?? base : next;
                      });
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const dragId =
                        e.dataTransfer.getData("text/task-id") || e.dataTransfer.getData("text/plain");
                      if (!dragId) return;
                      const preview = dragPreviewIds ?? visibleRows.map((row) => row.id);
                      const normalized = reorderIds(preview, dragId, task.id);
                      void persistResolutionOrder(normalized);
                      setDraggingTaskId(null);
                      setDragPreviewIds(null);
                    }}
                    className={`relative rounded-2xl border p-4 transition-all duration-150 ${isDragPlaceholder ? "cursor-grabbing border-dashed border-rose-400/60 bg-gradient-to-br from-rose-50/80 via-white to-rose-50/40 shadow-inner ring-1 ring-rose-200/70" : "cursor-grab border-zinc-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-zinc-200"} ${!isDragPlaceholder && overdue ? "ring-1 ring-red-100" : ""} ${!isDragPlaceholder && isRunningHere ? "shadow-[inset_5px_0_0_0_#FF85A2]" : ""} ${!isDragPlaceholder && draggingTaskId && draggingTaskId !== task.id ? "hover:ring-2 hover:ring-rose-100" : ""}`}
                  >
                    {isDragPlaceholder ? (
                      <div className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 px-2 text-center select-none pointer-events-none">
                        <RiDraggable className="size-10 text-rose-400/90" aria-hidden />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-500">Nuevo lugar</p>
                        <p className="line-clamp-3 max-w-full text-sm font-semibold text-zinc-400/95">{taskTitle}</p>
                        <p className="text-[10px] text-zinc-400">Soltá para confirmar el orden</p>
                      </div>
                    ) : (
                      <>
                    <Link
                      href={`/admin/tasks/${encodeURIComponent(task.id)}`}
                      className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF85A2] focus-visible:ring-offset-2"
                      aria-label={`Abrir tarea: ${taskTitle}`}
                    />
                    <div className="relative z-[2] flex items-start gap-3">
                      <button
                        type="button"
                        disabled={updatingTaskId === task.id || isDone}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          void updateTask(task.id, "done");
                        }}
                        className={
                          isDone
                            ? "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white hover:border-[#FF85A2]"
                        }
                        aria-label="Marcar como finalizada"
                      >
                        {updatingTaskId === task.id ? (
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                        ) : isDone ? (
                          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                            <path d="M7.8 13.4 4.9 10.5 3.8 11.6l4 4 8-8-1.1-1.1-6.9 6.9z" fill="currentColor" />
                          </svg>
                        ) : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900">
                            {taskTitle}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400">
                              <RiDraggable className="size-4" aria-hidden />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void shareTaskLink(task.id);
                              }}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 px-2 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-100"
                            >
                              <RiLink className="size-3.5" aria-hidden />
                              Compartir
                            </button>
                            <div className="relative z-[3] shrink-0" data-task-card-menu-root>
                              <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenCardMenuId((id) => (id === task.id ? null : task.id));
                              }}
                              className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                              aria-label="Más opciones"
                            >
                              <RiMore2Fill className="size-5" aria-hidden />
                            </button>
                              {openCardMenuId === task.id ? (
                              <div className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                                <Link
                                  href={`/admin/tasks/${encodeURIComponent(task.id)}`}
                                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                  onClick={() => setOpenCardMenuId(null)}
                                >
                                  Ver detalle
                                </Link>
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenCardMenuId(null);
                                    openEditModal(task);
                                  }}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  disabled={deletingTaskId === task.id}
                                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenCardMenuId(null);
                                    if (window.confirm("¿Eliminar esta tarea?")) void removeTask(task.id);
                                  }}
                                >
                                  {deletingTaskId === task.id ? "Eliminando…" : "Eliminar"}
                                </button>
                              </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClassCard(st)}`}
                          >
                            {statusLabelCard(st)}
                          </span>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${priorityClassCard(String(task.priority ?? "medium"))}`}
                          >
                            {priorityLabelCard(String(task.priority ?? "medium"))}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-x-8 gap-y-2 text-xs text-zinc-600 sm:grid-cols-2">
                          <p className="flex flex-wrap items-center gap-2">
                            <RiBuilding2Line className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Cliente:</span>
                            {clientLogoURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={clientLogoURL}
                                alt=""
                                className="h-5 w-5 rounded-full border border-zinc-100 object-cover"
                              />
                            ) : null}
                            <span className="font-semibold text-zinc-800">{clientLabel}</span>
                          </p>
                          <p className={`flex flex-wrap items-center gap-2 ${overdue ? "font-semibold text-red-600" : ""}`}>
                            <RiCalendarLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Fecha entrega:</span>
                            <span className="font-semibold text-zinc-800">
                              {dueLong ?? "Sin fecha"}
                              {overdue ? " · Vencida" : ""}
                            </span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2">
                            <RiUserLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Responsable:</span>
                            <span className="font-semibold text-zinc-800">{assignee.label}</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2">
                            <RiUserFollowLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Informador:</span>
                            <span className="font-semibold text-zinc-800">{String(task.createdBy ?? "").trim() ? informer.label : "—"}</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2">
                            <RiFlagLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Prioridad:</span>
                            <span className="font-semibold text-zinc-800">{priorityLabelCard(String(task.priority ?? "medium"))}</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2">
                            <RiCalendarTodoLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                            <span className="text-zinc-500">Mes sprint:</span>
                            <span className="font-semibold capitalize text-zinc-800">{assignedMonthLabel}</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
                            <span className="text-zinc-500">Tu tiempo:</span>
                            <span className="font-semibold tabular-nums text-zinc-900">{formatMinutes(myMins)}</span>
                          </p>
                        </div>

                        <div className="relative z-[3] mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3">
                          {isRunningHere ? (
                            <>
                              <span className="inline-flex items-center gap-2 text-sm font-semibold text-red-600">
                                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                Tiempo corriendo {formatRunningClock(runningElapsedSeconds)}
                              </span>
                              <button
                                type="button"
                                disabled={timeSaving}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  void stopTimerFromCard();
                                }}
                                className="inline-flex items-center gap-2 rounded-full border-2 border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                <RiStopFill className="size-4 text-red-500" aria-hidden />
                                Detener
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={timeSaving || isDone || blockedStart}
                              title={
                                blockedStart ? "Ya hay tiempo corriendo en otra tarea." : undefined
                              }
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void startTimerForTask(task);
                              }}
                              className="ml-auto inline-flex items-center gap-2 rounded-full border-2 border-emerald-400 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <RiPlayLargeFill className="size-4" aria-hidden />
                              Iniciar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
