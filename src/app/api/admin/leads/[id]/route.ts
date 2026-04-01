import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logAdminActivity } from "@/lib/activity/log";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { leadStatusSchema } from "@/lib/validations/lead";

type Context = { params: Promise<{ id: string }> };

const getActor = async () => {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
};

export async function GET(_request: Request, context: Context) {
  const actor = await getActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const snapshot = await adminDb.collection("leads").doc(id).get();
  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
  }

  const notesSnapshot = await adminDb
    .collection("leads")
    .doc(id)
    .collection("notes")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const notes = notesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json({
    ok: true,
    lead: { id: snapshot.id, ...snapshot.data() },
    notes,
  });
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getActor();
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
