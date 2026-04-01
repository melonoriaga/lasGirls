import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LikeButton } from "@/components/blog/like-button";
import { seedPosts } from "@/content/blog/seed-posts";
import { buildMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = seedPosts.find((item) => item.slug === slug);
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
  const post = seedPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <section className="section-shell">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-zinc-600">{post.category}</p>
        <h1 className="mt-2 font-display text-5xl uppercase md:text-7xl">{post.title}</h1>
        <p className="mt-4 text-zinc-700">{post.excerpt}</p>
        <div className="prose prose-zinc mt-8 max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMarkdown}</ReactMarkdown>
        </div>
        <div className="mt-8">
          <LikeButton postId={post.id} initialLikes={post.likesCount} />
        </div>
      </article>
    </section>
  );
}
