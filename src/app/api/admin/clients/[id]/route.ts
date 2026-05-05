import type { CollectionReference } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { firestoreDocToJson } from "@/lib/firestore/json-safe";
import { logClientActivity } from "@/lib/clients/activity";
import { clientPatchSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

const BATCH = 400;

const CLIENT_SUBCOLLECTIONS = ["notes", "links", "invoices", "payments", "activity", "tasks"] as const;

async function deleteCollectionInBatches(collectionRef: CollectionReference) {
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

export async function GET(_request: Request, context: Context) {
  try {
    const actor = await getSessionActor();
    if (!actor?.uid) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    const { id } = await context.params;
    const snapshot = await adminDb.collection("clients").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
    }
    if (!canAccessRecord(snapshot.data() ?? {}, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      client: firestoreDocToJson(snapshot.id, snapshot.data()),
    });
  } catch (error) {
    console.error("[GET /api/admin/clients/[id]]", error);
    const message = error instanceof Error ? error.message : "Error interno.";
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "No se pudo cargar el cliente." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const snapshot = await adminDb.collection("clients").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
    }
    if (!canAccessRecord(snapshot.data() ?? {}, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
    }
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
    if (parsed.emails !== undefined) updates.emails = parsed.emails;
    if (parsed.phones !== undefined) updates.phones = parsed.phones;
    if (parsed.contacts !== undefined) updates.contacts = parsed.contacts;
    if (parsed.internalNotes !== undefined) updates.internalNotes = parsed.internalNotes;
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

export async function DELETE(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const clientRef = adminDb.collection("clients").doc(id);
  const snapshot = await clientRef.get();
  if (!snapshot.exists) {
    return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  }
  if (!canAccessRecord(snapshot.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const data = snapshot.data() as { fullName?: string; displayName?: string; email?: string };

  try {
    for (const name of CLIENT_SUBCOLLECTIONS) {
      await deleteCollectionInBatches(clientRef.collection(name));
    }
    await clientRef.delete();

    await logAdminActivity({
      request,
      action: "client_deleted",
      targetType: "client",
      targetId: id,
      metadata: {
        fullName: data.fullName ?? data.displayName ?? "",
        email: data.email ?? "",
      },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el cliente.";
    return NextResponse.json(
      { ok: false, error: process.env.NODE_ENV === "development" ? message : "No se pudo eliminar el cliente." },
      { status: 500 },
    );
  }
}
