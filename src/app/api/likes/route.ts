import { NextResponse } from "next/server";
import { registerPostLike } from "@/services/blog.service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { postId?: string; sessionId?: string };
    if (!body.postId || !body.sessionId) {
      return NextResponse.json({ ok: false, reason: "invalid-payload" }, { status: 400 });
    }

    const result = await registerPostLike(body.postId, body.sessionId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ ok: false, reason: (error as Error).message }, { status: 500 });
  }
}
