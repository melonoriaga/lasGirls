import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { discountInterestBodySchema } from "@/lib/validations/vip-public";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let parsed;
    try {
      parsed = discountInterestBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const msg = e.issues[0]?.message ?? "Revisá los datos.";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
      throw e;
    }
    const now = new Date().toISOString();

    await adminDb.collection("leads").add({
      fullName: parsed.fullName,
      email: parsed.email,
      phone: parsed.phone,
      company: "",
      inquiryType: "cotizar_servicio",
      serviceInterest: [],
      budgetRange: "",
      projectStage: "solo_idea",
      message:
        "Lead VIP — quiere recibir su código de descuento. Contactar para enviar beneficio.",
      source: "vip-quiero-codigo",
      preferredContactMethod: "whatsapp",
      status: "new",
      budgetStatus: "not_sent",
      assignedTo: "",
      assignedToUserId: "",
      missingDocuments: [],
      internalNotes: "",
      tags: ["vip", "vip-descuento"],
      currency: "USD",
      createdAt: now,
      updatedAt: now,
      visibilityScope: "team",
      ownerUserId: "",
      vipChannel: "discount_interest",
      metadata: {
        userAgent: request.headers.get("user-agent") ?? "",
        landingPage: request.headers.get("referer") ?? "",
        referrer: request.headers.get("referer") ?? "",
        locale: request.headers.get("accept-language") ?? "",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No pudimos guardar tu pedido.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
