import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { adminDb } from "@/lib/firebase/admin";
import { seedPosts } from "@/content/blog/seed-posts";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Blog | Las Girls+",
  description: "Ideas y aprendizajes sobre estrategia, branding, producto, contenido y desarrollo.",
  path: "/blog",
});

type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverImage?: string;
};

const getPosts = async (): Promise<PublicPost[]> => {
  const snapshot = await adminDb.collection("blogPosts").get();
  if (snapshot.empty) {
    return seedPosts.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
        coverImage: post.coverImage,
    }));
  }

  const posts = snapshot.docs
    .map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        slug: String(data.slug ?? ""),
        title: String(data.title ?? ""),
        excerpt: String(data.excerpt ?? ""),
        category: String(data.category ?? "General"),
        tags: Array.isArray(data.tags) ? data.tags.map((tag) => String(tag)) : [],
        coverImage: String(data.coverImage ?? ""),
        publishedAt: String(data.publishedAt ?? ""),
        status: String(data.status ?? "draft"),
      };
    })
    .filter((item) => item.status === "published")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return posts;
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#f4ede6] px-4 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex bg-black px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#f4ede6]">blog</p>
        <h1 className="mt-6 font-display text-[15vw] uppercase leading-[0.84] text-black md:text-[8rem]">Blog</h1>
        <p className="mt-4 max-w-3xl text-black/75">
          Notas internas, aprendizajes de proyectos y decisiones estratégicas explicadas sin humo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {posts.length === 0 ? (
            <article className="border-2 border-dashed border-black bg-white/80 p-8 text-center text-sm text-zinc-600 md:col-span-2">
              No hay artículos publicados por ahora.
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="overflow-hidden border-2 border-black bg-[#ffe3f0]">
                <div className="relative h-52 w-full border-b-2 border-black bg-[#ffd4e9]">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs uppercase tracking-[0.12em] text-black/60">
                      Sin portada
                    </div>
                  )}
                </div>
                <div className="p-6">
                <p className="text-xs uppercase tracking-wider text-black/65">{post.category}</p>
                <h2 className="mt-2 font-display text-3xl uppercase">{post.title}</h2>
                <p className="mt-3 text-sm text-black/80">{post.excerpt}</p>
                <div className="mt-4 flex gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="border border-black px-2 py-1 text-xs uppercase bg-white/70">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.slug}`} className="mt-5 inline-block text-sm uppercase tracking-[0.08em] text-[#ff2f9d] underline">
                  Leer nota
                </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
