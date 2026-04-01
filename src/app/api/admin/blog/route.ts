import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { blogPostSchema } from "@/lib/validations/blog";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = blogPostSchema.parse(body);
    if (parsed.status === "published" && !parsed.coverImage) {
      return NextResponse.json(
        { ok: false, error: "Para publicar un post, necesitás cargar una imagen de portada." },
        { status: 400 },
      );
    }
    const normalizedSlug = parsed.slug.trim().toLowerCase();

    const existingSnapshot = await adminDb.collection("blogPosts").get();
    const duplicated = existingSnapshot.docs.some((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return String(data.slug ?? "").trim().toLowerCase() === normalizedSlug;
    });
    if (duplicated) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un post con ese slug. Usá otro slug o editá el existente." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const payload = {
      ...parsed,
      slug: normalizedSlug,
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
