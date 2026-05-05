import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ taskId: string }> };

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { taskId } = await context.params;
  const taskRef = adminDb.collection("tasks").doc(taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) return NextResponse.json({ ok: false, error: "Tarea inexistente." }, { status: 404 });
  if (!canAccessRecord(taskSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para esta tarea." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string") updates.description = body.description.trim();
  if (body.descriptionJson && typeof body.descriptionJson === "object") updates.descriptionJson = body.descriptionJson;
  if (typeof body.descriptionText === "string") updates.descriptionText = body.descriptionText.trim();
  if (typeof body.descriptionHtml === "string") updates.descriptionHtml = body.descriptionHtml.trim();
  if (typeof body.assignedTo === "string") updates.assignedTo = body.assignedTo.trim();
  if (typeof body.dueDate === "string") updates.dueDate = body.dueDate.trim();
  if (typeof body.assignedMonth === "string") updates.assignedMonth = body.assignedMonth.trim();
  if (typeof body.priority === "string") updates.priority = body.priority.trim();
  if (typeof body.status === "string") updates.status = body.status.trim();
  if (typeof body.resolutionOrder === "number" && Number.isFinite(body.resolutionOrder)) {
    updates.resolutionOrder = body.resolutionOrder;
  }
  if (typeof body.clientId === "string") updates.clientId = body.clientId.trim();
  if (typeof body.clientName === "string") updates.clientName = body.clientName.trim();
  if (Array.isArray(body.tags)) updates.tags = body.tags.filter((item) => typeof item === "string");

  const task = taskSnap.data() as Record<string, unknown>;
  const changes = Object.entries(updates)
    .filter(([key]) => key !== "updatedAt" && key !== "completedAt" && key !== "completedBy")
    .map(([key, nextValue]) => {
      const previousValue = task[key];
      const prev = Array.isArray(previousValue) ? previousValue.join(", ") : String(previousValue ?? "");
      const next = Array.isArray(nextValue) ? (nextValue as unknown[]).join(", ") : String(nextValue ?? "");
      return prev === next ? null : { field: key, from: prev, to: next };
    })
    .filter(Boolean);
  const previousStatus = String(task.status ?? "");
  const nextStatus = String(updates.status ?? previousStatus);
  if (nextStatus === "done" && previousStatus !== "done") {
    updates.completedAt = now;
    updates.completedBy = actor.uid;
  } else if (previousStatus === "done" && nextStatus !== "done") {
    updates.completedAt = "";
    updates.completedBy = "";
  }
  const previousClientId = String(task.clientId ?? "");
  const clientId = String(updates.clientId ?? previousClientId);
  await Promise.all([
    taskRef.set(updates, { merge: true }),
    clientId ? adminDb.collection("clients").doc(clientId).collection("tasks").doc(taskId).set(updates, { merge: true }) : Promise.resolve(),
    previousClientId && previousClientId !== clientId
      ? adminDb.collection("clients").doc(previousClientId).collection("tasks").doc(taskId).delete()
      : Promise.resolve(),
  ]);

  if (clientId) {
    await logClientActivity({
      clientId,
      action: nextStatus === "done" && previousStatus !== "done" ? "task_completed" : "task_updated",
      createdByUserId: actor.uid,
      message: String(updates.title ?? task.title ?? "Tarea"),
      metadata: { taskId, previousStatus, nextStatus, changes },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { taskId } = await context.params;
  const taskRef = adminDb.collection("tasks").doc(taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) return NextResponse.json({ ok: false, error: "Tarea inexistente." }, { status: 404 });
  if (!canAccessRecord(taskSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para esta tarea." }, { status: 403 });
  }
  const task = taskSnap.data() as Record<string, unknown>;
  const clientId = String(task.clientId ?? "");

  await Promise.all([
    taskRef.delete(),
    clientId ? adminDb.collection("clients").doc(clientId).collection("tasks").doc(taskId).delete() : Promise.resolve(),
  ]);

  if (clientId) {
    await logClientActivity({
      clientId,
      action: "task_deleted",
      createdByUserId: actor.uid,
      message: "Tarea eliminada",
      metadata: { taskId },
    });
  }

  return NextResponse.json({ ok: true });
}
