import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";

export default async function AdminBlogPage() {
  const snapshot = await adminDb.collection("blogPosts").orderBy("createdAt", "desc").get();
  const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<
    Record<string, string>
  >;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-5xl uppercase">Blog CMS</h1>
        <Link href="/admin/blog/new" className="border border-black px-4 py-2 text-sm">
          Nuevo post
        </Link>
      </div>
      <div className="mt-6 grid gap-3">
        {posts.map((post) => (
          <article key={post.id} className="border border-black bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{post.status}</p>
            <h2 className="font-semibold">{post.title}</h2>
            <Link href={`/admin/blog/${post.id}`} className="text-sm underline">
              Editar
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
