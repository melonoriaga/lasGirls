import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { isActorAdmin, parseMinutesInput, recomputeTaskTimeTotals, resolveAssignedMonth } from "@/lib/tasks/time-entries";

type Context = { params: Promise<{ entryId: string }> };

export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    const { entryId } = await context.params;
    const ref = adminDb.collection("taskTimeEntries").doc(entryId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ ok: false, error: "Registro inexistente." }, { status: 404 });
    const entry = snap.data() as Record<string, unknown>;

    const taskSnap = await adminDb.collection("tasks").doc(String(entry.taskId ?? "")).get();
    const task = (taskSnap.data() as Record<string, unknown> | undefined) ?? {};
    if (!taskSnap.exists || !canAccessRecord(task, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para este registro." }, { status: 403 });
    }

    const isAdmin = await isActorAdmin(actor.uid);
    if (!isAdmin && String(entry.userId ?? "") !== actor.uid) {
      return NextResponse.json({ ok: false, error: "Solo podés editar tu propio tiempo." }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "Solicitud JSON inválida." }, { status: 400 });
    }
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  const action = String(body.action ?? "");

  if (action === "stop" && String(entry.source ?? "") === "timer" && String(entry.status ?? "") === "running") {
    const startedAt = String(entry.startedAt ?? "");
    if (!startedAt) return NextResponse.json({ ok: false, error: "Sesión sin inicio." }, { status: 400 });
    const startedMs = new Date(startedAt).getTime();
    const endedMs = Date.now();
    const seconds = Math.max(1, Math.round((endedMs - startedMs) / 1000));
    const minutes = Math.max(1, Math.round(seconds / 60));
    const endedAt = new Date(endedMs).toISOString();
    await ref.set(
      {
        status: "completed",
        endedAt,
        date: endedAt.slice(0, 10),
        minutes,
        seconds,
        updatedAt: endedAt,
      },
      { merge: true },
    );
    await recomputeTaskTimeTotals(String(entry.taskId ?? ""), String(entry.clientId ?? ""));
    return NextResponse.json({ ok: true, minutes, seconds, endedAt });
  }
  if (typeof body.note === "string") updates.note = body.note.trim();
  if (body.minutesInput != null || body.minutes != null) {
    const parsed = parseMinutesInput(body.minutesInput ?? body.minutes);
    if (parsed <= 0) return NextResponse.json({ ok: false, error: "Duración inválida." }, { status: 400 });
    updates.minutes = parsed;
    updates.seconds = parsed * 60;
  }

  const currentDate = String(entry.date ?? "");
  const nextDate = typeof body.date === "string" ? body.date.trim() : currentDate;
  if (typeof body.date === "string") updates.date = nextDate;
  if (typeof body.assignedMonth === "string" || typeof body.date === "string") {
    updates.assignedMonth = resolveAssignedMonth(
      nextDate,
      typeof body.assignedMonth === "string" ? body.assignedMonth.trim() : String(entry.assignedMonth ?? ""),
      String(task.assignedMonth ?? new Date().toISOString().slice(0, 7)),
    );
  }

  if (isAdmin && typeof body.userId === "string") {
    const nextUserId = body.userId.trim();
    if (nextUserId) {
      const userSnap = await adminDb.collection("users").doc(nextUserId).get();
      updates.userId = nextUserId;
      updates.userName = String((userSnap.data() as Record<string, unknown> | undefined)?.fullName ?? "").trim();
    }
  }

  await ref.set(updates, { merge: true });
  await recomputeTaskTimeTotals(String(entry.taskId ?? ""), String(entry.clientId ?? ""));
  return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/admin/time-entries/[entryId]]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al actualizar registro." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  const { entryId } = await context.params;
  const ref = adminDb.collection("taskTimeEntries").doc(entryId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "Registro inexistente." }, { status: 404 });
  const entry = snap.data() as Record<string, unknown>;

  const taskSnap = await adminDb.collection("tasks").doc(String(entry.taskId ?? "")).get();
  const task = (taskSnap.data() as Record<string, unknown> | undefined) ?? {};
  if (!taskSnap.exists || !canAccessRecord(task, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este registro." }, { status: 403 });
  }

  const isAdmin = await isActorAdmin(actor.uid);
  if (!isAdmin && String(entry.userId ?? "") !== actor.uid) {
    return NextResponse.json({ ok: false, error: "Solo podés eliminar tu propio tiempo." }, { status: 403 });
  }

  await ref.delete();
  await recomputeTaskTimeTotals(String(entry.taskId ?? ""), String(entry.clientId ?? ""));
  return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/time-entries/[entryId]]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al eliminar registro." },
      { status: 500 },
    );
  }
}

