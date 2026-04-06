import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type LeadRow = { id: string; fullName?: string; email?: string; company?: string; status?: string; createdAt?: string };
type LogRow = {
  id: string;
  action?: string;
  actorName?: string;
  actorUid?: string;
  path?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Polling endpoint for admin desktop notifications (new leads + team activity).
 * Uses server session cookie; no client Firestore access required.
 */
export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const afterRaw = searchParams.get("after")?.trim() ?? "";
  const after =
    afterRaw.length >= 20 && !Number.isNaN(Date.parse(afterRaw))
      ? afterRaw
      : new Date(Date.now() - 90_000).toISOString();

  const serverTime = new Date().toISOString();

  try {
    const [newLeadsSnap, logsSnap] = await Promise.all([
      adminDb.collection("leads").where("createdAt", ">", after).orderBy("createdAt", "asc").limit(20).get(),
      adminDb.collection("activityLogs").where("createdAt", ">", after).orderBy("createdAt", "asc").limit(40).get(),
    ]);

    const leads: LeadRow[] = newLeadsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    const teamActivity: LogRow[] = logsSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }) as LogRow)
      .filter((row) => row.actorUid && row.actorUid !== actor.uid && row.action);

    return NextResponse.json({
      ok: true,
      serverTime,
      after,
      leads,
      teamActivity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo leer la actividad.";
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "Error al consultar actividad." },
      { status: 500 },
    );
  }
}
