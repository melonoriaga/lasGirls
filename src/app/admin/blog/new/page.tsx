"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-300 focus:ring-rose-300";

export default function AdminBlogNewPage() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const save = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setError("");
      const response = await fetch("/api/admin/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          coverImage,
          contentMarkdown,
          category: "General",
          tags: [],
          status: "draft",
        }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !json.ok) {
        setError(json.error ?? "No se pudo guardar el post.");
        return;
      }
      router.push("/admin/blog");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Nuevo post</h1>
      <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
        <input className={inputClassName} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClassName} placeholder="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
        <input
          className={inputClassName}
          placeholder="URL portada (pegar desde Media Manager)"
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
        />
        <textarea className={inputClassName} placeholder="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
        <textarea
          className={`${inputClassName} min-h-64`}
          placeholder="Markdown"
          value={contentMarkdown}
          onChange={(e) => setContentMarkdown(e.target.value)}
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-rose-300 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-rose-400 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar draft"}
        </button>
      </div>
    </section>
  );
}
