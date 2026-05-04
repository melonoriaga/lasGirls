import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ taskId: string }> };

export async function POST(request: Request, context: Context) {
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

  const body = (await request.json()) as Record<string, unknown>;
  const content = String(body.content ?? "").trim();
  if (!content) return NextResponse.json({ ok: false, error: "El comentario no puede estar vacío." }, { status: 400 });

  const now = new Date().toISOString();
  const comment = {
    content,
    createdAt: now,
    createdByUserId: actor.uid,
  };
  await taskRef.collection("comments").add(comment);

  const clientId = String(task.clientId ?? "");
  if (clientId) {
    await logClientActivity({
      clientId,
      action: "task_comment_added",
      createdByUserId: actor.uid,
      message: content.slice(0, 180),
      metadata: { taskId, title: String(task.title ?? "") },
    });
  }

  return NextResponse.json({ ok: true });
}
