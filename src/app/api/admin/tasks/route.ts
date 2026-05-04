import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const snap = await adminDb.collection("tasks").orderBy("createdAt", "desc").limit(300).get();
  const items = snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((row) => canAccessRecord(row, actor.uid));
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  const clientId = String(body.clientId ?? "").trim();
  if (!title || !clientId) {
    return NextResponse.json({ ok: false, error: "Título y cliente son obligatorios." }, { status: 400 });
  }

  const clientRef = adminDb.collection("clients").doc(clientId);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const now = new Date().toISOString();
  const clientData = clientSnap.data() as Record<string, unknown>;
  const taskRef = adminDb.collection("tasks").doc();
  const dueDate = String(body.dueDate ?? "").trim();
  const assignedMonthRaw = String(body.assignedMonth ?? "").trim();
  const assignedMonth =
    /^\d{4}-\d{2}$/.test(assignedMonthRaw)
      ? assignedMonthRaw
      : /^\d{4}-\d{2}/.test(dueDate)
        ? dueDate.slice(0, 7)
        : now.slice(0, 7);
  const payload = {
    taskId: taskRef.id,
    title,
    description: String(body.description ?? "").trim(),
    clientId,
    clientName: String(clientData.fullName ?? clientData.displayName ?? "Cliente"),
    assignedTo: String(body.assignedTo ?? actor.uid),
    createdBy: actor.uid,
    dueDate,
    assignedMonth,
    priority: String(body.priority ?? "medium"),
    status: String(body.status ?? "pending"),
    tags: Array.isArray(body.tags) ? body.tags.filter((item) => typeof item === "string") : [],
    createdAt: now,
    updatedAt: now,
    completedAt: String(body.status ?? "pending") === "done" ? now : "",
    completedBy: String(body.status ?? "pending") === "done" ? actor.uid : "",
    visibilityScope: String(clientData.visibilityScope ?? "team"),
    ownerUserId: String(clientData.ownerUserId ?? ""),
  };

  await Promise.all([taskRef.set(payload), clientRef.collection("tasks").doc(taskRef.id).set(payload)]);
  await logClientActivity({
    clientId,
    action: "task_created",
    createdByUserId: actor.uid,
    message: title,
    metadata: { taskId: taskRef.id, assignedTo: payload.assignedTo, dueDate: payload.dueDate },
  });

  return NextResponse.json({ ok: true, id: taskRef.id });
}
