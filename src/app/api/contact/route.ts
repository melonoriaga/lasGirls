import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { leadSchema } from "@/lib/validations/lead";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.parse(body);
    const now = new Date().toISOString();

    await adminDb.collection("leads").add({
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      company: parsed.company ?? "",
      inquiryType: parsed.inquiryType,
      serviceInterest: parsed.serviceInterest ?? [],
      budgetRange: parsed.budgetRange ?? "",
      projectStage: parsed.projectStage,
      message: parsed.message,
      source: parsed.source,
      preferredContactMethod: parsed.preferredContactMethod,
      status: "new",
      budgetStatus: "not_sent",
      assignedTo: "",
      assignedToUserId: "",
      missingDocuments: [],
      internalNotes: "",
      tags: [],
      currency: "USD",
      createdAt: now,
      updatedAt: now,
      metadata: {
        userAgent: request.headers.get("user-agent") ?? "",
        landingPage: request.headers.get("referer") ?? "",
        referrer: request.headers.get("referer") ?? "",
        locale: request.headers.get("accept-language") ?? "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
