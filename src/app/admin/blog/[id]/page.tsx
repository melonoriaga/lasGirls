import { adminDb } from "@/lib/firebase/admin";

type Props = { params: Promise<{ id: string }> };

export default async function AdminBlogDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = await adminDb.collection("blogPosts").doc(id).get();
  if (!snapshot.exists) return <p>Post no encontrado.</p>;
  const post = snapshot.data() as Record<string, string>;

  return (
    <section className="grid gap-3">
      <h1 className="font-display text-5xl uppercase">Editar post</h1>
      <p className="text-sm">Título: {post.title}</p>
      <p className="text-sm">Slug: {post.slug}</p>
      <p className="text-sm">Estado: {post.status}</p>
      <p className="text-sm text-zinc-700">
        Edición completa preparada para continuar con formularios de actualización y preview.
      </p>
    </section>
  );
}
