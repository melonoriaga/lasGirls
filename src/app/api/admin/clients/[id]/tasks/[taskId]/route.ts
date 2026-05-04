import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ id: string; taskId: string }> };

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id, taskId } = await context.params;
  const clientRef = adminDb.collection("clients").doc(id);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const taskSnap = await clientRef.collection("tasks").doc(taskId).get();
  const task = (taskSnap.data() ?? {}) as Record<string, unknown>;
  const previousStatus = String(taskSnap.data()?.status ?? "");
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (typeof body.assignedTo === "string") updates.assignedTo = body.assignedTo.trim();
  if (typeof body.dueDate === "string") updates.dueDate = body.dueDate.trim();
  if (typeof body.assignedMonth === "string") updates.assignedMonth = body.assignedMonth.trim();
  if (typeof body.priority === "string") updates.priority = body.priority.trim();
  if (typeof body.status === "string") updates.status = body.status.trim();
  if (Array.isArray(body.tags)) updates.tags = body.tags.filter((item) => typeof item === "string");
  const changes = Object.entries(updates)
    .filter(([key]) => key !== "updatedAt" && key !== "completedAt" && key !== "completedBy")
    .map(([key, nextValue]) => {
      const previousValue = task[key];
      const prev = Array.isArray(previousValue) ? previousValue.join(", ") : String(previousValue ?? "");
      const next = Array.isArray(nextValue) ? (nextValue as unknown[]).join(", ") : String(nextValue ?? "");
      return prev === next ? null : { field: key, from: prev, to: next };
    })
    .filter(Boolean);

  const nextStatus = String(updates.status ?? previousStatus);
  if (nextStatus === "done" && previousStatus !== "done") {
    updates.completedAt = now;
    updates.completedBy = actor.uid;
  } else if (previousStatus === "done" && nextStatus !== "done") {
    updates.completedAt = "";
    updates.completedBy = "";
  }

  await Promise.all([
    clientRef.collection("tasks").doc(taskId).set(updates, { merge: true }),
    adminDb.collection("tasks").doc(taskId).set(updates, { merge: true }),
  ]);

  await logClientActivity({
    clientId: id,
    action: nextStatus === "done" && previousStatus !== "done" ? "task_completed" : "task_updated",
    createdByUserId: actor.uid,
    message: String(updates.title ?? taskSnap.data()?.title ?? "Tarea"),
    metadata: { taskId, previousStatus, nextStatus, changes },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id, taskId } = await context.params;
  const clientRef = adminDb.collection("clients").doc(id);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  await Promise.all([clientRef.collection("tasks").doc(taskId).delete(), adminDb.collection("tasks").doc(taskId).delete()]);
  await logClientActivity({
    clientId: id,
    action: "task_deleted",
    createdByUserId: actor.uid,
    message: "Tarea eliminada",
    metadata: { taskId },
  });
  return NextResponse.json({ ok: true });
}
