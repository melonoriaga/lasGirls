import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { logClientActivity } from "@/lib/clients/activity";
import { clientPatchSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const snapshot = await adminDb.collection("clients").doc(id).get();
  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    client: { id: snapshot.id, ...snapshot.data() },
  });
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = clientPatchSchema.parse(body);

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (parsed.fullName !== undefined) {
      updates.fullName = parsed.fullName.trim();
      updates.displayName = parsed.fullName.trim();
    }
    if (parsed.displayName !== undefined && parsed.fullName === undefined) {
      updates.displayName = parsed.displayName.trim();
      updates.fullName = parsed.displayName.trim();
    }
    if (parsed.email !== undefined) updates.email = parsed.email.trim();
    if (parsed.phone !== undefined) updates.phone = parsed.phone.trim();
    if (parsed.company !== undefined) updates.company = parsed.company.trim();
    if (parsed.brandName !== undefined) updates.brandName = parsed.brandName.trim();
    if (parsed.status !== undefined) updates.status = parsed.status;
    if (parsed.serviceType !== undefined) {
      updates.serviceType = parsed.serviceType;
      updates.servicesContracted = parsed.serviceType;
    }
    if (parsed.onboardingStatus !== undefined) updates.onboardingStatus = parsed.onboardingStatus;
    if (parsed.billingType !== undefined) {
      updates.billingType = parsed.billingType;
      updates.billingModel = parsed.billingType;
    }
    if (parsed.monthlyFee !== undefined) {
      updates.monthlyFee = parsed.monthlyFee;
      updates.pricing = { currency: parsed.currency ?? "USD", amount: parsed.monthlyFee };
    }
    if (parsed.currency !== undefined) updates.currency = parsed.currency;
    if (parsed.invoiceStatus !== undefined) updates.invoiceStatus = parsed.invoiceStatus;
    if (parsed.lastInvoiceSentAt !== undefined) updates.lastInvoiceSentAt = parsed.lastInvoiceSentAt || null;
    if (parsed.lastInvoiceLink !== undefined) updates.lastInvoiceLink = parsed.lastInvoiceLink || null;
    if (parsed.nextInvoiceDate !== undefined) updates.nextInvoiceDate = parsed.nextInvoiceDate;
    if (parsed.accountManagerUserId !== undefined) updates.accountManagerUserId = parsed.accountManagerUserId;
    if (parsed.clientType !== undefined) updates.clientType = parsed.clientType;
    if (parsed.billingFrequency !== undefined) updates.billingFrequency = parsed.billingFrequency;
    if (parsed.health !== undefined) updates.health = parsed.health;
    if (parsed.tags !== undefined) updates.tags = parsed.tags;
    if (parsed.startDate !== undefined) updates.startDate = parsed.startDate;
    if (parsed.endDate !== undefined) updates.endDate = parsed.endDate;

    await adminDb.collection("clients").doc(id).set(updates, { merge: true });

    await logClientActivity({
      clientId: id,
      action: "client_updated",
      createdByUserId: actor.uid,
      message: "Cliente actualizado",
      metadata: { fields: Object.keys(updates) },
    });

    await logAdminActivity({
      request,
      action: "client_updated",
      targetType: "client",
      targetId: id,
      metadata: { fields: Object.keys(updates) },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
