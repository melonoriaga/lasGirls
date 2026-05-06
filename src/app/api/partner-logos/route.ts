import { NextResponse } from "next/server";
import { getPublicPartnerLogos } from "@/lib/partner-logos/public";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getPublicPartnerLogos();
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[GET /api/partner-logos]", error);
    return NextResponse.json({ ok: false, error: "No se pudieron cargar los logos." }, { status: 500 });
  }
}
