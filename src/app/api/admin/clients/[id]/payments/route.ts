import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientPaymentCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

async function assertClientAccess(id: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(id).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

async function syncInvoicePaymentStatus(clientId: string, invoiceId: string) {
  const invoiceRef = adminDb.collection("clients").doc(clientId).collection("invoices").doc(invoiceId);
  const invoiceSnap = await invoiceRef.get();
  if (!invoiceSnap.exists) return;

  const invoiceData = invoiceSnap.data() as { amount?: number; currency?: string };
  const invoiceAmount = Number(invoiceData.amount ?? 0);
  const paymentsSnap = await adminDb
    .collection("clients")
    .doc(clientId)
    .collection("payments")
    .where("relatedInvoiceId", "==", invoiceId)
    .get();
  const paidAmount = paymentsSnap.docs.reduce((sum, doc) => sum + Number(doc.data().totalAmount ?? 0), 0);

  let status: string = "pending_payment";
  if (paidAmount <= 0) status = "pending_payment";
  else if (invoiceAmount > 0 && paidAmount < invoiceAmount) status = "partially_paid";
  else status = "paid";

  await invoiceRef.set(
    {
      paidAmount,
      isPaid: status === "paid",
      status,
      paidAt: status === "paid" ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function GET(_request: Request, context: Context) {
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
    .collection("payments")
    .orderBy("receivedAt", "desc")
    .limit(200)
    .get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const totalsByUser: Record<string, number> = {};
  let totalPaid = 0;
  for (const row of items) {
    const amount = Number((row as { totalAmount?: number }).totalAmount ?? 0);
    totalPaid += amount;
    const splits = (row as { splits?: { userId: string; amount: number }[] }).splits ?? [];
    const pt = (row as { paymentType?: string }).paymentType;
    const receivedBy = (row as { receivedByUserId?: string }).receivedByUserId;
    if (pt === "full_to_one_person" && receivedBy) {
      totalsByUser[receivedBy] = (totalsByUser[receivedBy] ?? 0) + amount;
    } else {
      for (const s of splits) {
        totalsByUser[s.userId] = (totalsByUser[s.userId] ?? 0) + (s.amount ?? 0);
      }
    }
  }

  return NextResponse.json({ ok: true, items, totalsByUser, totalPaid });
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
    const parsed = clientPaymentCreateSchema.parse(body);
    const now = new Date().toISOString();

    let splits = parsed.splits;
    if (parsed.paymentType === "full_to_one_person" && parsed.receivedByUserId) {
      splits = [{ userId: parsed.receivedByUserId, amount: parsed.totalAmount }];
    }

    const ref = await adminDb
      .collection("clients")
      .doc(id)
      .collection("payments")
      .add({
        periodLabel: parsed.periodLabel || "",
        totalAmount: parsed.totalAmount,
        currency: parsed.currency,
        receivedAt: parsed.receivedAt,
        paymentType: parsed.paymentType,
        receivedByUserId: parsed.receivedByUserId || null,
        splits,
        relatedInvoiceId: parsed.relatedInvoiceId || null,
        notes: parsed.notes || "",
        createdAt: now,
        updatedAt: now,
        createdByUserId: actor.uid,
      });

    await incrementClientCounter(id, "paymentsCount", 1);
    await logClientActivity({
      clientId: id,
      action: "payment_recorded",
      createdByUserId: actor.uid,
      message: String(parsed.totalAmount),
      metadata: { paymentId: ref.id, currency: parsed.currency },
    });

    if (parsed.relatedInvoiceId) {
      await syncInvoicePaymentStatus(id, parsed.relatedInvoiceId);
    }

    return NextResponse.json({ ok: true, paymentId: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
