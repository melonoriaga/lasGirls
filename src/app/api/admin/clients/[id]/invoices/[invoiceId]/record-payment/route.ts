import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { logClientActivity } from "@/lib/clients/activity";
import { invoiceRecordPaymentSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string; invoiceId: string }> };

async function assertClientAccess(cid: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(cid).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

type PaymentHist = { id: string; paidAt: string; amount: number; kind: "partial" | "full"; note?: string };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const EPS = 0.01;

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id, invoiceId } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

    const body = await request.json();
    const parsed = invoiceRecordPaymentSchema.parse(body);

    const invoiceRef = adminDb.collection("clients").doc(id).collection("invoices").doc(invoiceId);
    const invSnap = await invoiceRef.get();
    if (!invSnap.exists) {
      return NextResponse.json({ ok: false, error: "Factura inexistente." }, { status: 404 });
    }

    const inv = invSnap.data() as Record<string, unknown>;
    const paidBefore = round2(Number(inv.paidAmount ?? 0));
    const rawTotal = inv.amount != null && inv.amount !== "" ? Number(inv.amount) : NaN;
    const total = Number.isFinite(rawTotal) && rawTotal > 0 ? round2(rawTotal) : null;
    const history = (Array.isArray(inv.paymentHistory) ? inv.paymentHistory : []) as PaymentHist[];
    const now = new Date().toISOString();
    const noteTrim = typeof parsed.note === "string" ? parsed.note.trim() : "";

    if (parsed.kind === "partial") {
      if (total == null) {
        return NextResponse.json(
          {
            ok: false,
            error: "Definí el monto de la factura (editando la factura) antes de registrar pagos parciales.",
          },
          { status: 400 },
        );
      }
      const partialAmt = round2(Number(parsed.amount ?? 0));
      if (!partialAmt || partialAmt <= 0) {
        return NextResponse.json({ ok: false, error: "Indicá un monto válido para el pago parcial." }, { status: 400 });
      }
      const remainingBefore = round2(total - paidBefore);
      if (partialAmt > remainingBefore + EPS) {
        return NextResponse.json(
          { ok: false, error: `El monto supera lo pendiente (${remainingBefore}).` },
          { status: 400 },
        );
      }
      const paidAfter = round2(paidBefore + partialAmt);
      const remAfter = round2(total - paidAfter);
      const entry: PaymentHist = {
        id: randomUUID(),
        paidAt: parsed.paidAt,
        amount: partialAmt,
        kind: "partial",
        ...(noteTrim ? { note: noteTrim } : {}),
      };
      const paid = remAfter <= EPS;
      await invoiceRef.set(
        {
          paidAmount: paidAfter,
          remainingAmount: paid ? 0 : Math.max(0, remAfter),
          status: paid ? "paid" : "partially_paid",
          isPaid: paid,
          paidAt: parsed.paidAt,
          paymentHistory: [...history, entry],
          updatedAt: now,
          updatedByUserId: actor.uid,
        },
        { merge: true },
      );
    } else {
      let resolvedTotal = total;
      let currencyOut = (inv.currency as string | null) ?? null;
      if (resolvedTotal == null) {
        if (parsed.amount == null || parsed.amount <= 0) {
          return NextResponse.json(
            { ok: false, error: "Esta factura no tiene monto. Indicá el monto total cobrado para cerrarla." },
            { status: 400 },
          );
        }
        resolvedTotal = round2(parsed.amount);
        currencyOut = parsed.currency ?? currencyOut ?? "USD";
      }
      const delta = round2(resolvedTotal - paidBefore);
      if (delta <= EPS) {
        return NextResponse.json({ ok: false, error: "Esta factura ya está saldada." }, { status: 400 });
      }
      const paidAfter = round2(paidBefore + delta);
      const entry: PaymentHist = {
        id: randomUUID(),
        paidAt: parsed.paidAt,
        amount: delta,
        kind: "full",
        ...(noteTrim ? { note: noteTrim } : {}),
      };
      await invoiceRef.set(
        {
          amount: resolvedTotal,
          currency: currencyOut,
          paidAmount: paidAfter,
          remainingAmount: 0,
          status: "paid",
          isPaid: true,
          paidAt: parsed.paidAt,
          paymentHistory: [...history, entry],
          updatedAt: now,
          updatedByUserId: actor.uid,
        },
        { merge: true },
      );
    }

    await logClientActivity({
      clientId: id,
      action: "invoice_updated",
      createdByUserId: actor.uid,
      message: "Pago registrado",
      metadata: { invoiceId, kind: parsed.kind },
    });

    await adminDb.collection("clients").doc(id).set({ updatedAt: now }, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
