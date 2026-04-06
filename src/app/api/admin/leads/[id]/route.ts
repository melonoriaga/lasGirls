import type { CollectionReference } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity/log";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { budgetStatusSchema } from "@/lib/validations/pipeline";
import { leadStatusSchema } from "@/lib/validations/lead";

type Context = { params: Promise<{ id: string }> };

const BATCH = 400;

async function deleteQueryInBatches(collectionRef: CollectionReference) {
  while (true) {
    const snap = await collectionRef.limit(BATCH).get();
    if (snap.empty) break;
    const batch = adminDb.batch();
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
}

export async function DELETE(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const leadRef = adminDb.collection("leads").doc(id);
  const snapshot = await leadRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
  }

  const data = snapshot.data() as { fullName?: string; email?: string };

  try {
    await deleteQueryInBatches(leadRef.collection("notes"));
    await deleteQueryInBatches(leadRef.collection("budgets"));
    await leadRef.delete();

    await logAdminActivity({
      request,
      action: "lead_deleted",
      targetType: "lead",
      targetId: id,
      metadata: { fullName: data.fullName ?? "", email: data.email ?? "" },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el lead.";
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "No se pudo eliminar el lead." },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const snapshot = await adminDb.collection("leads").doc(id).get();
  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
  }

  const [notesSnapshot, budgetsSnapshot] = await Promise.all([
    adminDb
      .collection("leads")
      .doc(id)
      .collection("notes")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get(),
    adminDb
      .collection("leads")
      .doc(id)
      .collection("budgets")
      .orderBy("sentAt", "desc")
      .limit(100)
      .get(),
  ]);
  const notes = notesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const budgets = budgetsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({
    ok: true,
    lead: { id: snapshot.id, ...snapshot.data() },
    notes,
    budgets,
  });
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (typeof body.fullName === "string") updates.fullName = body.fullName.trim();
    if (typeof body.email === "string") updates.email = body.email.trim();
    if (typeof body.phone === "string") updates.phone = body.phone.trim();
    if (typeof body.company === "string") updates.company = body.company.trim();
    if (typeof body.inquiryType === "string") updates.inquiryType = body.inquiryType.trim();
    if (typeof body.projectStage === "string") updates.projectStage = body.projectStage.trim();
    if (typeof body.source === "string") updates.source = body.source.trim();
    if (typeof body.preferredContactMethod === "string")
      updates.preferredContactMethod = body.preferredContactMethod.trim();
    if (typeof body.budgetRange === "string") updates.budgetRange = body.budgetRange.trim();
    if (typeof body.message === "string") updates.message = body.message.trim();
    if (typeof body.assignedTo === "string") updates.assignedTo = body.assignedTo.trim();
    if (typeof body.assignedToUserId === "string") updates.assignedToUserId = body.assignedToUserId.trim();
    if (typeof body.internalNotes === "string") updates.internalNotes = body.internalNotes;
    if (typeof body.latestBudgetLink === "string") updates.latestBudgetLink = body.latestBudgetLink.trim();
    if (typeof body.latestBudgetSentAt === "string") updates.latestBudgetSentAt = body.latestBudgetSentAt.trim();
    if (typeof body.latestBudgetAmount === "number") updates.latestBudgetAmount = body.latestBudgetAmount;
    if (typeof body.currency === "string") updates.currency = body.currency.trim();
    if (typeof body.budgetStatus === "string") updates.budgetStatus = budgetStatusSchema.parse(body.budgetStatus);
    if (Array.isArray(body.missingDocuments))
      updates.missingDocuments = body.missingDocuments.filter((item) => typeof item === "string");
    if (Array.isArray(body.tags)) updates.tags = body.tags.filter((tag) => typeof tag === "string");
    if (Array.isArray(body.serviceInterest))
      updates.serviceInterest = body.serviceInterest.filter((item) => typeof item === "string");
    if (typeof body.status === "string") updates.status = leadStatusSchema.parse(body.status);

    await adminDb.collection("leads").doc(id).set(updates, { merge: true });
    await logAdminActivity({
      request,
      action: "lead_updated",
      targetType: "lead",
      targetId: id,
      metadata: { updatedFields: Object.keys(updates) },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
