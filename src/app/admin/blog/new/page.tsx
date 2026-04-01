"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AdminBlogNewPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const router = useRouter();

  const save = async () => {
    await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        excerpt,
        contentMarkdown,
        category: "General",
        tags: [],
        status: "draft",
      }),
    });
    router.push("/admin/blog");
    router.refresh();
  };

  return (
    <section className="grid gap-3">
      <h1 className="font-display text-5xl uppercase">Nuevo post</h1>
      <input className="field" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="field" placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <textarea className="field" placeholder="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
      <textarea
        className="field min-h-64"
        placeholder="Markdown"
        value={contentMarkdown}
        onChange={(e) => setContentMarkdown(e.target.value)}
      />
      <Button type="button" onClick={save}>
        Guardar draft
      </Button>
    </section>
  );
}
