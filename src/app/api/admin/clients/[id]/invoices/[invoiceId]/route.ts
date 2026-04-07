import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientInvoiceCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string; invoiceId: string }> };

async function assertClientAccess(id: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(id).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const, client: snap.data() as Record<string, unknown> };
}

async function upsertAutoPaymentFromInvoice(params: {
  clientId: string;
  invoiceId: string;
  actorUid: string;
  client: Record<string, unknown>;
  periodLabel: string;
  amount: number;
  currency: string;
  isPaid: boolean;
  paidAt: string | null;
  receivedByUserId: string;
}) {
  const {
    clientId,
    invoiceId,
    actorUid,
    client,
    periodLabel,
    amount,
    currency,
    isPaid,
    paidAt,
    receivedByUserId,
  } = params;
  const paymentsRef = adminDb.collection("clients").doc(clientId).collection("payments");
  const existingSnap = await paymentsRef.where("relatedInvoiceId", "==", invoiceId).limit(1).get();
  const existing = existingSnap.docs[0];
  const visibilityScope = String(client.visibilityScope ?? "team");
  const fallbackReceiver = String(client.ownerUserId ?? actorUid);
  const receiver = (receivedByUserId || (visibilityScope === "private" ? fallbackReceiver : "")).trim();

  if (isPaid && visibilityScope !== "private" && !receiver) {
    throw new Error("Indicá quién recibió el pago para clientes del equipo.");
  }

  if (!isPaid) {
    if (existing) {
      const data = existing.data() as { autoFromInvoice?: boolean };
      if (data.autoFromInvoice) {
        await existing.ref.delete();
        await incrementClientCounter(clientId, "paymentsCount", -1);
      }
    }
    return;
  }

  const payload = {
    periodLabel,
    totalAmount: amount,
    currency,
    receivedAt: paidAt || new Date().toISOString(),
    paymentType: "full_to_one_person",
    receivedByUserId: receiver || null,
    splits: receiver ? [{ userId: receiver, amount }] : [],
    relatedInvoiceId: invoiceId,
    notes: "Auto generado desde factura pagada.",
    autoFromInvoice: true,
    updatedAt: new Date().toISOString(),
    updatedByUserId: actorUid,
  };

  if (existing) {
    await existing.ref.set(payload, { merge: true });
    return;
  }

  await paymentsRef.add({
    ...payload,
    createdAt: new Date().toISOString(),
    createdByUserId: actorUid,
  });
  await incrementClientCounter(clientId, "paymentsCount", 1);
  await logClientActivity({
    clientId,
    action: "payment_recorded",
    createdByUserId: actorUid,
    message: String(amount),
    metadata: { relatedInvoiceId: invoiceId, autoFromInvoice: true, currency },
  });
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id, invoiceId } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

    const body = await request.json();
    const parsed = clientInvoiceCreateSchema.parse(body);
    const now = new Date().toISOString();
    const collectionEmailSentAt = parsed.collectionEmailSentAt || (parsed.collectionEmailSent ? now : null);
    const invoiceEmailSentAt = parsed.invoiceEmailSentAt || (parsed.invoiceEmailSent ? now : null);
    const paidAt = parsed.paidAt || (parsed.isPaid ? now : null);
    const normalizedStatus =
      parsed.status === "paid" || parsed.isPaid
        ? "paid"
        : parsed.invoiceEmailSent || parsed.status === "sent"
          ? "sent"
          : parsed.status;

    await adminDb
      .collection("clients")
      .doc(id)
      .collection("invoices")
      .doc(invoiceId)
      .set(
        {
          ...parsed,
          sentAt: parsed.sentAt || invoiceEmailSentAt,
          dueDate: parsed.dueDate || null,
          paidAt,
          invoiceLink: parsed.invoiceLink || null,
          collectionEmailSent: Boolean(parsed.collectionEmailSent),
          collectionEmailSentAt,
          invoiceEmailSent: Boolean(parsed.invoiceEmailSent),
          invoiceEmailSentAt,
          isPaid: Boolean(parsed.isPaid || normalizedStatus === "paid"),
          status: normalizedStatus,
          updatedAt: now,
          updatedByUserId: actor.uid,
        },
        { merge: true },
      );

    await upsertAutoPaymentFromInvoice({
      clientId: id,
      invoiceId,
      actorUid: actor.uid,
      client: access.client,
      periodLabel: parsed.periodLabel,
      amount: parsed.amount,
      currency: parsed.currency,
      isPaid: Boolean(parsed.isPaid || normalizedStatus === "paid"),
      paidAt,
      receivedByUserId: String(parsed.receivedByUserId ?? ""),
    });

    await adminDb.collection("clients").doc(id).set(
      {
        updatedAt: now,
        lastInvoiceSentAt: parsed.sentAt || invoiceEmailSentAt || now,
        lastInvoiceLink: parsed.invoiceLink || null,
        invoiceStatus: normalizedStatus === "paid" ? "paid" : normalizedStatus === "sent" ? "sent" : "draft",
      },
      { merge: true },
    );

    await logClientActivity({
      clientId: id,
      action: "invoice_updated",
      createdByUserId: actor.uid,
      message: parsed.periodLabel,
      metadata: { invoiceId, amount: parsed.amount, status: normalizedStatus },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id, invoiceId } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

    const paymentsSnap = await adminDb
      .collection("clients")
      .doc(id)
      .collection("payments")
      .where("relatedInvoiceId", "==", invoiceId)
      .get();
    for (const doc of paymentsSnap.docs) {
      const data = doc.data() as { autoFromInvoice?: boolean };
      if (!data.autoFromInvoice) continue;
      await doc.ref.delete();
      await incrementClientCounter(id, "paymentsCount", -1);
    }

    await adminDb.collection("clients").doc(id).collection("invoices").doc(invoiceId).delete();
    await incrementClientCounter(id, "invoicesCount", -1);
    await logClientActivity({
      clientId: id,
      action: "invoice_updated",
      createdByUserId: actor.uid,
      message: "Factura eliminada",
      metadata: { invoiceId, deleted: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
