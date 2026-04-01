import { NextResponse } from "next/server";
import { createInvitation } from "@/services/invite.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; role?: "admin" | "editor" | "viewer" };
    if (!body.email || !body.role) {
      return NextResponse.json({ ok: false, error: "Faltan datos de invitación." }, { status: 400 });
    }

    const invite = await createInvitation(body.email, body.role, "system");
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    return NextResponse.json({
      ok: true,
      invitationId: invite.id,
      token: invite.token,
      inviteUrl: `${appUrl}/invite/${invite.token}`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
