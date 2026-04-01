import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { leadStatusSchema } from "@/lib/validations/lead";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status: string };
    const status = leadStatusSchema.parse(body.status);
    await adminDb.collection("leads").doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
