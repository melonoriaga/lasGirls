"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BlogStatusActions } from "@/components/admin/blog-status-actions";
import { BlogDeleteButton } from "@/components/admin/blog-delete-button";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-300 focus:ring-rose-300";

type BlogForm = {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: "draft" | "published" | "archived";
  contentMarkdown: string;
  tags: string[];
  featured: boolean;
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: string;
};

export default function AdminBlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorMode, setEditorMode] = useState<"split" | "edit" | "preview">("split");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<BlogForm>({
    title: "",
    slug: "",
    excerpt: "",
    category: "General",
    status: "draft",
    contentMarkdown: "",
    tags: [],
    featured: false,
    seoTitle: "",
    seoDescription: "",
    coverImage: "",
  });
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/${id}`);
      const json = (await response.json()) as { ok: boolean; post?: Record<string, unknown>; error?: string };
      if (!json.ok || !json.post) {
        setError(json.error ?? "No pudimos cargar el post.");
        setLoading(false);
        return;
      }
      setForm({
        title: String(json.post.title ?? ""),
        slug: String(json.post.slug ?? ""),
        excerpt: String(json.post.excerpt ?? ""),
        category: String(json.post.category ?? "General"),
        status: (json.post.status as BlogForm["status"]) ?? "draft",
        contentMarkdown: String(json.post.contentMarkdown ?? ""),
        tags: Array.isArray(json.post.tags) ? json.post.tags.map((tag) => String(tag)) : [],
        featured: Boolean(json.post.featured),
        seoTitle: String(json.post.seoTitle ?? ""),
        seoDescription: String(json.post.seoDescription ?? ""),
        coverImage: String(json.post.coverImage ?? ""),
      });
      setTagsInput(
        Array.isArray(json.post.tags) ? json.post.tags.map((tag) => String(tag)).join(", ") : "",
      );
      setLoading(false);
    };
    void load();
  }, [id]);

  const previewMarkdown = useMemo(() => form.contentMarkdown || "## Preview\n\nEscribí markdown a la izquierda.", [form.contentMarkdown]);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const payload = {
        ...form,
        tags: tagsInput
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
      };
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "No se pudo guardar.");
        return;
      }
      setMessage("Post actualizado.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-zinc-600">Cargando post...</p>;

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Editar post</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Editá el contenido en markdown y revisá el preview en vivo.
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200">
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className={inputClassName}
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            className={inputClassName}
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
          />
          <input
            className={inputClassName}
            placeholder="Categoría"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          />
          <select
            className={inputClassName}
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as BlogForm["status"] }))}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </div>

        <input
          className={inputClassName}
          placeholder="URL portada (pegar desde Media Manager)"
          value={form.coverImage ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, coverImage: e.target.value }))}
        />
        {form.coverImage ? (
          <div className="relative h-44 w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
            <Image src={form.coverImage} alt="Vista previa portada" fill className="object-cover" />
          </div>
        ) : (
          <div className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500 ring-1 ring-dashed ring-zinc-300">
            Este post no tiene portada. Si lo publicás, debería tener una imagen de portada.
          </div>
        )}

        <textarea
          className={`${inputClassName} min-h-24`}
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
        />
        <input
          className={inputClassName}
          placeholder="Tags separadas por coma"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Editor Markdown</p>
              <div className="inline-flex rounded-xl bg-zinc-100 p-1 ring-1 ring-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditorMode("edit")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    editorMode === "edit" ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-600"
                  }`}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("preview")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    editorMode === "preview" ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-600"
                  }`}
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("split")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    editorMode === "split" ? "bg-white text-zinc-900 ring-1 ring-zinc-200" : "text-zinc-600"
                  }`}
                >
                  Split
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-zinc-500">
              Acá podés editar el markdown directamente. Soporta títulos, listas, separadores y links.
            </p>
          </div>

          {(editorMode === "edit" || editorMode === "split") && (
            <div className="grid gap-2">
              <textarea
                className={`${inputClassName} min-h-[460px] font-mono text-sm`}
                placeholder="## Escribí tu post..."
                value={form.contentMarkdown}
                onChange={(e) => setForm((prev) => ({ ...prev, contentMarkdown: e.target.value }))}
              />
            </div>
          )}

          {(editorMode === "preview" || editorMode === "split") && (
            <div className="grid gap-2">
              <div className="min-h-[460px] rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
                <div className="blog-markdown">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewMarkdown}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="inline-flex min-w-[150px] items-center justify-center rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400 disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <BlogStatusActions
            postId={id}
            status={form.status}
            className="mt-0"
            onStatusChange={(nextStatus) => setForm((prev) => ({ ...prev, status: nextStatus }))}
          />
          <BlogDeleteButton postId={id} />
        </div>
      </div>
    </section>
  );
}
