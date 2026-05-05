import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { firestoreDocToJson } from "@/lib/firestore/json-safe";
import { clientInvoiceUpsertSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

async function assertClientAccess(id: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(id).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function GET(_request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }
    const { id } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    const snap = await adminDb
      .collection("clients")
      .doc(id)
      .collection("invoices")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();
    const items = snap.docs.map((doc) => firestoreDocToJson(doc.id, doc.data()));
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[GET /api/admin/clients/[id]/invoices]", error);
    const message = error instanceof Error ? error.message : "Error interno.";
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "No se pudieron cargar las facturas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    const body = await request.json();
    const parsed = clientInvoiceUpsertSchema.parse(body);
    const now = new Date().toISOString();
    const amt = parsed.amount ?? null;
    const currency = amt != null ? parsed.currency ?? "USD" : null;
    const collectionEmailSentAt =
      (parsed.collectionEmailSentAt && parsed.collectionEmailSentAt.trim()) ||
      (parsed.collectionEmailSent ? now : null);

    const ref = await adminDb.collection("clients").doc(id).collection("invoices").add({
      periodLabel: parsed.periodLabel.trim(),
      invoiceLink: parsed.invoiceLink?.trim() || null,
      collectionEmailSent: Boolean(parsed.collectionEmailSent),
      collectionEmailSentAt,
      amount: amt,
      currency,
      status: "pending_payment",
      paidAmount: 0,
      remainingAmount: amt != null ? amt : null,
      paidAt: null,
      isPaid: false,
      paymentHistory: [],
      createdAt: now,
      updatedAt: now,
      createdByUserId: actor.uid,
    });

    const clientUpdates: Record<string, unknown> = { updatedAt: now };
    if (parsed.collectionEmailSent) clientUpdates.lastInvoiceSentAt = now;
    if (parsed.invoiceLink?.trim()) clientUpdates.lastInvoiceLink = parsed.invoiceLink.trim();
    clientUpdates.invoiceStatus = "pending_payment";
    await adminDb.collection("clients").doc(id).set(clientUpdates, { merge: true });

    await incrementClientCounter(id, "invoicesCount", 1);
    await logClientActivity({
      clientId: id,
      action: "invoice_created",
      createdByUserId: actor.uid,
      message: parsed.periodLabel.trim(),
      metadata: { invoiceId: ref.id, amount: amt, status: "pending_payment" },
    });
    return NextResponse.json({ ok: true, invoiceId: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
