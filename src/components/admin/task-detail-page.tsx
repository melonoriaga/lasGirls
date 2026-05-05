"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDownSLine,
  RiBuilding2Line,
  RiCalendarLine,
  RiCalendarTodoLine,
  RiFlagLine,
  RiLink,
  RiMore2Fill,
  RiPencilLine,
  RiPlayLargeFill,
  RiStopFill,
  RiUserFollowLine,
  RiUserLine,
} from "@remixicon/react";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { LinkifiedText } from "@/components/admin/linkified-text";
import {
  TaskRichTextEditor,
  taskDescriptionEditorContentFromTask,
  taskDescriptionFingerprint,
  taskDescriptionSourceKey,
} from "@/components/admin/task-rich-text-editor";
import { useAdminToast } from "@/components/admin/admin-toast-provider";

type TaskRow = Record<string, unknown> & { id: string };
type UserRow = { id: string; fullName?: string; email?: string; photoURL?: string };
type ClientRow = { id: string; fullName?: string; displayName?: string; logoURL?: string };
type ThreadComment = { id: string; content?: string; createdByUserId?: string; createdAt?: string };
type ThreadActivity = {
  id: string;
  action?: string;
  message?: string;
  createdByUserId?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};
type TaskTimeEntry = {
  id: string;
  userId?: string;
  userName?: string;
  date?: string;
  assignedMonth?: string;
  minutes?: number;
  note?: string;
  source?: "timer" | "manual";
  status?: "running" | "completed" | "cancelled";
  startedAt?: string;
  endedAt?: string;
};

async function parseAdminJsonResponse(
  res: Response,
): Promise<Record<string, unknown> & { ok?: boolean; error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: `Sin respuesta del servidor (${res.status}).` };
  try {
    return JSON.parse(trimmed) as Record<string, unknown> & { ok?: boolean; error?: string };
  } catch {
    return {
      ok: false,
      error: trimmed.startsWith("<")
        ? `El servidor respondió con HTML (${res.status}), no JSON.`
        : `Respuesta inválida (${res.status}).`,
    };
  }
}

function networkErrorMessage(cause: unknown): string {
  if (cause instanceof TypeError && cause.message === "Failed to fetch") {
    return "No se pudo conectar con el servidor.";
  }
  return cause instanceof Error ? cause.message : "Error de red.";
}

function adminTaskApi(taskId: string, subresource?: "thread" | "time-entries" | "comments") {
  const id = encodeURIComponent(taskId);
  return subresource ? `/api/admin/tasks/${id}/${subresource}` : `/api/admin/tasks/${id}`;
}

function adminTaskCommentApi(taskId: string, commentId: string) {
  return `/api/admin/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`;
}

function descPayloadFromTask(t: TaskRow) {
  const seed = taskDescriptionEditorContentFromTask(t);
  return {
    json: typeof seed === "object" ? (seed as Record<string, unknown>) : null,
    text: String(t.descriptionText ?? t.description ?? "").trim(),
    html: String(t.descriptionHtml ?? "").trim(),
  };
}

function formatAssignedMonthLabel(monthRaw: string): string {
  const m = String(monthRaw ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(m)) return "—";
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, (mo || 1) - 1, 1);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(d);
}

const compactInput =
  "w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[13px] text-zinc-900 shadow-none focus:border-zinc-300 focus:outline-none focus:ring-0";

