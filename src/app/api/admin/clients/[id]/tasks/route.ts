import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const clientSnap = await adminDb.collection("clients").doc(id).get();
  if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const snapshot = await adminDb.collection("clients").doc(id).collection("tasks").orderBy("createdAt", "desc").limit(200).get();
  const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const clientRef = adminDb.collection("clients").doc(id);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ ok: false, error: "El titulo es obligatorio." }, { status: 400 });

  const now = new Date().toISOString();
  const clientName = String(clientSnap.data()?.fullName ?? clientSnap.data()?.displayName ?? "Cliente");
  const dueDate = String(body.dueDate ?? "").trim();
  const assignedMonthRaw = String(body.assignedMonth ?? "").trim();
  const assignedMonth =
    /^\d{4}-\d{2}$/.test(assignedMonthRaw)
      ? assignedMonthRaw
      : /^\d{4}-\d{2}/.test(dueDate)
        ? dueDate.slice(0, 7)
        : now.slice(0, 7);
  const taskRef = clientRef.collection("tasks").doc();
  const descriptionPlain = String(body.descriptionText ?? body.description ?? "").trim();
  const descriptionHtml =
    typeof body.descriptionHtml === "string" ? body.descriptionHtml.trim() : "";
  const rawJson = body.descriptionJson;
  const descriptionJson =
    rawJson && typeof rawJson === "object" && !Array.isArray(rawJson)
      ? (rawJson as Record<string, unknown>)
      : null;

  const payload = {
    taskId: taskRef.id,
    title,
    description: descriptionPlain,
    descriptionText: descriptionPlain,
    ...(descriptionHtml ? { descriptionHtml } : {}),
    ...(descriptionJson ? { descriptionJson } : {}),
    clientId: id,
    clientName,
    assignedTo: String(body.assignedTo ?? "").trim() || actor.uid,
    createdBy: actor.uid,
    dueDate,
    assignedMonth,
    priority: String(body.priority ?? "medium"),
    status: String(body.status ?? "pending"),
    resolutionOrder: Date.now(),
    tags: [] as string[],
    createdAt: now,
    updatedAt: now,
    completedAt: String(body.status ?? "pending") === "done" ? now : "",
    completedBy: String(body.status ?? "pending") === "done" ? actor.uid : "",
    visibilityScope: String(clientSnap.data()?.visibilityScope ?? "team"),
    ownerUserId: String(clientSnap.data()?.ownerUserId ?? ""),
  };

  await Promise.all([taskRef.set(payload), adminDb.collection("tasks").doc(taskRef.id).set(payload)]);

  await logClientActivity({
    clientId: id,
    action: "task_created",
    createdByUserId: actor.uid,
    message: title,
    metadata: { taskId: taskRef.id, assignedTo: payload.assignedTo, dueDate: payload.dueDate },
  });

  return NextResponse.json({ ok: true, id: taskRef.id });
}
