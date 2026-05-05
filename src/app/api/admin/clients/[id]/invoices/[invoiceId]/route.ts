import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientInvoicePatchSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string; invoiceId: string }> };

async function assertClientAccess(cid: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(cid).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const EPS = 0.01;

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id, invoiceId } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

    const invoiceRef = adminDb.collection("clients").doc(id).collection("invoices").doc(invoiceId);
    const invoiceSnap = await invoiceRef.get();
    if (!invoiceSnap.exists) {
      return NextResponse.json({ ok: false, error: "Factura inexistente." }, { status: 404 });
    }

    const existing = invoiceSnap.data() as Record<string, unknown>;
    const body = await request.json();
    const parsed = clientInvoicePatchSchema.parse(body);
    const now = new Date().toISOString();

    const periodLabel =
      parsed.periodLabel !== undefined ? parsed.periodLabel.trim() : String(existing.periodLabel ?? "").trim();
    if (!periodLabel) {
      return NextResponse.json({ ok: false, error: "El título es obligatorio." }, { status: 400 });
    }

    let invoiceLink: string | null =
      existing.invoiceLink != null ? String(existing.invoiceLink) : null;
    if (parsed.invoiceLink !== undefined) {
      const t = parsed.invoiceLink.trim();
      invoiceLink = t === "" ? null : t;
    }

    const collectionEmailSent =
      parsed.collectionEmailSent !== undefined
        ? Boolean(parsed.collectionEmailSent)
        : Boolean(existing.collectionEmailSent);

    let collectionEmailSentAt: string | null =
      existing.collectionEmailSentAt != null ? String(existing.collectionEmailSentAt) : null;
    if (parsed.collectionEmailSentAt !== undefined && parsed.collectionEmailSentAt.trim()) {
      collectionEmailSentAt = parsed.collectionEmailSentAt.trim();
    } else if (parsed.collectionEmailSent !== undefined) {
      if (collectionEmailSent) {
        collectionEmailSentAt = collectionEmailSentAt ?? now;
      } else {
        collectionEmailSentAt = null;
      }
    }

    let amount: number | null;
    if (parsed.amount !== undefined) {
      amount = parsed.amount ?? null;
    } else {
      const raw = existing.amount;
      amount = raw != null && raw !== "" && Number.isFinite(Number(raw)) ? round2(Number(raw)) : null;
    }

    let currency: string | null =
      existing.currency != null && String(existing.currency).trim()
        ? String(existing.currency)
        : null;
    if (parsed.currency !== undefined) {
      currency = parsed.currency?.trim() ? String(parsed.currency) : null;
    }
    if (amount != null && amount > 0 && !currency) {
      currency = "USD";
    }
    if (amount == null) {
      currency = null;
    }

    const paidAmount = round2(Number(existing.paidAmount ?? 0));

    let remainingAmount: number | null =
      amount != null ? Math.max(0, round2(amount - paidAmount)) : null;

    let status = String(existing.status ?? "pending_payment");
    let isPaid = Boolean(existing.isPaid);

    if (amount != null && paidAmount >= amount - EPS) {
      status = "paid";
      remainingAmount = 0;
      isPaid = true;
    } else if (amount != null && paidAmount > EPS && paidAmount < amount - EPS) {
      status = "partially_paid";
      isPaid = false;
    } else if (paidAmount <= EPS) {
      status = "pending_payment";
      isPaid = false;
    }

    await invoiceRef.set(
      {
        periodLabel,
        invoiceLink,
        collectionEmailSent,
        collectionEmailSentAt,
        amount,
        currency,
        remainingAmount,
        status,
        isPaid,
        updatedAt: now,
        updatedByUserId: actor.uid,
      },
      { merge: true },
    );

    const clientUpdates: Record<string, unknown> = {
      updatedAt: now,
      lastInvoiceLink: invoiceLink,
    };
    if (collectionEmailSent) clientUpdates.lastInvoiceSentAt = collectionEmailSentAt ?? now;
    clientUpdates.invoiceStatus =
      status === "paid" ? "paid" : status === "partially_paid" || status === "pending_payment" ? "sent" : "draft";

    await adminDb.collection("clients").doc(id).set(clientUpdates, { merge: true });

    await logClientActivity({
      clientId: id,
      action: "invoice_updated",
      createdByUserId: actor.uid,
      message: periodLabel,
      metadata: { invoiceId, amount, status },
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
