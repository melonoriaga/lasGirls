import Link from "next/link";
import Image from "next/image";
import { adminDb } from "@/lib/firebase/admin";
import { BlogStatusActions } from "@/components/admin/blog-status-actions";
import { BlogDeleteButton } from "@/components/admin/blog-delete-button";

type AdminBlogRow = {
  id: string;
  title?: string;
  status?: "draft" | "published" | "archived";
  slug?: string;
  updatedAt?: string;
  publishedAt?: string;
  excerpt?: string;
  coverImage?: string;
};

const statusStyles: Record<NonNullable<AdminBlogRow["status"]>, string> = {
  draft: "border-zinc-300 bg-zinc-100 text-zinc-700",
  published: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
  archived: "border-rose-200 bg-rose-50 text-rose-800",
};

const statusLabel: Record<NonNullable<AdminBlogRow["status"]>, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Archivado",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default async function AdminBlogPage() {
  const snapshot = await adminDb.collection("blogPosts").orderBy("createdAt", "desc").get();
  const posts = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as AdminBlogRow[];
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Blog CMS</h1>
        <Link
          href="/admin/blog/new"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Nuevo post
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        Publicados: <span className="font-semibold">{publishedCount}</span> · Borradores:{" "}
        <span className="font-semibold">{draftCount}</span>
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {posts.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600 md:col-span-2">
            No hay posts todavía. Creá tu primer borrador desde &quot;Nuevo post&quot;.
          </article>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="relative h-44 w-full bg-zinc-100">
                {post.coverImage ? (
                  <Image src={post.coverImage} alt={post.title ?? "Portada del post"} fill className="object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs uppercase tracking-[0.12em] text-zinc-500">
                    Sin portada
                  </div>
                )}
              </div>
              <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    statusStyles[post.status ?? "draft"]
                  }`}
                >
                  {statusLabel[post.status ?? "draft"]}
                </span>
                <span className="text-xs text-zinc-600">
                  Visible en sitio público:{" "}
                  <strong>{post.status === "published" ? "Sí" : "No"}</strong>
                </span>
              </div>
              <h2 className="mt-2 font-semibold text-zinc-900">{post.title ?? "Sin título"}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{post.excerpt ?? "Sin resumen."}</p>
              <p className="mt-1 text-xs text-zinc-600">/{post.slug ?? "sin-slug"}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Publicado: {formatDate(post.publishedAt)} · Última edición: {formatDate(post.updatedAt)}
              </p>
              <Link
                href={`/admin/blog/${post.id}`}
                className="mt-2 inline-block text-sm font-medium text-[#db2777] hover:underline"
              >
                Editar
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <BlogStatusActions postId={post.id} status={post.status ?? "draft"} className="mt-0" />
                <BlogDeleteButton postId={post.id} compact />
              </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