export function TaskDetailPage({
  initialTask,
  clients,
  users,
  actorUid,
}: {
  initialTask: TaskRow;
  clients: ClientRow[];
  users: UserRow[];
  actorUid: string;
}) {
  const router = useRouter();
  const toast = useAdminToast();
  const taskId = initialTask.id;

  const [task, setTask] = useState<TaskRow>(initialTask);
  const [titleDraft, setTitleDraft] = useState(String(initialTask.title ?? ""));
  const initialDescPayload = descPayloadFromTask(initialTask);
  const [descDraft, setDescDraft] = useState(initialDescPayload);
  const descDraftRef = useRef(initialDescPayload);
  useEffect(() => {
    descDraftRef.current = descDraft;
  }, [descDraft]);
  const persistedDescSig = useRef(taskDescriptionFingerprint(initialDescPayload.json, initialDescPayload.text));
  const [lowerTab, setLowerTab] = useState<"comments" | "times" | "activity">("comments");
  const [threadComments, setThreadComments] = useState<ThreadComment[]>([]);
  const [threadActivity, setThreadActivity] = useState<ThreadActivity[]>([]);
  const [taskTimeEntries, setTaskTimeEntries] = useState<TaskTimeEntry[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const [commentMenuOpenId, setCommentMenuOpenId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentDraft, setEditCommentDraft] = useState("");
  const [commentMutationId, setCommentMutationId] = useState<string | null>(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [timeSaving, setTimeSaving] = useState(false);
  const [runningTimer, setRunningTimer] = useState<{ id: string; taskId: string; startedAt: string } | null>(null);
  const [nowTick, setNowTick] = useState(0);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [accOpen, setAccOpen] = useState(false);
  const [descEditOpen, setDescEditOpen] = useState(false);
  const headerMenuRef = useRef<HTMLDivElement | null>(null);
  const commentDraftRef = useRef(commentDraft);
  const composerBlurTimerRef = useRef<number | null>(null);

  const [timeForm, setTimeForm] = useState({
    userId: actorUid,
    date: new Date().toISOString().slice(0, 10),
    assignedMonth: new Date().toISOString().slice(0, 7),
    minutesInput: "",
    note: "",
  });

  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const descReadHtml = useMemo(() => String(task.descriptionHtml ?? "").trim(), [task.descriptionHtml]);
  const descReadPlain = useMemo(
    () => String(task.descriptionText ?? task.description ?? "").trim(),
    [task.descriptionText, task.description],
  );

  const refreshTaskRow = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/tasks", { cache: "no-store", credentials: "include" });
      const json = await parseAdminJsonResponse(res);
      const items = json.items as TaskRow[] | undefined;
      if (!res.ok || !json.ok || !items) return;
      const row = items.find((t) => t.id === taskId);
      if (row) setTask(row);
    } catch {
      // noop
    }
  }, [taskId]);

  const loadTaskThread = useCallback(async () => {
    setThreadLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch(adminTaskApi(taskId, "thread"), { cache: "no-store", credentials: "include" });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        setThreadComments([]);
        setThreadActivity([]);
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo cargar la actividad."));
        setThreadComments([]);
        setThreadActivity([]);
        return;
      }
      setThreadComments(Array.isArray(json.comments) ? (json.comments as ThreadComment[]) : []);
      setThreadActivity(Array.isArray(json.activity) ? (json.activity as ThreadActivity[]) : []);
    } finally {
      setThreadLoading(false);
    }
  }, [taskId, toast]);

  const loadTaskTimeEntries = useCallback(async () => {
    let res: Response;
    try {
      res = await fetch(adminTaskApi(taskId, "time-entries"), { cache: "no-store", credentials: "include" });
    } catch (cause) {
      toast.error(networkErrorMessage(cause));
      setTaskTimeEntries([]);
      return;
    }
    const json = await parseAdminJsonResponse(res);
    if (!res.ok || !json.ok) {
      toast.error(String(json.error ?? "No se pudieron cargar los tiempos."));
      setTaskTimeEntries([]);
      return;
    }
    setTaskTimeEntries(Array.isArray(json.entries) ? (json.entries as TaskTimeEntry[]) : []);
  }, [taskId, toast]);

  const loadRunningTimer = useCallback(async () => {
    const res = await fetch("/api/admin/tasks/running-timer", { cache: "no-store", credentials: "include" });
    const json = await parseAdminJsonResponse(res);
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
    void loadTaskThread();
    void loadTaskTimeEntries();
    void loadRunningTimer();
  }, [loadTaskThread, loadTaskTimeEntries, loadRunningTimer]);

  useEffect(() => {
    const poll = window.setInterval(() => void loadRunningTimer(), 15000);
    return () => window.clearInterval(poll);
  }, [loadRunningTimer]);

  useEffect(() => {
    const detailRunningEntry = taskTimeEntries.some(
      (e) => e.source === "timer" && e.status === "running" && String(e.userId ?? "") === actorUid,
    );
    const needsTick = Boolean(runningTimer) || detailRunningEntry;
    if (!needsTick) return;
    setNowTick(Date.now());
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [runningTimer, taskTimeEntries, actorUid]);

  useEffect(() => {
    setDescEditOpen(false);
  }, [taskId]);

  useEffect(() => {
    setTitleDraft(String(task.title ?? ""));
  }, [task.title]);

  useEffect(() => {
    if (!headerMenuOpen) return;
    const close = (ev: MouseEvent) => {
      const t = ev.target;
      if (t instanceof Node && headerMenuRef.current?.contains(t)) return;
      setHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [headerMenuOpen]);

  useEffect(() => {
    commentDraftRef.current = commentDraft;
  }, [commentDraft]);

  useEffect(() => {
    if (!commentMenuOpenId) return;
    const close = (ev: MouseEvent) => {
      const t = ev.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.closest("[data-task-comment-menu-root]")) return;
      setCommentMenuOpenId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [commentMenuOpenId]);

  useEffect(() => {
    return () => {
      if (composerBlurTimerRef.current !== null) window.clearTimeout(composerBlurTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (lowerTab === "comments") return;
    setComposerExpanded(false);
    setCommentMenuOpenId(null);
    setEditingCommentId(null);
    setEditCommentDraft("");
  }, [lowerTab]);

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

  /** Pastilla del `<select>` de estado: mismos tonos que antes en el badge. */
  const statusSelectInteractClass = (value: string) =>
    value === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/95 focus-visible:ring-emerald-300"
      : value === "blocked"
        ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100/95 focus-visible:ring-red-300"
        : value === "in_progress"
          ? "border-violet-300 bg-violet-50 text-violet-950 hover:bg-violet-100/95 focus-visible:ring-violet-300"
          : value === "cancelled"
            ? "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200/60 focus-visible:ring-zinc-300"
            : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100/95 focus-visible:ring-zinc-300";

  const statusSelectChevronClass = (value: string) =>
    value === "done"
      ? "text-emerald-700"
      : value === "blocked"
        ? "text-red-700"
        : value === "in_progress"
          ? "text-violet-700"
          : value === "cancelled"
            ? "text-zinc-600"
            : "text-zinc-600";

  const priorityLabel = (value: string) =>
    value === "high" ? "Alta" : value === "medium" ? "Media" : value === "low" ? "Baja" : value;

  const priorityBadgeClass = (value: string) =>
    value === "high"
      ? "border-red-200 bg-red-50 text-red-800"
      : value === "low"
        ? "border-zinc-300 bg-zinc-100 text-zinc-700"
        : "border-amber-200 bg-amber-50 text-amber-800";

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

  const formatDueCompact = (due: string) => {
    if (!due || due.length < 10) return "—";
    const d = new Date(`${due.slice(0, 10)}T12:00:00`);
    if (Number.isNaN(d.getTime())) return due.slice(0, 10);
    return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
  };

  const formatTimeShort = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfDay = new Date(d);
    startOfDay.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((startOfToday.getTime() - startOfDay.getTime()) / 86400000);
    const timeStr = d.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit", hour12: true });
    if (dayDiff === 0) return `Hoy, ${timeStr}`;
    if (dayDiff === 1) return `Ayer, ${timeStr}`;
    return `${d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })} · ${timeStr}`;
  };

  const patchTask = async (patch: Record<string, unknown>, fieldKey: string) => {
    setSavingField(fieldKey);
    try {
      const res = await fetch(adminTaskApi(taskId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar."));
        return false;
      }
      await refreshTaskRow();
      await loadTaskThread();
      return true;
    } finally {
      setSavingField(null);
    }
  };

  const flushDescription = useCallback(async () => {
    const snap = descDraftRef.current;
    if (taskDescriptionFingerprint(snap.json, snap.text) === persistedDescSig.current) return;
    setSavingField("description");
    try {
      const body: Record<string, unknown> = {
        description: snap.text.trim(),
        descriptionText: snap.text.trim(),
        descriptionHtml: snap.html.trim(),
      };
      if (snap.json && typeof snap.json === "object") {
        body.descriptionJson = snap.json;
      }
      const res = await fetch(adminTaskApi(taskId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar la descripción."));
        return;
      }
      persistedDescSig.current = taskDescriptionFingerprint(snap.json, snap.text);
      await refreshTaskRow();
      await loadTaskThread();
      setDescEditOpen(false);
    } finally {
      setSavingField(null);
    }
  }, [taskId, toast, refreshTaskRow, loadTaskThread]);

  const enterDescEdit = useCallback(() => {
    const p = descPayloadFromTask(task);
    setDescDraft(p);
    persistedDescSig.current = taskDescriptionFingerprint(p.json, p.text);
    setDescEditOpen(true);
  }, [task]);

  const exitDescEditDiscard = useCallback(() => {
    const p = descPayloadFromTask(task);
    setDescDraft(p);
    persistedDescSig.current = taskDescriptionFingerprint(p.json, p.text);
    setDescEditOpen(false);
  }, [task]);

  const submitComment = async () => {
    if (!commentDraft.trim() || commentSaving) return;
    setCommentSaving(true);
    try {
      let res: Response;
      try {
        res = await fetch(adminTaskApi(taskId, "comments"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: commentDraft.trim() }),
        });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar el comentario."));
        return;
      }
      setCommentDraft("");
      setComposerExpanded(false);
      if (composerBlurTimerRef.current !== null) {
        window.clearTimeout(composerBlurTimerRef.current);
        composerBlurTimerRef.current = null;
      }
      await loadTaskThread();
      await refreshTaskRow();
    } finally {
      setCommentSaving(false);
    }
  };

  const saveCommentEdit = async (commentId: string) => {
    const trimmed = editCommentDraft.trim();
    if (!trimmed || commentMutationId) return;
    setCommentMutationId(commentId);
    try {
      let res: Response;
      try {
        res = await fetch(adminTaskCommentApi(taskId, commentId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: trimmed }),
        });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar."));
        return;
      }
      setEditingCommentId(null);
      setEditCommentDraft("");
      setCommentMenuOpenId(null);
      await loadTaskThread();
      await refreshTaskRow();
    } finally {
      setCommentMutationId(null);
    }
  };

  const deleteCommentById = async (commentId: string) => {
    setCommentMenuOpenId(null);
    if (!window.confirm("¿Eliminar este comentario?")) return;
    setCommentMutationId(commentId);
    try {
      let res: Response;
      try {
        res = await fetch(adminTaskCommentApi(taskId, commentId), { method: "DELETE", credentials: "include" });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo eliminar."));
        return;
      }
      toast.success("Comentario eliminado.");
      setCommentMenuOpenId(null);
      setEditingCommentId(null);
      await loadTaskThread();
      await refreshTaskRow();
    } finally {
      setCommentMutationId(null);
    }
  };

  const cancelCommentComposer = () => {
    setCommentDraft("");
    setComposerExpanded(false);
    if (composerBlurTimerRef.current !== null) {
      window.clearTimeout(composerBlurTimerRef.current);
      composerBlurTimerRef.current = null;
    }
  };

  const scheduleComposerCollapse = () => {
    if (composerBlurTimerRef.current !== null) window.clearTimeout(composerBlurTimerRef.current);
    composerBlurTimerRef.current = window.setTimeout(() => {
      if (!commentDraftRef.current.trim()) setComposerExpanded(false);
      composerBlurTimerRef.current = null;
    }, 200);
  };

  const cancelComposerBlurSchedule = () => {
    if (composerBlurTimerRef.current !== null) {
      window.clearTimeout(composerBlurTimerRef.current);
      composerBlurTimerRef.current = null;
    }
  };

  const deleteTask = async () => {
    if (!window.confirm("¿Eliminar esta tarea?")) return;
    const res = await fetch(adminTaskApi(taskId), { method: "DELETE", credentials: "include" });
    const json = await parseAdminJsonResponse(res);
    if (!res.ok || !json.ok) {
      toast.error(String(json.error ?? "No se pudo eliminar."));
      return;
    }
    toast.success("Tarea eliminada.");
    router.push("/admin/tasks");
  };

  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link.");
    }
  };

  const detailRunningEntry =
    taskTimeEntries.find(
      (item) =>
        item.source === "timer" &&
        item.status === "running" &&
        String(item.userId ?? "") === String(actorUid ?? ""),
    ) ?? null;

  const timerActiveHere =
    Boolean((runningTimer?.taskId === taskId && runningTimer.startedAt) || detailRunningEntry);

  const timerRunningElsewhere = Boolean(runningTimer && runningTimer.taskId !== taskId);

  const runningElapsedSeconds = (() => {
    if (runningTimer?.taskId === taskId && runningTimer.startedAt) {
      return Math.max(0, Math.floor((nowTick - new Date(runningTimer.startedAt).getTime()) / 1000));
    }
    if (detailRunningEntry?.startedAt) {
      return Math.max(0, Math.floor((nowTick - new Date(detailRunningEntry.startedAt).getTime()) / 1000));
    }
    return 0;
  })();

  const activeTimerEntryId =
    detailRunningEntry?.id ??
    (runningTimer?.taskId === taskId ? runningTimer.id : undefined);

  const startTimer = async () => {
    if (timeSaving || timerRunningElsewhere) return;
    setTimeSaving(true);
    try {
      const month = String(task.assignedMonth ?? "").trim() || new Date().toISOString().slice(0, 7);
      let res: Response;
      try {
        res = await fetch(adminTaskApi(taskId, "time-entries"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: actorUid,
            date: new Date().toISOString().slice(0, 10),
            assignedMonth: /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7),
            source: "timer",
            action: "start",
          }),
        });
      } catch (cause) {
        toast.error(networkErrorMessage(cause));
        return;
      }
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo iniciar."));
        return;
      }
      toast.success("Timer iniciado.");
      await loadTaskTimeEntries();
      await loadRunningTimer();
      await refreshTaskRow();
    } finally {
      setTimeSaving(false);
    }
  };

  const stopTimer = async () => {
    const entryId = activeTimerEntryId;
    if (!entryId) return;
    setTimeSaving(true);
    try {
      const res = await fetch(`/api/admin/time-entries/${encodeURIComponent(entryId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "stop" }),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo detener."));
        return;
      }
      toast.success("Sesión finalizada.");
      await loadTaskTimeEntries();
      await loadRunningTimer();
      await refreshTaskRow();
      await loadTaskThread();
    } finally {
      setTimeSaving(false);
    }
  };

  const openTimeModal = () => {
    const month = String(task.assignedMonth ?? "").trim() || new Date().toISOString().slice(0, 7);
    setTimeForm({
      userId: actorUid,
      date: new Date().toISOString().slice(0, 10),
      assignedMonth: /^\d{4}-\d{2}$/.test(month) ? month : new Date().toISOString().slice(0, 7),
      minutesInput: "",
      note: "",
    });
    setIsTimeModalOpen(true);
  };

  const saveTimeEntry = async () => {
    if (!timeForm.minutesInput.trim()) {
      toast.error("Ingresá una duración.");
      return;
    }
    setTimeSaving(true);
    try {
      const res = await fetch(adminTaskApi(taskId, "time-entries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(timeForm),
      });
      const json = await parseAdminJsonResponse(res);
      if (!res.ok || !json.ok) {
        toast.error(String(json.error ?? "No se pudo guardar."));
        return;
      }
      toast.success("Tiempo cargado.");
      setIsTimeModalOpen(false);
      await loadTaskTimeEntries();
      await refreshTaskRow();
      await loadTaskThread();
    } finally {
      setTimeSaving(false);
    }
  };

  const st = String(task.status ?? "pending");
  const pr = String(task.priority ?? "medium");
  const assignee = personMeta(String(task.assignedTo ?? ""));
  const informer = personMeta(String(task.createdBy ?? ""));
  const client = clientsById.get(String(task.clientId ?? ""));
  const actorPerson = personMeta(actorUid);

  const timelineItems = useMemo(() => {
    type Row =
      | { kind: "comment"; at: number; id: string; comment: ThreadComment }
      | { kind: "activity"; at: number; id: string; activity: ThreadActivity }
      | { kind: "time"; at: number; id: string; label: string };

    const rows: Row[] = [];

    const parseAt = (iso?: string) => {
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    for (const c of threadComments) {
      rows.push({ kind: "comment", id: c.id, at: parseAt(c.createdAt), comment: c });
    }
    for (const a of threadActivity) {
      rows.push({ kind: "activity", id: a.id, at: parseAt(a.createdAt), activity: a });
    }
    for (const e of taskTimeEntries) {
      const who = e.userName || personMeta(String(e.userId ?? "")).label;
      const mins = formatMinutes(Number(e.minutes ?? 0));
      const src = e.source === "timer" ? "automático" : "manual";
      if (e.startedAt) {
        rows.push({
          kind: "time",
          id: `${e.id}-s`,
          at: parseAt(e.startedAt),
          label: `Timer iniciado · ${who}`,
        });
      }
      if (e.status !== "running" && (e.endedAt || e.minutes)) {
        rows.push({
          kind: "time",
          id: `${e.id}-e`,
          at: parseAt(e.endedAt) || parseAt(e.date) || parseAt(e.startedAt),
          label: `Tiempo registrado ${mins} (${src}) · ${who}`,
        });
      }
    }

    rows.sort((a, b) => b.at - a.at);
    return rows;
  }, [threadComments, threadActivity, taskTimeEntries, usersById]);

  const tabBtn = (id: typeof lowerTab, label: string) => (
    <button
      type="button"
      onClick={() => setLowerTab(id)}
      className={`relative shrink-0 pb-2.5 text-[13px] font-medium transition ${lowerTab === id
        ? "text-zinc-900 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#FF85A2]"
        : "text-zinc-500 hover:text-zinc-800"
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <div className="text-zinc-900">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 pb-3">
          <nav className="max-w-[min(100%,42rem)] text-[13px] leading-snug text-zinc-500">
            <Link href="/admin/tasks" className="text-zinc-500 transition hover:text-zinc-900">
              Tareas
            </Link>
            <span className="mx-2 font-light text-zinc-300">/</span>
            <span className="font-medium text-zinc-800">{String(task.title ?? "Tarea")}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void shareLink()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-none transition hover:bg-zinc-50"
            >
              <RiLink className="size-3.5 text-zinc-500" aria-hidden />
              Compartir link
            </button>
            <div className="relative" ref={headerMenuRef}>
              <button
                type="button"
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="flex size-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-none transition hover:bg-zinc-50"
                aria-label="Más acciones"
              >
                <RiMore2Fill className="size-4" />
              </button>
              {headerMenuOpen ? (
                <div className="absolute right-0 z-40 mt-1 w-40 rounded-lg border border-zinc-200 bg-white py-1 shadow-md">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setHeaderMenuOpen(false);
                      void deleteTask();
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setAccOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-800 shadow-none transition hover:bg-zinc-50"
            >
              <RiPencilLine className="size-3.5 text-zinc-500" aria-hidden />
              Editar tarea
            </button>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <input
            value={titleDraft}
            disabled={!!savingField}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={async () => {
              const next = titleDraft.trim();
              const prev = String(task.title ?? "").trim();
              if (!next || next === prev) {
                setTitleDraft(prev);
                return;
              }
              const ok = await patchTask({ title: next }, "title");
              if (!ok) setTitleDraft(prev);
            }}
            className="min-w-0 flex-1 basis-[min(100%,12rem)] border-0 bg-transparent p-0 text-[1.375rem] font-bold leading-[1.25] tracking-tight text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 disabled:opacity-60 md:basis-auto md:text-[1.625rem]"
            placeholder="Título"
          />
          <div className="relative shrink-0">
            <select
              aria-label="Estado de la tarea"
              value={st}
              disabled={!!savingField}
              onChange={(e) => void patchTask({ status: e.target.value }, "status")}
              className={`h-8 min-w-[9.75rem] max-w-[14rem] cursor-pointer appearance-none rounded-full border py-0
                pl-3.5 pr-9 text-[13px] font-semibold shadow-none outline-none ring-offset-2 transition
                focus-visible:ring-2 disabled:opacity-55 ${statusSelectInteractClass(st)}`}
            >
              <option value="pending">Pendiente</option>
              <option value="in_progress">En proceso</option>
              <option value="blocked">Bloqueada</option>
              <option value="done">Terminada</option>
              <option value="cancelled">Cancelada</option>
            </select>

            <RiArrowDownSLine
              className={`pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 opacity-90 ${statusSelectChevronClass(st)}`}
              aria-hidden
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_228px] lg:items-start lg:gap-10">
          <div className="min-w-0 space-y-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-3 text-[13px] leading-snug sm:grid-cols-2">
              <div className="grid gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <RiUserLine className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="shrink-0 text-zinc-500">Responsable</span>
                  <span className="flex min-w-0 items-center gap-2 font-medium text-zinc-900">
                    {assignee.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assignee.photoURL} alt="" className="size-6 shrink-0 rounded-full border border-zinc-100 object-cover" />
                    ) : (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
                        {assignee.initials || "?"}
                      </span>
                    )}
                    <span className="truncate">{assignee.label}</span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <RiUserFollowLine className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="shrink-0 text-zinc-500">Informador</span>
                  <span className="flex min-w-0 items-center gap-2 font-medium text-zinc-900">
                    {informer.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={informer.photoURL} alt="" className="size-6 shrink-0 rounded-full border border-zinc-100 object-cover" />
                    ) : (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-600">
                        {informer.initials || "?"}
                      </span>
                    )}
                    <span className="truncate">{String(task.createdBy ?? "").trim() ? informer.label : "—"}</span>
                  </span>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <RiBuilding2Line className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="shrink-0 text-zinc-500">Cliente</span>
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-zinc-900">
                    {client?.logoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={client.logoURL} alt="" className="size-5 shrink-0 rounded-full border border-zinc-100 object-cover" />
                    ) : null}
                    <span className="truncate">{client?.fullName || client?.displayName || String(task.clientName ?? "—")}</span>
                  </span>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <RiCalendarLine className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="text-zinc-500">Fecha de entrega</span>
                  <span className="font-medium text-zinc-900">{formatDueCompact(String(task.dueDate ?? ""))}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <RiFlagLine className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="text-zinc-500">Prioridad</span>
                  <span className="flex items-center gap-1.5 font-medium text-zinc-900">
                    <span className="inline-block size-1.5 shrink-0 rounded-full bg-[#FF85A2]" aria-hidden />
                    {priorityLabel(pr)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <RiCalendarTodoLine className="size-[15px] shrink-0 text-zinc-400" aria-hidden />
                  <span className="shrink-0 text-zinc-500">Mes de sprint</span>
                  <span className="min-w-0 font-medium capitalize text-zinc-900">
                    {formatAssignedMonthLabel(String(task.assignedMonth ?? ""))}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-2 border-t border-b border-zinc-200 pb-6 ">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Descripción</p>
              {!descEditOpen ? (
                <>
                  {descReadHtml ? (
                    <div
                      className="task-description-readonly px-0 py-2"
                      // Solo HTML generado por el editor admin (TipTap).
                      dangerouslySetInnerHTML={{ __html: descReadHtml }}
                    />
                  ) : descReadPlain ? (
                    <div className="whitespace-pre-wrap px-0 py-2 text-[13px] leading-relaxed text-zinc-800">
                      <LinkifiedText text={descReadPlain} />
                    </div>
                  ) : (
                    <p className="py-2 text-[13px] text-zinc-400">Sin descripción.</p>
                  )}
                  <div className="flex justify-end">

                    <button
                      type="button"
                      onClick={() => enterDescEdit()}
                      className="text-[12px] font-medium text-rose-600 underline decoration-rose-600/35 underline-offset-2 transition hover:text-rose-700"
                    >
                      Editar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <TaskRichTextEditor
                    key={`${task.id}-desc`}
                    variant="detail"
                    syncContentKey={taskDescriptionSourceKey(task)}
                    valueJson={taskDescriptionEditorContentFromTask(task)}
                    onBlurCommit={() => void flushDescription()}
                    onChange={(payload) =>
                      setDescDraft({
                        json: payload.json,
                        text: payload.text,
                        html: payload.html,
                      })
                    }
                    disabled={!!savingField && savingField === "description"}
                  />
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    {savingField === "description" ? (
                      <span className="text-[11px] text-zinc-400">Guardando…</span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => exitDescEditDiscard()}
                      disabled={!!savingField && savingField === "description"}
                      className="text-[12px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-800 disabled:opacity-50"
                    >
                      Ocultar
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/40 shadow-none">
              <button
                type="button"
                onClick={() => setAccOpen((v) => !v)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-50/80"
              >
                <span>Editar tarea</span>
                <RiArrowDownSLine className={`size-4 shrink-0 text-zinc-500 transition ${accOpen ? "rotate-180" : ""}`} aria-hidden />
              </button>
              {accOpen ? (
                <div className="grid gap-2.5 border-t border-zinc-200 bg-white p-3 sm:grid-cols-2">
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Responsable
                    <select
                      className={compactInput}
                      value={String(task.assignedTo ?? "")}
                      disabled={!!savingField}
                      onChange={(e) => void patchTask({ assignedTo: e.target.value }, "assignedTo")}
                    >
                      <option value="">Sin asignar</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName || u.email || u.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Cliente
                    <select
                      className={compactInput}
                      value={String(task.clientId ?? "")}
                      disabled={!!savingField}
                      onChange={(e) => {
                        const next = e.target.value;
                        const cl = clientsById.get(next);
                        void patchTask(
                          { clientId: next, clientName: cl?.fullName || cl?.displayName || "" },
                          "clientId",
                        );
                      }}
                    >
                      <option value="">—</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName || c.displayName || c.id}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Vence
                    <input
                      className={compactInput}
                      type="date"
                      value={String(task.dueDate ?? "").slice(0, 10)}
                      disabled={!!savingField}
                      onChange={(e) => void patchTask({ dueDate: e.target.value }, "dueDate")}
                    />
                  </label>
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Mes de sprint
                    <input
                      className={compactInput}
                      type="month"
                      value={String(task.assignedMonth ?? "").slice(0, 7)}
                      disabled={!!savingField}
                      onChange={(e) => void patchTask({ assignedMonth: e.target.value }, "assignedMonth")}
                    />
                  </label>
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Prioridad
                    <select
                      className={compactInput}
                      value={pr}
                      disabled={!!savingField}
                      onChange={(e) => void patchTask({ priority: e.target.value }, "priority")}
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </label>
                  <label className="grid gap-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Estado
                    <select
                      className={compactInput}
                      value={st}
                      disabled={!!savingField}
                      onChange={(e) => void patchTask({ status: e.target.value }, "status")}
                    >
                      <option value="pending">Pendiente</option>
                      <option value="in_progress">En proceso</option>
                      <option value="blocked">Bloqueada</option>
                      <option value="done">Terminada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>

            <section className="border-t border-zinc-200 pt-4">
              <div className="flex gap-8 overflow-x-auto border-b border-zinc-200">
                {tabBtn("comments", "Comentarios")}
                {tabBtn("times", "Tiempos")}
                {tabBtn("activity", "Toda la actividad")}
              </div>

              <div className="relative mt-3 flex min-h-[180px] flex-col">
                {lowerTab === "comments" ? (
                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
                    <div className="max-h-[min(420px,50vh)] overflow-y-auto">
                      {threadLoading ? <p className="py-3 text-[13px] text-zinc-500">Cargando…</p> : null}
                      {!threadLoading && threadComments.length === 0 ? (
                        <div className="py-6 text-center">
                          <p className="text-[13px] font-medium text-zinc-700">Todavía no hay comentarios.</p>
                          <p className="mt-1 text-[12px] text-zinc-500">
                            Agregá el primero para dejar contexto sobre esta tarea.
                          </p>
                        </div>
                      ) : null}
                      <ul className="list-none space-y-0 p-0">
                        {threadComments.map((item, index) => {
                          const author = personMeta(String(item.createdByUserId ?? ""));
                          const isMine = String(item.createdByUserId ?? "") === String(actorUid ?? "");
                          const isEditing = editingCommentId === item.id;
                          const isBusy = commentMutationId === item.id;
                          const isLast = index === threadComments.length - 1;

                          return (
                            <li
                              key={item.id}
                              className={`py-3 ${!isLast ? "border-b border-zinc-100" : ""}`}
                            >
                              <div className="flex gap-3">
                                {author.photoURL ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={author.photoURL}
                                    alt=""
                                    className="size-9 shrink-0 rounded-full border border-zinc-100 object-cover"
                                  />
                                ) : (
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                                    {author.initials || "?"}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="min-w-0 text-[13px] leading-snug text-zinc-800">
                                      <span className="font-semibold">{author.label}</span>
                                      <span className="font-normal text-zinc-400">
                                        {" "}
                                        · {formatTimeShort(item.createdAt)}
                                      </span>
                                    </p>
                                    {isMine && !isEditing ? (
                                      <div className="relative shrink-0" data-task-comment-menu-root>
                                        <button
                                          type="button"
                                          aria-expanded={commentMenuOpenId === item.id}
                                          aria-haspopup="menu"
                                          aria-label="Opciones del comentario"
                                          disabled={isBusy}
                                          onClick={() =>
                                            setCommentMenuOpenId((id) => (id === item.id ? null : item.id))
                                          }
                                          className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50"
                                        >
                                          <RiMore2Fill className="size-4" aria-hidden />
                                        </button>
                                        {commentMenuOpenId === item.id ? (
                                          <div
                                            role="menu"
                                            className="absolute right-0 top-full z-20 mt-1 min-w-[132px] overflow-hidden rounded-[10px] border border-zinc-200 bg-white py-1 shadow-md"
                                          >
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="flex w-full px-3 py-1.5 text-left text-[12px] text-zinc-700 hover:bg-zinc-50"
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => {
                                                setCommentMenuOpenId(null);
                                                setEditingCommentId(item.id);
                                                setEditCommentDraft(String(item.content ?? ""));
                                              }}
                                            >
                                              Editar
                                            </button>
                                            <button
                                              type="button"
                                              role="menuitem"
                                              className="flex w-full px-3 py-1.5 text-left text-[12px] font-medium text-red-600 hover:bg-red-50"
                                              onMouseDown={(e) => e.preventDefault()}
                                              onClick={() => void deleteCommentById(item.id)}
                                            >
                                              Eliminar
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>

                                  {isEditing ? (
                                    <div className="mt-2 space-y-2">
                                      <textarea
                                        value={editCommentDraft}
                                        onChange={(e) => setEditCommentDraft(e.target.value)}
                                        disabled={isBusy}
                                        rows={3}
                                        className="w-full resize-y rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-snug text-zinc-800 shadow-none placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-0 disabled:opacity-60"
                                      />
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          disabled={isBusy || !editCommentDraft.trim()}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => void saveCommentEdit(item.id)}
                                          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                                        >
                                          {isBusy ? "…" : "Guardar"}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isBusy}
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditCommentDraft("");
                                          }}
                                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[13px] leading-snug text-zinc-700">
                                      <LinkifiedText
                                        text={String(item.content ?? "")}
                                        className="whitespace-pre-wrap break-words"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="mt-4 border-t border-zinc-100 pt-4">
                      <div className="flex gap-3">
                        {actorPerson.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={actorPerson.photoURL}
                            alt=""
                            className="size-9 shrink-0 rounded-full border border-zinc-100 object-cover"
                          />
                        ) : (
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                            {actorPerson.initials || "?"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-2">
                          <textarea
                            value={commentDraft}
                            onChange={(e) => {
                              setCommentDraft(e.target.value);
                              if (e.target.value.trim()) setComposerExpanded(true);
                            }}
                            onFocus={() => {
                              cancelComposerBlurSchedule();
                              setComposerExpanded(true);
                            }}
                            onBlur={() => scheduleComposerCollapse()}
                            disabled={commentSaving}
                            rows={composerExpanded ? 3 : 1}
                            placeholder="Escribir un comentario…"
                            className={`w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-800 shadow-none placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-0 disabled:opacity-60 ${composerExpanded ? "min-h-[4.5rem] resize-y" : "min-h-[2.5rem] resize-none overflow-hidden"
                              }`}
                          />
                          {composerExpanded ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              <button
                                type="button"
                                disabled={commentSaving}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => cancelCommentComposer()}
                                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                disabled={commentSaving || !commentDraft.trim()}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => void submitComment()}
                                className="rounded-lg bg-[#FF85A2] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#ff6f94] disabled:opacity-50"
                              >
                                {commentSaving ? "…" : "Comentar"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {lowerTab === "times" ? (
                  <div className="max-h-[min(380px,48vh)] space-y-2 overflow-y-auto py-1">
                    {taskTimeEntries.length === 0 ? <p className="text-[13px] text-zinc-500">Sin registros.</p> : null}
                    {taskTimeEntries.map((entry) => {
                      const who = entry.userName || personMeta(String(entry.userId ?? "")).label;
                      const dateLabel = String(entry.date ?? "").slice(0, 10).replace(/^\d{4}-(\d{2})-(\d{2})$/, "$2/$1");
                      const tipo = entry.source === "timer" ? "automático" : "manual";
                      const dur =
                        entry.status === "running" && entry.startedAt
                          ? formatRunningClock(Math.max(0, Math.floor((nowTick - new Date(entry.startedAt).getTime()) / 1000)))
                          : formatMinutes(Number(entry.minutes ?? 0));
                      return (
                        <p key={entry.id} className="text-[13px] leading-snug text-zinc-700">
                          <span className="font-semibold tabular-nums text-zinc-900">{dateLabel}</span>
                          {" · "}
                          {dur}
                          {" · "}
                          {tipo}
                          {" · "}
                          {who}
                        </p>
                      );
                    })}
                  </div>
                ) : null}

                {lowerTab === "activity" ? (
                  <div className="max-h-[min(380px,48vh)] space-y-3 overflow-y-auto py-1">
                    {timelineItems.length === 0 ? <p className="text-[13px] text-zinc-500">Sin actividad.</p> : null}
                    {timelineItems.map((row) =>
                      row.kind === "comment" ? (
                        <div key={row.id} className="border-b border-zinc-100 pb-3 text-[13px] last:border-0">
                          <p className="font-semibold text-zinc-800">
                            Comentario · {personMeta(String(row.comment.createdByUserId ?? "")).label}{" "}
                            <span className="font-normal text-zinc-400">{formatTimeShort(row.comment.createdAt)}</span>
                          </p>
                          <div className="mt-1 text-zinc-700">
                            <LinkifiedText text={String(row.comment.content ?? "")} className="whitespace-pre-wrap" />
                          </div>
                        </div>
                      ) : row.kind === "activity" ? (
                        <div key={row.id} className="border-b border-zinc-100 pb-3 text-[13px] last:border-0">
                          <AdminActionBadge action={String(row.activity.action ?? "")} />
                          <p className="mt-1 text-zinc-500">
                            {formatTimeShort(row.activity.createdAt)} ·{" "}
                            {personMeta(String(row.activity.createdByUserId ?? "")).label}
                          </p>
                          {row.activity.message ? (
                            <p className="mt-1 text-zinc-700">{String(row.activity.message)}</p>
                          ) : null}
                        </div>
                      ) : (
                        <div key={row.id} className="border-b border-zinc-100 pb-3 text-[13px] text-zinc-700 last:border-0">
                          <span className="text-zinc-400">{formatTimeShort(new Date(row.at).toISOString())}</span>
                          {" · "}
                          {row.label}
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-none lg:sticky lg:top-4 lg:self-start">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Tiempo</p>
            <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">
              {formatMinutes(Number(task.timeTotalMinutes ?? 0))}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Tiempo total</p>

            {timerActiveHere ? (
              <div className="mt-4 space-y-3 border-t border-zinc-100 pt-3">
                <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
                  En curso {formatRunningClock(runningElapsedSeconds)}
                </p>
                <button
                  type="button"
                  disabled={timeSaving}
                  onClick={() => void stopTimer()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-rose-400 bg-white py-2 text-[12px] font-semibold text-rose-600 shadow-none transition hover:bg-rose-50 disabled:opacity-50"
                >
                  <RiStopFill className="size-4" aria-hidden />
                  Detener
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={timeSaving || timerRunningElsewhere}
                title={timerRunningElsewhere ? "Ya hay tiempo corriendo en otra tarea." : undefined}
                onClick={() => void startTimer()}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-400 bg-white py-2 text-[12px] font-semibold text-emerald-800 shadow-none transition hover:bg-emerald-50 disabled:opacity-50"
              >
                <RiPlayLargeFill className="size-4" aria-hidden />
                Iniciar
              </button>
            )}

            <button
              type="button"
              disabled={timeSaving}
              onClick={() => openTimeModal()}
              className="mt-2 flex w-full items-center justify-center rounded-lg border border-sky-400 bg-white py-2 text-[12px] font-semibold text-sky-900 shadow-none transition hover:bg-sky-50 disabled:opacity-50"
            >
              + Cargar tiempo manual
            </button>
          </aside>
        </div>
      </div>

      {isTimeModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Cargar tiempo</h3>
              <button
                type="button"
                onClick={() => !timeSaving && setIsTimeModalOpen(false)}
                className="rounded-md border border-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <select className={compactInput} value={timeForm.userId} onChange={(e) => setTimeForm((p) => ({ ...p, userId: e.target.value }))}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email || u.id}
                  </option>
                ))}
              </select>
              <input className={compactInput} type="date" value={timeForm.date} onChange={(e) => setTimeForm((p) => ({ ...p, date: e.target.value }))} />
              <input className={compactInput} type="month" value={timeForm.assignedMonth} onChange={(e) => setTimeForm((p) => ({ ...p, assignedMonth: e.target.value }))} />
              <input
                className={compactInput}
                placeholder="Ej: 1.5 h o 90 min"
                value={timeForm.minutesInput}
                onChange={(e) => setTimeForm((p) => ({ ...p, minutesInput: e.target.value }))}
              />
              <textarea
                className={`${compactInput} sm:col-span-2 min-h-[72px]`}
                placeholder="Nota opcional"
                value={timeForm.note}
                onChange={(e) => setTimeForm((p) => ({ ...p, note: e.target.value }))}
              />
            </div>
            <button
              type="button"
              disabled={timeSaving}
              onClick={() => void saveTimeEntry()}
              className="mt-2 rounded-lg bg-[#FF85A2] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {timeSaving ? "Guardando…" : "Guardar tiempo"}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
