import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { leadBudgetCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

const budgetStatusFromRecord = (status: string) => {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "awaiting_response" || status === "client_review") return "awaiting_response";
  if (status === "sent") return "sent";
  if (status === "needs_changes") return "needs_changes";
  return "not_sent";
};

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const snap = await adminDb
    .collection("leads")
    .doc(id)
    .collection("budgets")
    .orderBy("sentAt", "desc")
    .limit(100)
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
    const leadRef = adminDb.collection("leads").doc(id);
    const leadSnap = await leadRef.get();
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = leadBudgetCreateSchema.parse(body);
    const now = new Date().toISOString();
    const sentAt = parsed.sentAt ?? now;
    const title = (parsed.title ?? "").trim() || "Presupuesto";

    await leadRef.collection("budgets").add({
      title,
      link: parsed.link,
      amount: parsed.amount ?? null,
      currency: parsed.currency,
      sentAt,
      status: parsed.status,
      notes: parsed.notes ?? "",
      createdByUserId: actor.uid,
      createdAt: now,
      updatedAt: now,
    });

    const nextBudgetStatus = budgetStatusFromRecord(parsed.status);
    await leadRef.set(
      {
        latestBudgetLink: parsed.link,
        latestBudgetSentAt: sentAt,
        latestBudgetAmount: parsed.amount ?? null,
        currency: parsed.currency,
        budgetStatus: nextBudgetStatus,
        updatedAt: now,
      },
      { merge: true },
    );

    await logAdminActivity({
      request,
      action: "lead_budget_added",
      targetType: "lead",
      targetId: id,
      metadata: { title, status: parsed.status },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
