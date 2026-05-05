import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ taskId: string; commentId: string }> };

export const runtime = "nodejs";

function adminJson(body: Record<string, unknown>, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function PATCH(request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return adminJson({ ok: false, error: "No autorizado." }, 401);

    const { taskId, commentId } = await context.params;
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

    const content = String(body.content ?? "").trim();
    if (!content) return adminJson({ ok: false, error: "El comentario no puede estar vacío." }, 400);

    const commentRef = taskRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) return adminJson({ ok: false, error: "Comentario inexistente." }, 404);

    const existing = commentSnap.data() as Record<string, unknown>;
    if (String(existing.createdByUserId ?? "") !== actor.uid) {
      return adminJson({ ok: false, error: "Solo podés editar tus propios comentarios." }, 403);
    }

    const now = new Date().toISOString();
    await commentRef.set({ content, updatedAt: now }, { merge: true });

    return adminJson({ ok: true });
  } catch (error) {
    console.error("[PATCH /api/admin/tasks/[taskId]/comments/[commentId]]", error);
    return adminJson(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el comentario." },
      500,
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return adminJson({ ok: false, error: "No autorizado." }, 401);

    const { taskId, commentId } = await context.params;
    const taskRef = adminDb.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();
    if (!taskSnap.exists) return adminJson({ ok: false, error: "Tarea inexistente." }, 404);
    const task = taskSnap.data() as Record<string, unknown>;
    if (!canAccessRecord(task, actor.uid)) {
      return adminJson({ ok: false, error: "Sin permisos para esta tarea." }, 403);
    }

    const commentRef = taskRef.collection("comments").doc(commentId);
    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) return adminJson({ ok: false, error: "Comentario inexistente." }, 404);

    const existing = commentSnap.data() as Record<string, unknown>;
    if (String(existing.createdByUserId ?? "") !== actor.uid) {
      return adminJson({ ok: false, error: "Solo podés eliminar tus propios comentarios." }, 403);
    }

    await commentRef.delete();
    return adminJson({ ok: true });
  } catch (error) {
    console.error("[DELETE /api/admin/tasks/[taskId]/comments/[commentId]]", error);
    return adminJson(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo eliminar el comentario." },
      500,
    );
  }
}
