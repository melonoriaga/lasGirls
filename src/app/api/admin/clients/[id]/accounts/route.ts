import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";

/** Firebase Admin + `node:crypto` no son compatibles con Edge. */
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

function serializeUnknownError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error && typeof error === "object") {
    const o = error as Record<string, unknown>;
    const nested = [o.message, o.reason].find((x) => typeof x === "string" && String(x).trim());
    if (typeof nested === "string" && nested.trim()) return nested.trim();
    try {
      return JSON.stringify(error, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    } catch {
      return Object.prototype.toString.call(error);
    }
  }
  return "Error al guardar la cuenta.";
}

function jsonSafe(body: Record<string, unknown>, status = 200) {
  try {
    const s = JSON.stringify(body, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    return new NextResponse(s, {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch {
    return new NextResponse(JSON.stringify({ ok: false, error: "Error interno al armar la respuesta." }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}

function isFirestoreTimestamp(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as { toDate?: unknown }).toDate === "function"
  );
}

/** Evita que Timestamp / tipos de Firestore rompan JSON.stringify en GET (Turbopack a veces devuelve 500 vacío). */
function firestoreValueToJson(v: unknown): unknown {
  if (v === null || v === undefined) return v;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return v;
  if (t === "bigint") return (v as bigint).toString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if (isFirestoreTimestamp(v)) {
      try {
        return v.toDate().toISOString();
      } catch {
        return null;
      }
    }
    if (Array.isArray(v)) return v.map(firestoreValueToJson);
    if (Object.getPrototypeOf(v) === Object.prototype) {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(o)) {
        out[k] = firestoreValueToJson(val);
      }
      return out;
    }
    const geo = v as { latitude?: unknown; longitude?: unknown };
    if (typeof geo.latitude === "number" && typeof geo.longitude === "number") {
      return { latitude: geo.latitude, longitude: geo.longitude };
    }
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function sanitizeAccountDocForApi(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(data)) {
    if (k === "password") continue;
    out[k] = firestoreValueToJson(val);
  }
  return out;
}

async function assertAccess(clientId: string, uid: string) {
  const clientSnap = await adminDb.collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(clientSnap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return jsonSafe({ ok: false, error: "No autorizado." }, 401);

  const { id } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return jsonSafe({ ok: false, error: access.error }, access.status);

  const snap = await adminDb.collection("clients").doc(id).collection("accounts").orderBy("createdAt", "desc").limit(200).get();
  const items = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      ...sanitizeAccountDocForApi(data),
      password: undefined,
      hasPassword: Boolean(String(data.password ?? "").trim()),
    };
  });
  return jsonSafe({ ok: true, items });
}

async function handleAccountsPost(request: Request, context: Context): Promise<Response> {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) return jsonSafe({ ok: false, error: "No autorizado." }, 401);

    const { id } = await context.params;
    const access = await assertAccess(id, actor.uid);
    if (!access.ok) return jsonSafe({ ok: false, error: access.error }, access.status);

    let body: Record<string, unknown>;
    try {
      const rawBody = await request.text();
      body = rawBody.trim() ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      return jsonSafe({ ok: false, error: "Solicitud inválida." }, 400);
    }

    const platform = String(body.platform ?? "").trim();
    const username = String(body.username ?? "").trim();
    if (!platform || !username) {
      return jsonSafe({ ok: false, error: "Plataforma y usuario son obligatorios." }, 400);
    }

    const now = new Date().toISOString();
    const passwordPlain = String(body.password ?? "").trim();

    const ref = await adminDb.collection("clients").doc(id).collection("accounts").add({
      platform,
      username,
      password: passwordPlain,
      url: String(body.url ?? "").trim(),
      notes: String(body.notes ?? "").trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
    });

    try {
      await logClientActivity({
        clientId: id,
        action: "account_added",
        createdByUserId: actor.uid,
        message: `${platform} · ${username}`,
        metadata: { accountId: ref.id },
      });
    } catch (logErr) {
      console.error("[clients accounts POST] actividad no registrada (cuenta sí guardada)", logErr);
    }

    return jsonSafe({
      ok: true,
      id: ref.id,
    });
  } catch (error: unknown) {
    const message = serializeUnknownError(error);
    let code = "";
    if (typeof error === "object" && error !== null && "code" in error) {
      code = String((error as { code?: unknown }).code ?? "");
    }
    const detail = code ? `${message} (code ${code})` : message;
    console.error("[clients accounts POST]", detail, error);
    let safeDetail = detail;
    try {
      safeDetail = String(detail).slice(0, 8000);
    } catch {
      safeDetail = "Error al guardar la cuenta.";
    }
    return jsonSafe({ ok: false, error: safeDetail }, 500);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    return await handleAccountsPost(request, context);
  } catch (fatal: unknown) {
    let msg = "Error fatal en el servidor.";
    try {
      msg = serializeUnknownError(fatal);
    } catch {
      /* ignore */
    }
    console.error("[clients accounts POST] fatal (fuera del handler)", fatal);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
