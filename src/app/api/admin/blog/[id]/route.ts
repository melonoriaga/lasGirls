import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { blogPostSchema } from "@/lib/validations/blog";
import { logAdminActivity } from "@/lib/activity/log";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    const snapshot = await adminDb.collection("blogPosts").doc(id).get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, error: "Post no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, post: { id: snapshot.id, ...snapshot.data() } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = blogPostSchema.parse(body);
    if (parsed.status === "published" && !parsed.coverImage) {
      return NextResponse.json(
        { ok: false, error: "Para publicar un post, necesitás cargar una imagen de portada." },
        { status: 400 },
      );
    }
    const now = new Date().toISOString();
    const updatePayload = {
      ...parsed,
      updatedAt: now,
      publishedAt: parsed.status === "published" ? now : "",
      readingTime: Math.max(1, Math.ceil(parsed.contentMarkdown.split(/\s+/).length / 220)),
    };

    await adminDb.collection("blogPosts").doc(id).set(updatePayload, { merge: true });
    await logAdminActivity({
      request,
      action: "blog_post_updated",
      targetType: "blogPost",
      targetId: id,
      metadata: { status: parsed.status, slug: parsed.slug },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const docRef = adminDb.collection("blogPosts").doc(id);
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ ok: false, error: "Post no encontrado." }, { status: 404 });
    }
    const post = snapshot.data() as Record<string, unknown>;
    await docRef.delete();

    await logAdminActivity({
      request,
      action: "blog_post_deleted",
      targetType: "blogPost",
      targetId: id,
      metadata: { slug: String(post.slug ?? "") },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
