import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { getRunningTimerForUser, isActorAdmin, parseMinutesInput, recomputeTaskTimeTotals, resolveAssignedMonth } from "@/lib/tasks/time-entries";

type Context = { params: Promise<{ taskId: string }> };

export const runtime = "nodejs";

function adminJson(body: Record<string, unknown>, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function serializeRouteError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const rec = error as Record<string, unknown>;
    if (typeof rec.message === "string" && rec.message.trim()) return rec.message;
    if (rec.code != null) return String(rec.code);
  }
  return "Error al registrar tiempo.";
}

export async function GET(_request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

    const { taskId } = await context.params;
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return NextResponse.json({ ok: false, error: "Tarea inexistente." }, { status: 404 });
    const task = taskSnap.data() as Record<string, unknown>;
    if (!canAccessRecord(task, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para esta tarea." }, { status: 403 });
    }

    // Single-field query only (avoids composite index taskId + date); sort in memory.
    const entriesSnap = await adminDb.collection("taskTimeEntries").where("taskId", "==", taskId).limit(500).get();
    const entries = entriesSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as Record<string, unknown> & { id: string })
      .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")));
    return NextResponse.json({ ok: true, entries });
  } catch (error) {
    console.error("[GET /api/admin/tasks/[taskId]/time-entries]", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los registros de tiempo." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return adminJson({ ok: false, error: "No autorizado." }, 401);

    const { taskId } = await context.params;
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return adminJson({ ok: false, error: "Tarea inexistente." }, 404);
    const task = taskSnap.data() as Record<string, unknown>;
    if (!canAccessRecord(task, actor.uid)) {
      return adminJson({ ok: false, error: "Sin permisos para esta tarea." }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return adminJson({ ok: false, error: "Solicitud JSON inválida." }, 400);
    }

    const source = String(body.source ?? "manual") === "timer" ? "timer" : "manual";
    const isAdmin = await isActorAdmin(actor.uid);
    const requestedUserId = String(body.userId ?? "").trim() || actor.uid;
    if (!isAdmin && requestedUserId !== actor.uid) {
      return adminJson({ ok: false, error: "Solo podés cargar tiempo propio." }, 403);
    }

    const date = String(body.date ?? "").trim() || new Date().toISOString().slice(0, 10);
    const assignedMonth = resolveAssignedMonth(
      date,
      String(body.assignedMonth ?? "").trim(),
      String(task.assignedMonth ?? new Date().toISOString().slice(0, 7)),
    );

    const userSnap = await adminDb.collection("users").doc(requestedUserId).get();
    const userName = String((userSnap.data() as Record<string, unknown> | undefined)?.fullName ?? "").trim();
    const now = new Date().toISOString();
    const clientId = String(task.clientId ?? "");
    const clientName = String(task.clientName ?? "");
    const taskTitle = String(task.title ?? "");

    if (source === "timer" && String(body.action ?? "start") === "start") {
      const running = await getRunningTimerForUser(requestedUserId);
      if (running && running.taskId !== taskId) {
        return adminJson(
          {
            ok: false,
            error: "Ya tenés un tiempo corriendo en otra tarea. Pausalo o finalizalo antes de iniciar uno nuevo.",
          },
          409,
        );
      }
      if (running && running.taskId === taskId) {
        return adminJson({ ok: true, id: running.id, running: true }, 200);
      }
      const runningRef = adminDb.collection("taskTimeEntries").doc();
      const timerDoc: Record<string, string | number> = {
        taskId: String(taskId),
        taskTitle,
        clientId,
        clientName,
        userId: String(requestedUserId),
        userName,
        date,
        assignedMonth,
        source: "timer",
        status: "running",
        startedAt: now,
        endedAt: "",
        minutes: 0,
        seconds: 0,
        note: String(body.note ?? "").trim(),
        createdAt: now,
        updatedAt: now,
        createdByUserId: String(actor.uid),
      };
      await runningRef.set(timerDoc);
      return adminJson({ ok: true, id: runningRef.id, running: true }, 200);
    }

    const minutes = parseMinutesInput(body.minutesInput ?? body.minutes);
    if (minutes <= 0) {
      return adminJson({ ok: false, error: "Ingresá una duración válida mayor a 0." }, 400);
    }

    const ref = adminDb.collection("taskTimeEntries").doc();
    const manualDoc: Record<string, string | number> = {
      taskId: String(taskId),
      taskTitle,
      clientId,
      clientName,
      userId: String(requestedUserId),
      userName,
      date,
      assignedMonth,
      source: "manual",
      status: "completed",
      startedAt: "",
      endedAt: "",
      minutes,
      seconds: minutes * 60,
      note: String(body.note ?? "").trim(),
      createdAt: now,
      updatedAt: now,
      createdByUserId: String(actor.uid),
    };
    await ref.set(manualDoc);

    await recomputeTaskTimeTotals(taskId, clientId);
    return adminJson({ ok: true, id: ref.id }, 200);
  } catch (error) {
    console.error("[POST /api/admin/tasks/[taskId]/time-entries]", error);
    return adminJson({ ok: false, error: serializeRouteError(error) }, 500);
  }
}

