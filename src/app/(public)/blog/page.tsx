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
    <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#f4ede6] px-4 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex bg-black px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#f4ede6]">blog</p>
        <h1 className="mt-6 font-display text-[15vw] uppercase leading-[0.84] text-black md:text-[8rem]">Blog</h1>
        <p className="mt-4 max-w-3xl text-black/75">
          Notas internas, aprendizajes de proyectos y decisiones estratégicas explicadas sin humo.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {seedPosts.map((post) => (
            <article key={post.id} className="border-2 border-black bg-[#ffe3f0] p-6">
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
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
