import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type RunningTimerRow = Record<string, unknown> & {
  id: string;
  source?: string;
  status?: string;
  startedAt?: string;
  taskId?: string;
  taskTitle?: string;
};

export async function GET() {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

    // Single-field query to avoid composite-index runtime failures.
    const snap = await adminDb.collection("taskTimeEntries").where("userId", "==", actor.uid).limit(200).get();

    const runningDoc = snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as RunningTimerRow)
      .filter((row) => String(row.source ?? "") === "timer" && String(row.status ?? "") === "running")
      .sort((a, b) => String(b.startedAt ?? "").localeCompare(String(a.startedAt ?? "")))[0];

    if (!runningDoc) return NextResponse.json({ ok: true, running: null });
    return NextResponse.json({
      ok: true,
      running: {
        id: runningDoc.id,
        taskId: String(runningDoc.taskId ?? ""),
        taskTitle: String(runningDoc.taskTitle ?? "Tarea"),
        startedAt: String(runningDoc.startedAt ?? ""),
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo cargar timer." }, { status: 500 });
  }
}

