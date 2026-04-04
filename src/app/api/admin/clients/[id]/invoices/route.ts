import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientInvoiceCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const snap = await adminDb
    .collection("clients")
    .doc(id)
    .collection("invoices")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = clientInvoiceCreateSchema.parse(body);
    const now = new Date().toISOString();
    const ref = await adminDb
      .collection("clients")
      .doc(id)
      .collection("invoices")
      .add({
        ...parsed,
        sentAt: parsed.sentAt || null,
        dueDate: parsed.dueDate || null,
        paidAt: parsed.paidAt || null,
        invoiceLink: parsed.invoiceLink || null,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actor.uid,
      });

    const clientUpdates: Record<string, unknown> = {
      updatedAt: now,
      lastInvoiceSentAt: parsed.sentAt || now,
    };
    if (parsed.invoiceLink) clientUpdates.lastInvoiceLink = parsed.invoiceLink;
    if (parsed.status === "sent" || parsed.status === "paid") {
      clientUpdates.invoiceStatus = parsed.status === "paid" ? "paid" : "sent";
    }
    await adminDb.collection("clients").doc(id).set(clientUpdates, { merge: true });

    await incrementClientCounter(id, "invoicesCount", 1);
    await logClientActivity({
      clientId: id,
      action: "invoice_created",
      createdByUserId: actor.uid,
      message: parsed.periodLabel,
      metadata: { invoiceId: ref.id, amount: parsed.amount, status: parsed.status },
    });
    return NextResponse.json({ ok: true, invoiceId: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
