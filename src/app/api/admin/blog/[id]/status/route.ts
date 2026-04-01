import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { logAdminActivity } from "@/lib/activity/log";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(["draft", "published", "archived"]),
});

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = schema.parse(body);
    const now = new Date().toISOString();

    await adminDb.collection("blogPosts").doc(id).set(
      {
        status,
        updatedAt: now,
        publishedAt: status === "published" ? now : "",
      },
      { merge: true },
    );

    await logAdminActivity({
      request,
      action: "blog_status_updated",
      targetType: "blogPost",
      targetId: id,
      metadata: { status },
    });

    revalidatePath("/blog");
    revalidatePath(`/blog/${id}`);
    revalidatePath("/admin/blog");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
