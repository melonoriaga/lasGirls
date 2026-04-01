import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LikeButton } from "@/components/blog/like-button";
import { adminDb } from "@/lib/firebase/admin";
import { seedPosts } from "@/content/blog/seed-posts";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await adminDb.collection("blogPosts").get();
  const fromDb = snapshot.docs.find((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return String(data.slug ?? "") === slug;
  });
  const post = snapshot.empty
    ? seedPosts.find((item) => item.slug === slug)
    : (() => {
        if (!fromDb) return null;
        const data = fromDb.data() as Record<string, unknown>;
        if (String(data.status ?? "") !== "published") return null;
        return {
          title: String(data.title ?? ""),
          excerpt: String(data.excerpt ?? ""),
          seoTitle: String(data.seoTitle ?? ""),
          seoDescription: String(data.seoDescription ?? ""),
        };
      })();
  if (!post) {
    return buildMetadata({
      title: "Post no encontrado | Las Girls+",
      description: "El artículo no está disponible.",
      path: `/blog/${slug}`,
    });
  }
  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const snapshot = await adminDb.collection("blogPosts").get();
  const fromDb = snapshot.docs.find((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return String(data.slug ?? "") === slug;
  });

  const post = snapshot.empty || !fromDb
    ? seedPosts.find((item) => item.slug === slug)
    : (() => {
        const doc = fromDb;
        const data = doc.data() as Record<string, unknown>;
        if (String(data.status ?? "") !== "published") return null;
        return {
          id: doc.id,
          title: String(data.title ?? ""),
          excerpt: String(data.excerpt ?? ""),
          category: String(data.category ?? "General"),
          contentMarkdown: String(data.contentMarkdown ?? ""),
          coverImage: String(data.coverImage ?? ""),
          likesCount: Number(data.likesCount ?? 0),
        };
      })();
  if (!post) notFound();

  return (
    <section className="relative overflow-hidden bg-[#f4ede6] px-4 py-16 md:px-10 md:py-20">
      <div className="mx-auto mb-4 flex max-w-4xl items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
        <Link href="/" className="hover:text-[#db2777]">
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-[#db2777]">
          Blog
        </Link>
        <span>/</span>
        <span className="truncate text-zinc-700">{post.title}</span>
      </div>
      <article className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{post.category}</p>
        <h1 className="mt-3 text-balance text-4xl font-semibold leading-[0.95] tracking-tight text-zinc-900 md:text-6xl">
          {post.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-600">{post.excerpt}</p>
        {post.coverImage ? (
          <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 md:h-96">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        ) : null}
        <div className="blog-markdown mt-10">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMarkdown}</ReactMarkdown>
        </div>
        <div className="mt-8">
          <LikeButton postId={post.id} initialLikes={post.likesCount} />
        </div>
      </article>
    </section>
  );
}
