import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { postId?: string; sessionId?: string };
    if (!body.postId || !body.sessionId) {
      return NextResponse.json({ ok: false, reason: "invalid-payload" }, { status: 400 });
    }

    const likeId = `${body.postId}_${body.sessionId}`;
    const likeRef = adminDb.collection("blogLikes").doc(likeId);
    const existing = await likeRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: false, reason: "already-liked" });
    }

    await likeRef.set({
      postId: body.postId,
      sessionId: body.sessionId,
      createdAt: new Date().toISOString(),
    });

    await adminDb
      .collection("blogPosts")
      .doc(body.postId)
      .update({
        likesCount: FieldValue.increment(1),
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, reason: (error as Error).message }, { status: 500 });
  }
}
