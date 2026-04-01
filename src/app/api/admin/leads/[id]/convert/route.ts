import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const leadRef = adminDb.collection("leads").doc(id);
    const leadSnapshot = await leadRef.get();
    if (!leadSnapshot.exists) {
      return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
    }

    const lead = leadSnapshot.data() as Record<string, unknown>;
    const now = new Date().toISOString();
    const clientRef = await adminDb.collection("clients").add({
      originLeadId: id,
      displayName: lead.fullName ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      status: "active",
      assignedTeam: lead.assignedTo ? [lead.assignedTo] : [],
      servicesContracted: lead.serviceInterest ?? [],
      billingModel: "hybrid",
      contractSigned: false,
      invoicingRequired: false,
      paymentStatus: "pending",
      pricing: { currency: "USD", amount: 0 },
      documents: [],
      createdAt: now,
      updatedAt: now,
    });

    await leadRef.update({
      status: "converted",
      convertedToClientId: clientRef.id,
      updatedAt: now,
    });
    await logAdminActivity({
      request,
      action: "lead_converted",
      targetType: "lead",
      targetId: id,
      metadata: { clientId: clientRef.id },
    });

    return NextResponse.json({ ok: true, clientId: clientRef.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
