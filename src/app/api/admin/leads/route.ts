import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionActor } from "@/lib/api/admin-session";
import { logAdminActivity } from "@/lib/activity/log";

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  company: z.string().optional().default(""),
  inquiryType: z.string().optional().default("consulta_general"),
  serviceInterest: z.array(z.string()).optional().default([]),
  budgetRange: z.string().optional().default(""),
  projectStage: z.string().optional().default("solo_idea"),
  message: z.string().min(2),
  source: z.string().optional().default("admin-manual"),
  preferredContactMethod: z.string().optional().default("email"),
  assignedTo: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = schema.parse(body);
    const now = new Date().toISOString();

    const ref = await adminDb.collection("leads").add({
      ...parsed,
      status: "new",
      budgetStatus: "not_sent",
      assignedTo: parsed.assignedTo,
      assignedToUserId: "",
      tags: parsed.tags,
      missingDocuments: [],
      internalNotes: "",
      convertedToClientId: "",
      currency: "USD",
      metadata: {
        source: "admin-manual",
      },
      createdAt: now,
      updatedAt: now,
      createdBy: actor.uid,
    });

    await logAdminActivity({
      request,
      action: "lead_created_manual",
      targetType: "lead",
      targetId: ref.id,
      metadata: { email: parsed.email, inquiryType: parsed.inquiryType },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true, leadId: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
