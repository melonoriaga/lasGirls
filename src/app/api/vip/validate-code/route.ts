import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { validateCodeBodySchema } from "@/lib/validations/vip-public";
import { isValidVipCodePattern, normalizeVipCode } from "@/lib/vip/normalize-code";
import { isVipCodeUsable } from "@/lib/vip/code-doc";

const GENERIC_INVALID = "Ese código no está disponible. Revisalo o pedinos uno nuevo.";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = validateCodeBodySchema.parse(json);
    const codeId = normalizeVipCode(parsed.code);

    if (!isValidVipCodePattern(codeId)) {
      return NextResponse.json({ ok: false, error: GENERIC_INVALID }, { status: 400 });
    }

    const snap = await adminDb.collection("vip_codes").doc(codeId).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: GENERIC_INVALID }, { status: 400 });
    }

    const data = snap.data() as Record<string, unknown>;
    const usable = isVipCodeUsable({
      active: Boolean(data.active),
      maxUses: Number(data.maxUses ?? 0),
      usedCount: Number(data.usedCount ?? 0),
      expiresAt: String(data.expiresAt ?? ""),
    });

    if (!usable) {
      return NextResponse.json({ ok: false, error: GENERIC_INVALID }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: GENERIC_INVALID }, { status: 400 });
  }
}
