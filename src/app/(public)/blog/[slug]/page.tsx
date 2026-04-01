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
    <section className="brutal-section relative overflow-hidden border-y-2 border-black bg-[#f4ede6] px-4 py-20 md:px-10">
      <article className="mx-auto max-w-4xl border-2 border-black bg-white/75 p-6 md:p-10">
        <p className="text-xs uppercase tracking-widest text-black/60">{post.category}</p>
        <h1 className="mt-2 font-display text-[12vw] uppercase leading-[0.84] text-black md:text-[6rem]">{post.title}</h1>
        <p className="mt-4 text-black/75">{post.excerpt}</p>
        <div className="prose prose-zinc mt-8 max-w-none prose-headings:font-display prose-headings:uppercase prose-a:text-[#ff2f9d]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.contentMarkdown}</ReactMarkdown>
        </div>
        <div className="mt-8">
          <LikeButton postId={post.id} initialLikes={post.likesCount} />
        </div>
      </article>
    </section>
  );
}
