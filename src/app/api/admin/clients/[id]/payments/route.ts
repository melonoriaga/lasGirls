import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientPaymentCreateSchema } from "@/lib/validations/pipeline";

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

    return NextResponse.json({ ok: true, paymentId: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
