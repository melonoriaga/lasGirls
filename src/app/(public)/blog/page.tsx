import type { Metadata } from "next";
import Link from "next/link";
import { seedPosts } from "@/content/blog/seed-posts";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Blog | Las Girls+",
  description: "Ideas y aprendizajes sobre estrategia, branding, producto, contenido y desarrollo.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">Blog</h1>
        <p className="mt-4 max-w-3xl text-zinc-700">
          Notas internas, aprendizajes de proyectos y decisiones estratégicas explicadas sin humo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {seedPosts.map((post) => (
            <article key={post.id} className="border border-black bg-white p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{post.category}</p>
              <h2 className="mt-2 font-display text-3xl uppercase">{post.title}</h2>
              <p className="mt-3 text-sm text-zinc-700">{post.excerpt}</p>
              <div className="mt-4 flex gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="border border-black px-2 py-1 text-xs uppercase">
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/blog/${post.slug}`} className="mt-5 inline-block text-sm underline">
                Leer nota
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
