import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, context: Context) {
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

  const clientId = String(task.clientId ?? "");
  const [commentsSnap, activitySnap] = await Promise.all([
    taskRef.collection("comments").orderBy("createdAt", "asc").limit(300).get(),
    clientId
      ? adminDb.collection("clients").doc(clientId).collection("activity").orderBy("createdAt", "desc").limit(300).get()
      : Promise.resolve(null),
  ]);

  const comments = commentsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }));
  const activity = (activitySnap?.docs ?? [])
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((item) => String((item.metadata as Record<string, unknown> | undefined)?.taskId ?? "") === taskId);

  return NextResponse.json({ ok: true, comments, activity });
}
