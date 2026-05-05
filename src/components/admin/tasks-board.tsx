"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  RiDraggable,
  RiArrowRightSLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiCalendarTodoLine,
  RiCheckboxCircleLine,
  RiDownloadLine,
  RiFlagLine,
  RiLink,
  RiLineChartLine,
  RiMore2Fill,
  RiPlayLargeFill,
  RiSearchLine,
  RiStopFill,
  RiTeamLine,
  RiTimeLine,
  RiUserFollowLine,
  RiUserLine,
} from "@remixicon/react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { TaskRichTextEditor } from "@/components/admin/task-rich-text-editor";

type TaskRow = Record<string, unknown> & { id: string };
type UserRow = { id: string; fullName?: string; email?: string; photoURL?: string };
type ClientRow = {
  id: string;
  fullName?: string;
  displayName?: string;
  brandName?: string;
  /** Código corto opcional en Firestore (`shortCode` o `taskPrefix` en el doc). */
  shortCode?: string;
  logoURL?: string;
};
type TimeDashboardEntryRow = {
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

type TimeDashboardState = {
  month: string;
  prevMonthLabel: string;
  taskOptions: Array<{ taskId: string; title: string }>;
  metrics: {
    totalMinutes: number;
    prevMonthTotalMinutes: number;
    avgDailyMinutes: number;
    prevAvgDailyMinutes: number;
    workedDays: number;
    daysInMonth: number;
    tasksWithTime: number;
    tasksInMonth: number;
    bestDay: number | null;
    bestDayLabel: string;
    bestDayMinutes: number;
    weeklyAvgMinutes: number;
  };
  clientBreakdown: Array<{ clientId: string; clientName: string; minutes: number; percentage: number }>;
  dailyMinutes: number[];
  entries: TimeDashboardEntryRow[];
};
const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

/** Tres letras del primer token del nombre (p. ej. oldSchool → OLD, Grace music → GRA). */
function deriveClientCodePrefix(label: string): string {
  const s = label.trim();
  if (!s) return "";
  const firstWord = (s.split(/\s+/)[0] ?? s).trim();
  const stripped = firstWord
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "");
  if (!stripped) return "";
  return stripped.slice(0, 3).toUpperCase();
}

function formatTaskCardTitle(task: TaskRow, client: ClientRow | undefined): string {
  const rawTitle = String(task.title ?? "Tarea").trim() || "Tarea";
  const explicit = client?.shortCode?.trim();
  const prefixFromExplicit = explicit ? explicit.toUpperCase().slice(0, 12) : "";
  const nameFallback = String(task.clientName ?? "").trim();
  const label =
    (client?.brandName && client.brandName.trim()) ||
    (client?.displayName && client.displayName.trim()) ||
    (client?.fullName && client.fullName.trim()) ||
    nameFallback;
  const prefix = prefixFromExplicit || deriveClientCodePrefix(label);
  if (!prefix) return rawTitle;
  return `${prefix} - ${rawTitle}`;
}

async function parseAdminJsonResponse(res: Response): Promise<Record<string, unknown> & { ok?: boolean; error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: `Sin respuesta del servidor (${res.status}).` };
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown> & { ok?: boolean; error?: string };
  } catch {
    return {
      ok: false,
      error: trimmed.startsWith("<")
        ? `El servidor respondió con HTML (${res.status}), no JSON. Revisá logs del servidor.`
        : `Respuesta inválida (${res.status}).`,
    };
  }
}

function networkErrorMessage(cause: unknown): string {
  if (cause instanceof TypeError && cause.message === "Failed to fetch") {
    return "No se pudo conectar con el servidor. Si estás en desarrollo, revisá que `npm run dev` siga corriendo y recargá la página.";
  }
  return cause instanceof Error ? cause.message : "Error de red.";
}

