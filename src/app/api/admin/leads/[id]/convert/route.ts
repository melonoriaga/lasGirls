import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord, readVisibilityScope } from "@/lib/admin/record-visibility";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { logClientActivity } from "@/lib/clients/activity";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    let force = false;
    try {
      const body = (await request.json()) as { force?: boolean };
      force = Boolean(body?.force);
    } catch {
      force = false;
    }

    const leadRef = adminDb.collection("leads").doc(id);
    const leadSnapshot = await leadRef.get();
    if (!leadSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
    }

    const lead = leadSnapshot.data() as Record<string, unknown>;
    if (!canAccessRecord(lead, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para este lead." }, { status: 403 });
    }
    const currentStatus = String(lead.status ?? "new");
    if (currentStatus === "converted" && lead.convertedToClientId) {
      return NextResponse.json(
        { ok: false, error: "Este lead ya fue convertido.", clientId: lead.convertedToClientId },
        { status: 400 },
      );
    }

    if (currentStatus !== "approved" && !force) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Solo podés convertir leads en estado «approved», o reintentá confirmando forzar conversión desde el panel.",
          code: "NOT_APPROVED",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const fullName = String(lead.fullName ?? "").trim() || "Cliente";
    const email = String(lead.email ?? "").trim();
    if (!email) {
      return NextResponse.json({ ok: false, error: "El lead no tiene email." }, { status: 400 });
    }

    const serviceInterest = Array.isArray(lead.serviceInterest)
      ? (lead.serviceInterest as string[])
      : [];
    const tags = Array.isArray(lead.tags) ? (lead.tags as string[]) : [];

    const visibilityScope = readVisibilityScope(lead);
    const ownerUserId =
      visibilityScope === "private"
        ? String(lead.ownerUserId ?? lead.createdBy ?? actor.uid)
        : "";

    const clientRef = await adminDb.collection("clients").add({
      leadId: id,
      originLeadId: id,
      fullName,
      displayName: fullName,
      email,
      phone: String(lead.phone ?? ""),
      company: String(lead.company ?? ""),
      brandName: String(lead.company ?? ""),
      status: "pending_onboarding",
      serviceType: serviceInterest,
      servicesContracted: serviceInterest,
      onboardingStatus: "pending",
      billingType: "monthly",
      billingModel: "monthly_retainer",
      monthlyFee: typeof lead.latestBudgetAmount === "number" ? lead.latestBudgetAmount : 0,
      currency: String(lead.currency ?? "USD"),
      invoiceStatus: "not_sent",
      lastInvoiceSentAt: null,
      lastInvoiceLink: null,
      paymentStatus: "pending",
      pricing: {
        currency: String(lead.currency ?? "USD"),
        amount: typeof lead.latestBudgetAmount === "number" ? lead.latestBudgetAmount : 0,
      },
      contractSigned: false,
      invoicingRequired: true,
      assignedTeam: lead.assignedToUserId ? [String(lead.assignedToUserId)] : [],
      accountManagerUserId: String(lead.assignedToUserId ?? ""),
      clientType: "recurring",
      billingFrequency: "monthly",
      health: "healthy",
      tags,
      documents: [],
      usefulLinksCount: 0,
      notesCount: 0,
      invoicesCount: 0,
      paymentsCount: 0,
      createdAt: now,
      updatedAt: now,
      createdByUserId: actor.uid,
      visibilityScope,
      ownerUserId,
    });

    await leadRef.set(
      {
        status: "converted",
        convertedToClientId: clientRef.id,
        updatedAt: now,
      },
      { merge: true },
    );

    await logClientActivity({
      clientId: clientRef.id,
      action: "client_created",
      createdByUserId: actor.uid,
      message: "Cliente creado desde lead",
      metadata: { leadId: id, force },
    });

    await logAdminActivity({
      request,
      action: "lead_converted",
      targetType: "lead",
      targetId: id,
      metadata: { clientId: clientRef.id },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true, clientId: clientRef.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
