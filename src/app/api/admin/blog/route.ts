import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { blogPostSchema } from "@/lib/validations/blog";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = blogPostSchema.parse(body);
    const now = new Date().toISOString();
    const payload = {
      ...parsed,
      authorId: "admin",
      authorName: "Las Girls+",
      likesCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: parsed.status === "published" ? now : "",
      readingTime: Math.max(1, Math.ceil(parsed.contentMarkdown.split(" ").length / 220)),
    };
    const ref = await adminDb.collection("blogPosts").add(payload);
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
