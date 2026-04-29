import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { redeemVipBodySchema } from "@/lib/validations/vip-public";
import { isValidVipCodePattern, normalizeVipCode } from "@/lib/vip/normalize-code";
import { isVipCodeUsable } from "@/lib/vip/code-doc";

const GENERIC_INVALID = "Ese código no está disponible o ya fue usado.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let parsed;
    try {
      parsed = redeemVipBodySchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const msg = e.issues[0]?.message ?? "Revisá los datos.";
        return NextResponse.json({ ok: false, error: msg }, { status: 400 });
      }
      throw e;
    }
    const codeId = normalizeVipCode(parsed.code);

    if (!isValidVipCodePattern(codeId)) {
      return NextResponse.json({ ok: false, error: GENERIC_INVALID }, { status: 400 });
    }

    const codeRef = adminDb.collection("vip_codes").doc(codeId);
    const now = new Date().toISOString();

    await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(codeRef);
      if (!snap.exists) throw new Error(GENERIC_INVALID);

      const raw = snap.data() as Record<string, unknown>;
      const usable = isVipCodeUsable({
        active: Boolean(raw.active),
        maxUses: Number(raw.maxUses ?? 0),
        usedCount: Number(raw.usedCount ?? 0),
        expiresAt: String(raw.expiresAt ?? ""),
      });
      if (!usable) throw new Error(GENERIC_INVALID);

      const leadRef = adminDb.collection("leads").doc();
      tx.set(leadRef, {
        fullName: parsed.fullName,
        email: parsed.email,
        phone: parsed.phone,
        company: "",
        inquiryType: "cotizar_servicio",
        serviceInterest: [],
        budgetRange: "",
        projectStage: "empezando",
        message: parsed.message,
        source: "vip-canje-codigo",
        preferredContactMethod: "whatsapp",
        status: "new",
        budgetStatus: "not_sent",
        assignedTo: "",
        assignedToUserId: "",
        missingDocuments: [],
        internalNotes: "",
        tags: ["vip", "vip-canje"],
        currency: "USD",
        createdAt: now,
        updatedAt: now,
        visibilityScope: "team",
        ownerUserId: "",
        vipChannel: "code_redeem",
        vipCode: codeId,
        metadata: {
          userAgent: request.headers.get("user-agent") ?? "",
          landingPage: request.headers.get("referer") ?? "",
          referrer: request.headers.get("referer") ?? "",
          locale: request.headers.get("accept-language") ?? "",
        },
      });

      tx.update(codeRef, {
        usedCount: FieldValue.increment(1),
        updatedAt: now,
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : GENERIC_INVALID;
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