/** Encoded task id segment for /api/admin/tasks/:taskId/... */
function adminTaskApi(taskId: string, subresource?: "thread" | "time-entries" | "comments") {
  const id = encodeURIComponent(taskId);
  return subresource ? `/api/admin/tasks/${id}/${subresource}` : `/api/admin/tasks/${id}`;
}

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useAdminToast();
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [savingModal, setSavingModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientFilter, setClientFilter] = useState("all");
  const [viewTab, setViewTab] = useState<"tasks" | "times">("tasks");
  const [timeDashboardData, setTimeDashboardData] = useState<TimeDashboardState | null>(null);
  const [timeDashboardLoading, setTimeDashboardLoading] = useState(false);
  const [timeMonthFilter, setTimeMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [timeClientFilter, setTimeClientFilter] = useState("all");
  const [timeUserFilter, setTimeUserFilter] = useState("all");
  const [timeTaskFilter, setTimeTaskFilter] = useState("all");
  const [timeLogSearch, setTimeLogSearch] = useState("");
  const [timeLogPage, setTimeLogPage] = useState(1);
  const [timeLogPageSize, setTimeLogPageSize] = useState(10);
  const [timeEntryMenuId, setTimeEntryMenuId] = useState<string | null>(null);
  const [timesNowTick, setTimesNowTick] = useState(0);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [timeModalTask, setTimeModalTask] = useState<TaskRow | null>(null);
  const [timeSaving, setTimeSaving] = useState(false);
  const [timeForm, setTimeForm] = useState({
    userId: actorUid,
    date: new Date().toISOString().slice(0, 10),
    assignedMonth: new Date().toISOString().slice(0, 7),
    minutesInput: "",
    note: "",
  });
  const [openedTimesTabFromUrl, setOpenedTimesTabFromUrl] = useState(false);
  const [runningTimer, setRunningTimer] = useState<{ id: string; taskId: string; startedAt: string } | null>(null);
  const [statusSegment, setStatusSegment] = useState<"all" | "unresolved" | "pending" | "in_progress" | "review" | "done">("unresolved");
  const [boardMonthFilter, setBoardMonthFilter] = useState(() => new Date().toISOString().slice(0, 7));
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [boardAssigneeScope, setBoardAssigneeScope] = useState<"all" | "mine">("all");
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    clientId: "",
    assignedTo: "",
    dueDate: "",
    assignedMonth: new Date().toISOString().slice(0, 7),
    priority: "medium",
    status: "pending",
    tags: "",
    descriptionJson: null as Record<string, unknown> | null,
    descriptionText: "",
    descriptionHtml: "",
  });

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const taskMonth = (task: TaskRow) => {
    const assignedMonth = String(task.assignedMonth ?? "");
    if (/^\d{4}-\d{2}$/.test(assignedMonth)) return assignedMonth;
    const dueDate = String(task.dueDate ?? "");
    if (/^\d{4}-\d{2}/.test(dueDate)) return dueDate.slice(0, 7);
    const createdAt = String(task.createdAt ?? "");
    if (/^\d{4}-\d{2}/.test(createdAt)) return createdAt.slice(0, 7);
    return new Date().toISOString().slice(0, 7);
  };

  const baseBoardTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (String(task.status ?? "") === "cancelled") return false;
      const taskClientId = String(task.clientId ?? "");
      if (clientFilter !== "all" && taskClientId !== clientFilter) return false;
      const month = taskMonth(task);
      if (month !== boardMonthFilter) return false;
      const pr = String(task.priority ?? "medium");
      if (priorityFilter !== "all" && pr !== priorityFilter) return false;
      if (boardAssigneeScope === "mine") {
        if (!actorUid) return false;
        if (String(task.assignedTo ?? "") !== actorUid) return false;
      }
      return true;
    });
  }, [tasks, clientFilter, boardMonthFilter, priorityFilter, boardAssigneeScope, actorUid]);

  const statusCounts = useMemo(() => {
    let pending = 0;
    let in_progress = 0;
    let review = 0;
    let done = 0;
    for (const t of baseBoardTasks) {
      const s = String(t.status ?? "pending");
      if (s === "done") done += 1;
      else if (s === "in_progress") in_progress += 1;
      else if (s === "blocked") review += 1;
      else pending += 1;
    }
    return {
      all: baseBoardTasks.length,
      unresolved: pending + in_progress + review,
      pending,
      in_progress,
      review,
      done,
    };
  }, [baseBoardTasks]);

  const segmentFilteredTasks = useMemo(() => {
    return baseBoardTasks.filter((task) => {
      const status = String(task.status ?? "pending");
      if (statusSegment === "all") return true;
      if (statusSegment === "unresolved") return status !== "done" && status !== "cancelled";
      if (statusSegment === "pending") return status === "pending";
      if (statusSegment === "in_progress") return status === "in_progress";
      if (statusSegment === "review") return status === "blocked";
      if (statusSegment === "done") return status === "done";
      return true;
    });
  }, [baseBoardTasks, statusSegment]);

  const monthLabel = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, 1);
    return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  };

  const sortedBoardTasks = useMemo(() => {
    const now = new Date().toISOString();
    return [...segmentFilteredTasks].sort((a, b) => {
      const aOrder = Number(a.resolutionOrder ?? Number.NaN);
      const bOrder = Number(b.resolutionOrder ?? Number.NaN);
      const aHasOrder = Number.isFinite(aOrder);
      const bHasOrder = Number.isFinite(bOrder);
      if (aHasOrder && bHasOrder && aOrder !== bOrder) return aOrder - bOrder;
      if (aHasOrder && !bHasOrder) return -1;
      if (!aHasOrder && bHasOrder) return 1;
      const aDue = String(a.dueDate ?? "");
      const bDue = String(b.dueDate ?? "");
      const aStatus = String(a.status ?? "pending");
      const bStatus = String(b.status ?? "pending");
      const aOverdue = aDue ? aDue < now && aStatus !== "done" && aStatus !== "cancelled" : false;
      const bOverdue = bDue ? bDue < now && bStatus !== "done" && bStatus !== "cancelled" : false;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
      if (aDue && !bDue) return -1;
      if (!aDue && bDue) return 1;
      return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
    });
  }, [segmentFilteredTasks]);

  const reorderByIndex = (ids: string[], fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return ids;
    const next = [...ids];
    const [moved] = next.splice(fromIndex, 1);
    if (!moved) return ids;
    next.splice(toIndex, 0, moved);
    return next;
  };

  const persistResolutionOrder = async (taskIds: string[]) => {
    const stamp = Date.now();
    const orderById = new Map(taskIds.map((id, index) => [id, stamp + index]));
    setTasks((prev) => prev.map((task) => (orderById.has(task.id) ? { ...task, resolutionOrder: orderById.get(task.id) } : task)));
    try {
      const responses = await Promise.all(
        taskIds.map((taskId, index) =>
          fetch(adminTaskApi(taskId), {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ resolutionOrder: stamp + index }),
          }),
        ),
      );
      if (responses.some((res) => !res.ok)) {
        throw new Error("order-failed");
      }
    } catch {
      toast.error("No se pudo guardar el nuevo orden.");
      await reloadTasks();
    }
  };

  const taskTotalPages = Math.max(1, Math.ceil(sortedBoardTasks.length / taskPageSize));
  const paginatedBoardTasks = useMemo(() => {
    const start = (taskPage - 1) * taskPageSize;
    return sortedBoardTasks.slice(start, start + taskPageSize);
  }, [sortedBoardTasks, taskPage, taskPageSize]);

  const onBoardDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;
    const currentPageIds = paginatedBoardTasks.map((task) => task.id);
    const reorderedPageIds = reorderByIndex(currentPageIds, source.index, destination.index);
    if (reorderedPageIds.length !== currentPageIds.length) return;
    const allIds = sortedBoardTasks.map((task) => task.id);
    const start = (taskPage - 1) * taskPageSize;
    const merged = [...allIds];
    reorderedPageIds.forEach((id, idx) => {
      merged[start + idx] = id;
    });
    void persistResolutionOrder(merged);
  };

  const filteredTimeLogEntries = useMemo(() => {
    const list = timeDashboardData?.entries ?? [];
    const q = timeLogSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((e) => `${e.taskTitle} ${e.clientName}`.toLowerCase().includes(q));
  }, [timeDashboardData?.entries, timeLogSearch]);

  const timeLogTotalPages = Math.max(1, Math.ceil(filteredTimeLogEntries.length / timeLogPageSize));

  const paginatedTimeLogEntries = useMemo(() => {
    const start = (timeLogPage - 1) * timeLogPageSize;
    return filteredTimeLogEntries.slice(start, start + timeLogPageSize);
  }, [filteredTimeLogEntries, timeLogPage, timeLogPageSize]);

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
      toast.success("Link de tarea copiado.");
    } catch {
      toast.error("No se pudo copiar el link.");
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

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      clientId: "",
      assignedTo: "",
      dueDate: "",
      assignedMonth: new Date().toISOString().slice(0, 7),
      priority: "medium",
      status: "pending",
      tags: "",
      descriptionJson: null,
      descriptionText: "",
      descriptionHtml: "",
    });
  };

  const reloadTasks = async () => {
    const res = await fetch("/api/admin/tasks", { cache: "no-store", credentials: "include" });
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

  const loadTimeDashboard = async () => {
    setTimeDashboardLoading(true);
    try {
      const params = new URLSearchParams({ month: timeMonthFilter });
      if (timeClientFilter !== "all") params.set("clientId", timeClientFilter);
      if (timeUserFilter !== "all") params.set("userId", timeUserFilter);
      if (timeTaskFilter !== "all") params.set("taskId", timeTaskFilter);
      let res: Response;
      try {
        res = await fetch(`/api/admin/tasks/time-dashboard?${params}`, {
          cache: "no-store",
          credentials: "include",
        });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        setTimeDashboardData(null);
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo cargar el panel de tiempos."));
        setTimeDashboardData(null);
        return;
      }
      const { ok: _ok, error: _e, ...rest } = json;
      setTimeDashboardData(rest as TimeDashboardState);
    } finally {
      setTimeDashboardLoading(false);
    }
  };

  const loadRunningTimer = async () => {
    const res = await fetch("/api/admin/tasks/running-timer", { cache: "no-store", credentials: "include" });
    const text = await res.text();
    let json: { ok?: boolean; running?: { id?: string; taskId?: string; startedAt?: string } | null } | null = null;
    try {
      json = text ? (JSON.parse(text) as { ok?: boolean; running?: { id?: string; taskId?: string; startedAt?: string } | null }) : null;
    } catch {
      json = null;
    }
    const running = json?.running;
    if (!res.ok || !json?.ok || !running?.id || !running.taskId) {
      setRunningTimer(null);
      return;
    }
    setRunningTimer({
      id: String(running.id),
      taskId: String(running.taskId),
      startedAt: String(running.startedAt ?? ""),
    });
  };

  useEffect(() => {
    if (viewTab !== "times") return;
    void loadTimeDashboard();
  }, [viewTab, timeMonthFilter, timeClientFilter, timeUserFilter, timeTaskFilter]);

  useEffect(() => {
    void loadRunningTimer();
    const poll = window.setInterval(() => void loadRunningTimer(), 15000);
    return () => window.clearInterval(poll);
  }, []);

  useEffect(() => {
    if (!runningTimer) return;
    setNowTick(Date.now());
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningTimer]);

  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const runningTaskIdParam = searchParams.get("runningTaskId");
    const id = taskIdParam || runningTaskIdParam;
    if (!id) return;
    router.replace(`/admin/tasks/${encodeURIComponent(id)}`);
  }, [searchParams, router]);

  useEffect(() => {
    setTaskPage((p) => Math.min(p, taskTotalPages));
  }, [taskTotalPages]);

  useEffect(() => {
    setTaskPage(1);
  }, [clientFilter, boardMonthFilter, priorityFilter, boardAssigneeScope, statusSegment]);

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

  useEffect(() => {
    setTimeLogPage(1);
  }, [timeMonthFilter, timeClientFilter, timeUserFilter, timeTaskFilter, timeLogSearch]);

  useEffect(() => {
    setTimeLogPage((p) => Math.min(p, timeLogTotalPages));
  }, [timeLogTotalPages]);

  useEffect(() => {
    if (!timeEntryMenuId) return;
    const close = (ev: MouseEvent) => {
      const t = ev.target;
      if (t instanceof Element && t.closest("[data-time-entry-menu-root]")) return;
      setTimeEntryMenuId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [timeEntryMenuId]);

  useEffect(() => {
    if (viewTab !== "times") return;
    setTimesNowTick(Date.now());
    const id = window.setInterval(() => setTimesNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [viewTab]);

  useEffect(() => {
    if (openedTimesTabFromUrl) return;
    const v = String(searchParams.get("view") ?? "");
    if (v !== "times") return;
    setViewTab("times");
    setOpenedTimesTabFromUrl(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("view");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [searchParams, openedTimesTabFromUrl]);

  const openTimeModal = (task: TaskRow) => {
    const month = String(task.assignedMonth ?? "").trim() || new Date().toISOString().slice(0, 7);
    setTimeForm({
      userId: actorUid,
      date: new Date().toISOString().slice(0, 10),
      assignedMonth: /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7),
      minutesInput: "",
      note: "",
    });
    setTimeModalTask(task);
    setIsTimeModalOpen(true);
  };

  const saveTimeEntry = async () => {
    if (!timeModalTask?.id) return;
    if (!timeForm.minutesInput.trim()) {
      toast.error("Ingresá una duración.");
      return;
    }
    setTimeSaving(true);
    try {
      const res = await fetch(adminTaskApi(timeModalTask.id, "time-entries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(timeForm),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar el tiempo."));
        return;
      }
      toast.success("Tiempo cargado.");
      setIsTimeModalOpen(false);
      await reloadTasks();
      if (viewTab === "times") await loadTimeDashboard();
    } finally {
      setTimeSaving(false);
    }
  };

  const saveTask = async () => {
    if (!form.title.trim() || !form.clientId) {
      toast.error("Completá al menos título y cliente.");
      return;
    }
    setSavingModal(true);
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.descriptionText.trim(),
          descriptionText: form.descriptionText.trim(),
          descriptionHtml: form.descriptionHtml.trim(),
          descriptionJson: form.descriptionJson,
          clientId: form.clientId,
          assignedTo: form.assignedTo,
          dueDate: form.dueDate,
          assignedMonth:
            form.assignedMonth || (form.dueDate ? form.dueDate.slice(0, 7) : new Date().toISOString().slice(0, 7)),
          priority: form.priority,
          status: form.status,
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
      toast.success("Tarea creada.");
      await reloadTasks();
      resetForm();
      setIsModalOpen(false);
    } finally {
      setSavingModal(false);
    }
  };

  const startTimerForTask = async (task: TaskRow) => {
    setTimeSaving(true);
    try {
      const res = await fetch(adminTaskApi(task.id, "time-entries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: actorUid,
          date: new Date().toISOString().slice(0, 10),
          assignedMonth: String(task.assignedMonth ?? "").trim() || new Date().toISOString().slice(0, 7),
          source: "timer",
          action: "start",
        }),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo iniciar timer.");
        return;
      }
      toast.success("Timer iniciado.");
      await loadRunningTimer();
      if (viewTab === "times") await loadTimeDashboard();
    } finally {
      setTimeSaving(false);
    }
  };

  const stopTimerFromCard = async () => {
    if (!runningTimer?.id || !runningTimer.taskId) return;
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/time-entries/${runningTimer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "stop" }),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo finalizar timer.");
        return;
      }
      toast.success("Sesion finalizada.");
      await loadRunningTimer();
      await reloadTasks();
      if (viewTab === "times") await loadTimeDashboard();
    } finally {
      setTimeSaving(false);
    }
  };

  const stopRunningEntry = async (entryId: string) => {
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/time-entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "stop" }),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo finalizar timer.");
        return;
      }
      toast.success("Sesión finalizada.");
      await loadRunningTimer();
      await reloadTasks();
      if (viewTab === "times") await loadTimeDashboard();
    } finally {
      setTimeSaving(false);
    }
  };

  const deleteTimeEntryById = async (entryId: string) => {
    const confirmed = window.confirm("¿Eliminar este registro de tiempo?");
    if (!confirmed) return;
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/time-entries/${entryId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo eliminar el registro.");
        return;
      }
      toast.success("Registro eliminado.");
      await reloadTasks();
      if (viewTab === "times") await loadTimeDashboard();
    } finally {
      setTimeSaving(false);
    }
  };

  const patchTaskStatus = async (taskId: string, status: string) => {
    setSavingTaskId(taskId);
    const res = await fetch(adminTaskApi(taskId), {
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
    const res = await fetch(adminTaskApi(taskId), {
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

  const pctVersusPrev = (current: number, prev: number) => {
    if (prev <= 0) return current > 0 ? { label: "+100%", up: true } : { label: "—", up: true };
    const raw = Math.round(((current - prev) / prev) * 100);
    return { label: `${raw >= 0 ? "+" : ""}${raw}%`, up: raw >= 0 };
  };

  const taskDotTone = (taskId: string) => {
    const tones = ["bg-violet-500", "bg-fuchsia-500", "bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500"];
    let h = 0;
    for (let i = 0; i < taskId.length; i++) h += taskId.charCodeAt(i);
    return tones[h % tones.length] ?? "bg-violet-500";
  };

  const formatShortEntryDate = (iso: string) => {
    if (!iso || iso.length < 10) return "—";
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(d).replace(/\.$/, "");
  };

  const formatEntryDuration = (entry: TimeDashboardEntryRow) => {
    if (entry.status === "running" && entry.startedAt) {
      const sec = Math.max(0, Math.floor((timesNowTick - new Date(entry.startedAt).getTime()) / 1000));
      return formatRunningClock(sec);
    }
    const mins = Number(entry.minutes ?? 0);
    return formatRunningClock(Math.round(mins * 60));
  };

  const exportTimeCsv = () => {
    const rows = filteredTimeLogEntries;
    const header = ["Fecha", "Tarea", "Cliente", "Responsable", "Minutos", "Estado", "Origen"];
    const lines = [header.join(",")];
    for (const e of rows) {
      lines.push(
        [
          e.date,
          `"${String(e.taskTitle).replace(/"/g, '""')}"`,
          `"${String(e.clientName).replace(/"/g, '""')}"`,
          `"${String(e.userName).replace(/"/g, '""')}"`,
          String(e.minutes),
          e.status,
          e.source,
        ].join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tiempos-${timeMonthFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maxDailyMinutes = Math.max(1, ...(timeDashboardData?.dailyMinutes ?? [0]));

  const runningElapsedSeconds = runningTimer?.startedAt
    ? Math.max(0, Math.floor((nowTick - new Date(runningTimer.startedAt).getTime()) / 1000))
    : 0;
  const runningTaskRow = runningTimer ? tasks.find((t) => t.id === runningTimer.taskId) : undefined;
  const runningTaskClient = runningTaskRow ? clientsById.get(String(runningTaskRow.clientId ?? "")) : undefined;
  const runningTaskTitle = runningTaskRow ? formatTaskCardTitle(runningTaskRow, runningTaskClient) : undefined;

  const tabActiveClass = "rounded-full bg-[#FF85A2] px-5 py-2 text-sm font-semibold text-white shadow-sm";
  const tabIdleClass =
    "rounded-full border border-zinc-200 bg-white px-5 py-2 text-sm font-semibold text-zinc-600 shadow-sm transition hover:border-zinc-300";

  const selectShellClass =
    "relative flex items-center gap-2 rounded-xl border border-zinc-200 bg-white pl-3 pr-2 shadow-sm focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100";

  return (
    <section className="grid gap-4">
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <h2 className="text-2xl font-bold uppercase tracking-[0.08em] text-zinc-900">Tareas</h2>
        {runningTimer ? (
          <Link
            href={`/admin/tasks/${encodeURIComponent(runningTimer.taskId)}`}
            className="flex w-full min-w-0 flex-1 items-center gap-3 rounded-full border-2 border-emerald-400
             bg-white px-5 py-3 text-left shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition hover:bg-emerald-50/50 lg:max-w-2xl
             absolute right-4 top-4"
          >
            <span className="inline-flex h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
            <span className="min-w-0 flex-1 text-sm font-semibold leading-snug text-zinc-900">
              <span className="text-emerald-700">En curso:</span>{" "}
              <span className="font-semibold text-zinc-800">{String(runningTaskTitle ?? "Tarea")}</span>
            </span>
            <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-emerald-700">{formatRunningClock(runningElapsedSeconds)}</span>
            <RiArrowRightSLine className="size-5 shrink-0 text-emerald-600" aria-hidden />
          </Link>
        ) : null}
      </div>

      <div className="inline-flex w-fit rounded-full border border-zinc-200 bg-white p-1 shadow-sm gap-2">
        <button type="button" onClick={() => setViewTab("tasks")} className={viewTab === "tasks" ? tabActiveClass : tabIdleClass}>
          Tareas
        </button>

        <button type="button" onClick={() => setViewTab("times")} className={viewTab === "times" ? tabActiveClass : tabIdleClass}>
          Tiempos
        </button>
      </div>

      {viewTab === "times" ? (
        <div className="grid gap-6">
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:flex-wrap xl:items-end xl:justify-between">
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Mes
                  <div className={selectShellClass}>
                    <RiCalendarLine className="size-4 shrink-0 text-rose-400" aria-hidden />
                    <input
                      type="month"
                      value={timeMonthFilter}
                      onChange={(e) => setTimeMonthFilter(e.target.value)}
                      className="min-w-48 cursor-pointer border-0 bg-transparent py-2.5 pr-1 text-sm font-medium text-zinc-900 outline-none"
                    />
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Cliente
                  <div className={selectShellClass}>
                    <select
                      value={timeClientFilter}
                      onChange={(e) => setTimeClientFilter(e.target.value)}
                      className="min-w-44 cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                    >
                      <option value="all">Todos los clientes</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName || client.displayName || client.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Equipo
                  <div className={selectShellClass}>
                    <select
                      value={timeUserFilter}
                      onChange={(e) => setTimeUserFilter(e.target.value)}
                      className="min-w-44 cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                    >
                      <option value="all">Todo el equipo</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.fullName || user.email || user.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Tarea
                  <div className={selectShellClass}>
                    <select
                      value={timeTaskFilter}
                      onChange={(e) => setTimeTaskFilter(e.target.value)}
                      className="min-w-44 cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                    >
                      <option value="all">Todas las tareas</option>
                      {(timeDashboardData?.taskOptions ?? []).map((opt) => (
                        <option key={opt.taskId} value={opt.taskId}>
                          {opt.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={() => void loadTimeDashboard()}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
              >
                Actualizar
              </button>
            </div>
          </div>

          {timeDashboardLoading ? (
            <p className="text-sm text-zinc-600">Cargando datos de tiempos...</p>
          ) : null}

          {timeDashboardData ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {(() => {
                  const m = timeDashboardData.metrics;
                  const tTotal = pctVersusPrev(m.totalMinutes, m.prevMonthTotalMinutes);
                  const tAvg = pctVersusPrev(m.avgDailyMinutes, m.prevAvgDailyMinutes);
                  const cards = [
                    {
                      title: "Tiempo total del mes",
                      value: formatMinutes(m.totalMinutes),
                      sub: (
                        <span className={tTotal.up ? "text-emerald-600" : "text-red-600"}>
                          {tTotal.label} vs. {timeDashboardData.prevMonthLabel}
                        </span>
                      ),
                      Icon: RiTimeLine,
                    },
                    {
                      title: "Promedio diario",
                      value: formatMinutes(Math.round(m.avgDailyMinutes)),
                      sub: (
                        <span className={tAvg.up ? "text-emerald-600" : "text-red-600"}>
                          {tAvg.label} vs. {timeDashboardData.prevMonthLabel}
                        </span>
                      ),
                      Icon: RiLineChartLine,
                    },
                    {
                      title: "Días trabajados",
                      value: `${m.workedDays} de ${m.daysInMonth} días`,
                      sub: <span className="text-zinc-400">Mes seleccionado</span>,
                      Icon: RiCalendarLine,
                    },
                    {
                      title: "Tareas con tiempo",
                      value: `${m.tasksWithTime} de ${m.tasksInMonth} tareas`,
                      sub: <span className="text-zinc-400">Con registros en el mes</span>,
                      Icon: RiCheckboxCircleLine,
                    },
                  ];
                  return cards.map((c) => (
                    <div
                      key={c.title}
                      className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                    >
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100">
                          <c.Icon className="size-5 text-[#FF85A2]" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{c.title}</p>
                          <p className="mt-1 text-xl font-bold tabular-nums text-zinc-900">{c.value}</p>
                          <p className="mt-1 text-xs">{c.sub}</p>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900">Tiempo por cliente</h3>
                    <button
                      type="button"
                      onClick={() => document.getElementById("registros-tiempo")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm font-semibold text-[#FF85A2] hover:text-rose-600"
                    >
                      Ver detalle
                    </button>
                  </div>
                  <ul className="space-y-3">
                    {timeDashboardData.clientBreakdown.map((row) => (
                      <li key={row.clientId}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                          <span className="font-medium text-zinc-800">{row.clientName}</span>
                          <span className="text-zinc-600">
                            {formatMinutes(row.minutes)}
                            <span className="mx-2 text-zinc-300">·</span>
                            <span className="tabular-nums">{row.percentage}%</span>
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rose-100">
                          <div
                            className="h-full rounded-full bg-[#FF85A2]"
                            style={{ width: `${Math.max(4, row.percentage)}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm font-semibold text-zinc-900">
                    <span>Total</span>
                    <span>
                      {formatMinutes(timeDashboardData.metrics.totalMinutes)}
                      <span className="ml-2 font-normal text-zinc-500">100%</span>
                    </span>
                  </div>
                </div>

                <div id="grafico-dias" className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-zinc-900">Tiempo por día</h3>
                    <button
                      type="button"
                      onClick={() => document.getElementById("grafico-dias")?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm font-semibold text-[#FF85A2] hover:text-rose-600"
                    >
                      Ver calendario
                    </button>
                  </div>
                  <div className="flex h-52 items-end gap-0.5 px-1">
                    {timeDashboardData.dailyMinutes.map((minutes, i) => (
                      <div key={i} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
                        <div
                          className="mx-auto w-[72%] rounded-t bg-[#FF85A2]/90 transition hover:bg-[#FF85A2]"
                          style={{
                            height: `${maxDailyMinutes > 0 ? Math.max(6, (minutes / maxDailyMinutes) * 100) : 0}%`,
                          }}
                          title={`${i + 1}: ${formatMinutes(minutes)}`}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-zinc-800">Mejor día:</span>{" "}
                      {timeDashboardData.metrics.bestDayMinutes > 0
                        ? `${timeDashboardData.metrics.bestDayLabel} (${formatMinutes(timeDashboardData.metrics.bestDayMinutes)})`
                        : "—"}
                    </p>
                    <p>
                      <span className="font-semibold text-zinc-800">Promedio semanal:</span>{" "}
                      {formatMinutes(Math.round(timeDashboardData.metrics.weeklyAvgMinutes))}
                    </p>
                  </div>
                </div>
              </div>

              <div id="registros-tiempo" className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">Registros de tiempo</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`${selectShellClass} min-w-[200px] flex-1 lg:max-w-xs`}>
                      <RiSearchLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                      <input
                        type="search"
                        value={timeLogSearch}
                        onChange={(e) => setTimeLogSearch(e.target.value)}
                        placeholder="Buscar tarea o cliente..."
                        className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => exportTimeCsv()}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                    >
                      <RiDownloadLine className="size-4" aria-hidden />
                      Exportar
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        <th className="py-3 pr-3">Fecha</th>
                        <th className="py-3 pr-3">Tarea</th>
                        <th className="py-3 pr-3">Cliente</th>
                        <th className="py-3 pr-3">Responsable</th>
                        <th className="py-3 pr-3">Tiempo</th>
                        <th className="py-3 pr-3">Estado</th>
                        <th className="py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedTimeLogEntries.map((entry) => {
                        const isRunning = entry.status === "running";
                        const showStop = isRunning && entry.id === runningTimer?.id;
                        const taskRow = tasks.find((t) => t.id === entry.taskId);
                        return (
                          <tr key={entry.id} className="text-zinc-800">
                            <td className="py-3 pr-3 whitespace-nowrap">{formatShortEntryDate(entry.date)}</td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex items-center gap-2">
                                <span className={`inline-flex h-2 w-2 shrink-0 rounded-full ${taskDotTone(entry.taskId)}`} />
                                <span className="font-medium">{entry.taskTitle}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex items-center gap-2">
                                {entry.clientLogoURL ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={entry.clientLogoURL} alt="" className="h-6 w-6 rounded-full border border-zinc-100 object-cover" />
                                ) : null}
                                {entry.clientName}
                              </span>
                            </td>
                            <td className="py-3 pr-3">
                              <span className="inline-flex items-center gap-2">
                                {entry.userPhotoURL ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={entry.userPhotoURL} alt="" className="h-6 w-6 rounded-full border border-zinc-100 object-cover" />
                                ) : (
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-[10px] font-semibold text-rose-700">
                                    {(entry.userName || "?").slice(0, 2).toUpperCase()}
                                  </span>
                                )}
                                <span>{entry.userName || entry.userId}</span>
                              </span>
                            </td>
                            <td className="py-3 pr-3 font-mono text-xs font-semibold tabular-nums">{formatEntryDuration(entry)}</td>
                            <td className="py-3 pr-3">
                              {isRunning ? (
                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                                  En curso
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-semibold text-zinc-600">
                                  Completado
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1" data-time-entry-menu-root>
                                {showStop ? (
                                  <button
                                    type="button"
                                    disabled={timeSaving}
                                    onClick={() => void stopRunningEntry(entry.id)}
                                    className="rounded-lg border border-rose-300 bg-white p-1.5 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                                    aria-label="Detener"
                                  >
                                    <RiStopFill className="size-4" />
                                  </button>
                                ) : null}
                                {!isRunning && taskRow ? (
                                  <button
                                    type="button"
                                    disabled={timeSaving}
                                    onClick={() => void startTimerForTask(taskRow)}
                                    className="rounded-lg border border-emerald-300 bg-white p-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                    aria-label="Iniciar tiempo"
                                  >
                                    <RiPlayLargeFill className="size-4" />
                                  </button>
                                ) : null}
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setTimeEntryMenuId((id) => (id === entry.id ? null : entry.id))}
                                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
                                    aria-label="Más"
                                  >
                                    <RiMore2Fill className="size-5" />
                                  </button>
                                  {timeEntryMenuId === entry.id ? (
                                    <div className="absolute right-0 z-30 mt-1 w-40 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                                      <button
                                        type="button"
                                        className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                                        onClick={() => {
                                          setTimeEntryMenuId(null);
                                          void deleteTimeEntryById(entry.id);
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {filteredTimeLogEntries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-zinc-500">Sin registros para este filtro.</p>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
                  <p className="text-sm text-zinc-600">
                    Mostrando{" "}
                    <span className="font-semibold tabular-nums text-zinc-900">
                      {filteredTimeLogEntries.length === 0 ? 0 : (timeLogPage - 1) * timeLogPageSize + 1} –{" "}
                      {Math.min(timeLogPage * timeLogPageSize, filteredTimeLogEntries.length)}
                    </span>{" "}
                    de <span className="font-semibold tabular-nums text-zinc-900">{filteredTimeLogEntries.length}</span> registros
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      disabled={timeLogPage <= 1}
                      onClick={() => setTimeLogPage(1)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                    >
                      ⟨⟨
                    </button>
                    <button
                      type="button"
                      disabled={timeLogPage <= 1}
                      onClick={() => setTimeLogPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    {(() => {
                      const maxBtns = 7;
                      let end = Math.min(timeLogTotalPages, Math.max(timeLogPage + Math.floor(maxBtns / 2), maxBtns));
                      let start = Math.max(1, end - maxBtns + 1);
                      end = Math.min(timeLogTotalPages, start + maxBtns - 1);
                      start = Math.max(1, end - maxBtns + 1);
                      return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTimeLogPage(p)}
                          className={`min-w-8 rounded-lg px-2 py-1 text-xs font-semibold ${p === timeLogPage ? "border border-[#FF85A2] bg-[#FF85A2] text-white shadow-sm" : "border border-transparent text-zinc-700 hover:bg-zinc-50"}`}
                        >
                          {p}
                        </button>
                      ));
                    })()}
                    <button
                      type="button"
                      disabled={timeLogPage >= timeLogTotalPages}
                      onClick={() => setTimeLogPage((p) => Math.min(timeLogTotalPages, p + 1))}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                    >
                      ›
                    </button>
                    <button
                      type="button"
                      disabled={timeLogPage >= timeLogTotalPages}
                      onClick={() => setTimeLogPage(timeLogTotalPages)}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                    >
                      ⟩⟩
                    </button>
                  </div>
                  <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                    Mostrar
                    <select
                      value={timeLogPageSize}
                      onChange={(e) => {
                        setTimeLogPageSize(Number(e.target.value));
                        setTimeLogPage(1);
                      }}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-900"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    por página
                  </label>
                </div>
              </div>
            </>
          ) : !timeDashboardLoading ? (
            <div className="rounded-2xl border border-zinc-100 bg-white p-8 text-center text-sm text-zinc-600 shadow-sm">
              No hay datos de tiempos para mostrar.
            </div>
          ) : null}
        </div>
      ) : null}

      {viewTab === "tasks" ? (
        <>
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Mes
                  <div className={selectShellClass}>
                    <RiCalendarLine className="size-4 shrink-0 text-rose-400" aria-hidden />
                    <input
                      type="month"
                      value={boardMonthFilter}
                      onChange={(e) => setBoardMonthFilter(e.target.value)}
                      className="min-w-[12rem] cursor-pointer border-0 bg-transparent py-2.5 pr-1 text-sm font-medium text-zinc-900 outline-none"
                    />
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Cliente
                  <div className={selectShellClass}>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="min-w-[11rem] cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                    >
                      <option value="all">Todos los clientes</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.fullName || client.displayName || client.id}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Prioridad
                  <div className={selectShellClass}>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)}
                      className="min-w-[10rem] cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                    >
                      <option value="all">Todas las prioridades</option>
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </label>
                <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Vista
                  <div className={selectShellClass}>
                    <RiTeamLine className="size-4 shrink-0 text-rose-400" aria-hidden />
                    <select
                      value={boardAssigneeScope}
                      onChange={(e) => setBoardAssigneeScope(e.target.value as "all" | "mine")}
                      className="min-w-[12rem] cursor-pointer border-0 bg-transparent py-2.5 pr-6 text-sm font-medium text-zinc-900 outline-none"
                      aria-label="Ver tareas del equipo o solo las mías"
                    >
                      <option value="all">Todo el equipo</option>
                      <option value="mine">Mis tareas</option>
                    </select>
                  </div>
                </label>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#FF85A2] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#ff6f94]"
              >
                + Nueva tarea
              </button>
            </div>



            <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4">
              {(
                [
                  { id: "unresolved" as const, label: "Sin resolver", count: statusCounts.unresolved },
                  { id: "all" as const, label: "Todas", count: statusCounts.all },
                  { id: "pending" as const, label: "Pendientes", count: statusCounts.pending },
                  { id: "in_progress" as const, label: "En proceso", count: statusCounts.in_progress },
                  { id: "review" as const, label: "En revisión", count: statusCounts.review },
                  { id: "done" as const, label: "Completadas", count: statusCounts.done },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setStatusSegment(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusSegment === item.id
                    ? "border-[#FF85A2] bg-[#FF85A2] text-white shadow-sm"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                >
                  {item.label}{" "}
                  <span className="tabular-nums opacity-90">{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                Crear tarea
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
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                  Descripción
                </label>
                <TaskRichTextEditor
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
              {savingModal ? "Guardando..." : "Crear tarea"}
            </button>
          </div>
        </div>
      ) : null}


      {viewTab === "tasks" && sortedBoardTasks.length === 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-white p-12 text-center text-sm text-zinc-600 shadow-sm">
          No hay tareas para este filtro.
        </div>
      ) : null}

      {viewTab === "tasks" && sortedBoardTasks.length > 0 ? (
        <div className="grid gap-4">
          <DragDropContext onDragEnd={onBoardDragEnd}>
            <Droppable droppableId="tasks-board-list">
              {(dropProvided) => (
                <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="grid gap-4">
                  {paginatedBoardTasks.map((task, index) => {
              const due = String(task.dueDate ?? "");
              const overdue = due ? due < new Date().toISOString() && String(task.status ?? "") !== "done" : false;
              const assignee = personMeta(String(task.assignedTo ?? ""));
              const client = clientsById.get(String(task.clientId ?? ""));
              const st = String(task.status ?? "pending");
              const isDone = st === "done";
              const isRunningHere = runningTimer?.taskId === task.id;
              const dueLong = due ? formatTaskDueLong(due) : null;
              const cardTitle = formatTaskCardTitle(task, client);
              const informer = personMeta(String(task.createdBy ?? ""));
              const assignedMonthLabel = formatAssignedMonthLabel(String(task.assignedMonth ?? ""));

              return (
                <Draggable key={task.id} draggableId={task.id} index={index}>
                  {(provided, snapshot) => (
                    <article
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative cursor-grab rounded-2xl border border-zinc-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors duration-150 hover:border-zinc-200 active:cursor-grabbing ${overdue ? "ring-1 ring-red-100" : ""} ${isRunningHere ? "shadow-[inset_5px_0_0_0_#FF85A2]" : ""} ${snapshot.isDragging ? "shadow-[0_14px_30px_rgba(0,0,0,0.22)] ring-2 ring-rose-200" : ""}`}
                      style={
                        snapshot.isDropAnimating
                          ? { ...provided.draggableProps.style, transitionDuration: "120ms" }
                          : provided.draggableProps.style
                      }
                    >
                  <Link
                    href={`/admin/tasks/${encodeURIComponent(task.id)}`}
                    className="absolute inset-0 z-[1] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF85A2] focus-visible:ring-offset-2"
                    aria-label={`Abrir tarea: ${cardTitle}`}
                  />
                  {/* pointer-events-none lets clicks reach the overlay Link; interactive bits opt back in */}
                  <div className="relative z-[2] flex pointer-events-none items-start gap-3">
                    <button
                      type="button"
                      disabled={savingTaskId === task.id || isDone}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        void patchTaskStatus(task.id, "done");
                      }}
                      className={
                        isDone
                          ? "pointer-events-auto mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "pointer-events-auto mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-zinc-300 bg-white hover:border-[#FF85A2]"
                      }
                      aria-label="Marcar como finalizada"
                    >
                      {savingTaskId === task.id ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                      ) : isDone ? (
                        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                          <path d="M7.8 13.4 4.9 10.5 3.8 11.6l4 4 8-8-1.1-1.1-6.9 6.9z" fill="currentColor" />
                        </svg>
                      ) : null}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900">{cardTitle}</p>
                        <div className="flex items-center gap-1">
                          <span className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400">
                            <RiDraggable className="size-4" aria-hidden />
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void shareTaskLink(task.id);
                            }}
                            className="pointer-events-auto inline-flex h-7 items-center gap-1 rounded-lg border border-zinc-200 px-2 text-[11px] font-semibold text-zinc-600 transition hover:bg-zinc-100"
                          >
                            <RiLink className="size-3.5" aria-hidden />
                            Compartir
                          </button>
                          <div className="relative z-[3] shrink-0 pointer-events-auto" data-task-card-menu-root>
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
                                className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-700 hover:bg-red-50"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setOpenCardMenuId(null);
                                  if (window.confirm("¿Eliminar esta tarea?")) void deleteTask(task.id);
                                }}
                              >
                                Eliminar
                              </button>
                            </div>
                          ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${statusClassCard(st)}`}>{statusLabelCard(st)}</span>
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${priorityClassCard(String(task.priority ?? "medium"))}`}>{priorityLabelCard(String(task.priority ?? "medium"))}</span>
                          </div>

                          <div className="mt-3 grid gap-x-8 gap-y-2 text-xs text-zinc-600 sm:grid-cols-2">
                            <p className="flex flex-wrap items-center gap-2">
                              <RiBuilding2Line className="size-4 shrink-0 text-zinc-400" aria-hidden />
                              <span className="text-zinc-500">Cliente:</span>
                              {client?.logoURL ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={client.logoURL} alt="" className="h-5 w-5 rounded-full border border-zinc-100 object-cover" />
                              ) : null}
                              <span className="font-semibold text-zinc-800">{client?.fullName || client?.displayName || String(task.clientName ?? "—")}</span>
                            </p>
                            <p className={`flex flex-wrap items-center gap-2 ${overdue ? "font-semibold text-red-600" : ""}`}>
                              <RiCalendarLine className="size-4 shrink-0 text-zinc-400" aria-hidden />
                              <span className="text-zinc-500">Fecha entrega:</span>
                              <span className="font-semibold text-zinc-800">{dueLong ?? "Sin fecha"}{overdue ? " · Vencida" : ""}</span>
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
                          </div>
                        </div>

                        <div className="relative z-[3] flex pointer-events-none min-w-[180px] flex-col items-end justify-end gap-3 border-t border-zinc-100 pt-3 md:min-w-[220px] md:border-t-0 md:border-l md:border-zinc-100 md:pl-4 md:pt-0">
                          {isRunningHere ? (
                            <>
                              <span className="inline-flex items-center gap-2 text-right text-sm font-semibold text-red-600">
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
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-2 border-rose-400 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
                              >
                                <RiStopFill className="size-4 text-red-500" aria-hidden />
                                Detener
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={timeSaving || isDone}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void startTimerForTask(task);
                              }}
                              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border-2 border-emerald-400 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:opacity-50"
                            >
                              <RiPlayLargeFill className="size-4" aria-hidden />
                              Iniciar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                  )}
                </Draggable>
              );
                  })}
                  {dropProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="flex flex-col gap-4 border-t border-zinc-100 pt-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <p className="text-sm text-zinc-600">
              Mostrando{" "}
              <span className="font-semibold tabular-nums text-zinc-900">
                {sortedBoardTasks.length === 0 ? 0 : (taskPage - 1) * taskPageSize + 1} – {Math.min(taskPage * taskPageSize, sortedBoardTasks.length)}
              </span>{" "}
              de <span className="font-semibold tabular-nums text-zinc-900">{sortedBoardTasks.length}</span> tareas
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                disabled={taskPage <= 1}
                onClick={() => setTaskPage(1)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                aria-label="Primera página"
              >
                ⟨⟨
              </button>
              <button
                type="button"
                disabled={taskPage <= 1}
                onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                aria-label="Página anterior"
              >
                ‹
              </button>
              {(() => {
                const maxBtns = 7;
                let end = Math.min(taskTotalPages, Math.max(taskPage + Math.floor(maxBtns / 2), maxBtns));
                let start = Math.max(1, end - maxBtns + 1);
                end = Math.min(taskTotalPages, start + maxBtns - 1);
                start = Math.max(1, end - maxBtns + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPage(p)}
                    className={`min-w-[2rem] rounded-lg px-2 py-1 text-xs font-semibold ${p === taskPage ? "border border-[#FF85A2] bg-[#FF85A2] text-white shadow-sm" : "border border-transparent text-zinc-700 hover:bg-zinc-50"}`}
                  >
                    {p}
                  </button>
                ));
              })()}
              <button
                type="button"
                disabled={taskPage >= taskTotalPages}
                onClick={() => setTaskPage((p) => Math.min(taskTotalPages, p + 1))}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                aria-label="Página siguiente"
              >
                ›
              </button>
              <button
                type="button"
                disabled={taskPage >= taskTotalPages}
                onClick={() => setTaskPage(taskTotalPages)}
                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:opacity-40"
                aria-label="Última página"
              >
                ⟩⟩
              </button>
            </div>
            <label className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              Mostrar
              <select
                value={taskPageSize}
                onChange={(e) => {
                  setTaskPageSize(Number(e.target.value));
                  setTaskPage(1);
                }}
                className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-900"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              por página
            </label>
          </div>
        </div>
      ) : null}

      {isTimeModalOpen && timeModalTask ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Cargar tiempo</h3>
              <button type="button" onClick={() => !timeSaving && setIsTimeModalOpen(false)} className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700">Cerrar</button>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Tarea: {formatTaskCardTitle(timeModalTask, clientsById.get(String(timeModalTask.clientId ?? "")))} · Cliente:{" "}
              {String(timeModalTask.clientName ?? "Cliente")}
            </p>
            <div className="grid gap-2 md:grid-cols-2">
              <select className={inputClass} value={timeForm.userId} onChange={(e) => setTimeForm((p) => ({ ...p, userId: e.target.value }))}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName || u.email || u.id}</option>
                ))}
              </select>
              <input className={inputClass} type="date" value={timeForm.date} onChange={(e) => setTimeForm((p) => ({ ...p, date: e.target.value }))} />
              <input className={inputClass} type="month" value={timeForm.assignedMonth} onChange={(e) => setTimeForm((p) => ({ ...p, assignedMonth: e.target.value }))} />
              <input className={inputClass} placeholder="Ej: 1.5 h o 90 min" value={timeForm.minutesInput} onChange={(e) => setTimeForm((p) => ({ ...p, minutesInput: e.target.value }))} />
              <textarea className={`${inputClass} md:col-span-2 min-h-[90px]`} placeholder="Nota opcional" value={timeForm.note} onChange={(e) => setTimeForm((p) => ({ ...p, note: e.target.value }))} />
            </div>
            <button type="button" disabled={timeSaving} onClick={() => void saveTimeEntry()} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60">
              {timeSaving ? "Guardando..." : "Guardar tiempo"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
