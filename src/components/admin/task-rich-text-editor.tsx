"use client";

import { type ReactNode, useEffect, useRef } from "react";
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiBold,
  RiCheckboxLine,
  RiCodeSSlashLine,
  RiDoubleQuotesL,
  RiItalic,
  RiLink,
  RiListOrdered,
  RiListUnordered,
  RiStrikethrough,
  RiUnderline,
} from "@remixicon/react";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { clsx } from "clsx";

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

/** Valor inicial del editor (JSON TipTap o HTML guardado en Firestore). */
export type TaskDescriptionEditorContent = Record<string, unknown> | string | null;

/**
 * Contenido para TipTap: doc JSON, HTML previo, texto plano → doc, o doc vacío.
 */
export function taskDescriptionEditorContentFromTask(task: Record<string, unknown>): Record<string, unknown> | string {
  const raw = task.descriptionJson;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    if (o.type === "doc") return o;
  }
  const plain = String(task.descriptionText ?? task.description ?? "").trim();
  if (plain) {
    return {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: plain }] }],
    };
  }
  const html = String(task.descriptionHtml ?? "").trim();
  if (html) return html;
  return EMPTY_DOC;
}

/** Clave estable para detectar cambios de descripción desde el servidor (misma tarea, datos nuevos). */
export function taskDescriptionSourceKey(task: Record<string, unknown>): string {
  let j = "";
  try {
    const raw = task.descriptionJson;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const o = raw as Record<string, unknown>;
      if (o.type === "doc") j = JSON.stringify(raw);
    }
  } catch {
    j = "";
  }
  const plain = String(task.descriptionText ?? task.description ?? "").trim();
  const html = String(task.descriptionHtml ?? "").trim();
  return `j:${j}\u001fp:${plain}\u001fh:${html}`;
}

export function taskDescriptionDocFromTask(task: Record<string, unknown>): Record<string, unknown> | null {
  const c = taskDescriptionEditorContentFromTask(task);
  return typeof c === "string" ? null : (c as Record<string, unknown>);
}

export function taskDescriptionFingerprint(json: Record<string, unknown> | null, plainText: string): string {
  try {
    return `${plainText.trim()}\u001f${JSON.stringify(json ?? EMPTY_DOC)}`;
  } catch {
    return plainText.trim();
  }
}

type Props = {
  valueJson: TaskDescriptionEditorContent;
  /** Si se pasa, al cambiar se hace `setContent` (p. ej. tras refrescar la tarea desde el servidor). */
  syncContentKey?: string;
  /** Al perder foco el bloque editor+barra (sin pasar a otro control interno), p. ej. guardar. */
  onBlurCommit?: () => void;
  onChange: (payload: { json: Record<string, unknown>; text: string; html: string }) => void;
  disabled?: boolean;
  /** modal = crear tarea (tablero); detail = ficha de tarea */
  variant?: "modal" | "detail";
  className?: string;
};

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border text-zinc-600 transition",
        active
          ? "border-[#FF85A2]/80 bg-[#ffe4ec] text-rose-900"
          : "border-transparent bg-transparent hover:bg-zinc-100 hover:text-zinc-900",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <span className="mx-1 hidden h-5 w-px shrink-0 bg-zinc-200 sm:inline-block" aria-hidden />;
}

export function TaskRichTextEditor({
  valueJson,
  syncContentKey,
  onBlurCommit,
  onChange,
  disabled = false,
  variant = "modal",
  className,
}: Props) {
  const initialContent = valueJson ?? EMPTY_DOC;
  const prevSyncKeyRef = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { HTMLAttributes: { class: "list-disc pl-5" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5" } },
        link: { openOnClick: false },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Escribí "/" para ver el menú (pronto). Formato en la barra inferior.',
      }),
    ],
    immediatelyRender: false,
    editable: !disabled,
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      onChange({
        json: ed.getJSON() as Record<string, unknown>,
        text: ed.getText(),
        html: ed.getHTML(),
      });
    },
    editorProps: {
      attributes: {
        class: clsx(
          "task-rich-editor ProseMirror max-h-[min(52vh,420px)] min-h-[120px] overflow-y-auto px-3 py-2.5 text-[13px] leading-relaxed outline-none",
          variant === "detail" ? "text-zinc-800" : "text-zinc-900",
        ),
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (syncContentKey === undefined || !editor || editor.isDestroyed) return;
    if (prevSyncKeyRef.current === null) {
      prevSyncKeyRef.current = syncContentKey;
      return;
    }
    if (prevSyncKeyRef.current === syncContentKey) return;
    prevSyncKeyRef.current = syncContentKey;
    editor.commands.setContent(valueJson ?? EMPTY_DOC);
  }, [editor, syncContentKey, valueJson]);

  if (!editor) {
    return (
      <div
        className={clsx(
          "animate-pulse rounded-xl border border-zinc-200 bg-zinc-50",
          variant === "detail" ? "min-h-[156px]" : "min-h-[200px]",
          className,
        )}
      />
    );
  }

  const shell =
    variant === "detail"
      ? "rounded-lg border border-zinc-200 bg-white shadow-none"
      : "rounded-xl border border-zinc-300 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

  const bar = variant === "detail" ? "border-t border-zinc-200 bg-zinc-50/90" : "border-t border-zinc-200 bg-zinc-50";

  const promptLink = () => {
    if (!editor || disabled) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", prev ?? "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const chrome = (
    <div className={clsx("task-rich-editor-wrap flex flex-col overflow-hidden", shell, className)}>
      <EditorContent editor={editor} className="flex-1" />
      <div
        className={clsx(
          "flex flex-wrap items-center gap-0.5 px-1.5 py-1.5 sm:gap-1",
          bar,
        )}
      >
        <ToolbarBtn
          title="Deshacer"
          disabled={disabled || !editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <RiArrowGoBackLine className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Rehacer"
          disabled={disabled || !editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RiArrowGoForwardLine className="size-4" />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          title="Negrita"
          active={editor.isActive("bold")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <RiBold className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Cursiva"
          active={editor.isActive("italic")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <RiItalic className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Subrayado"
          active={editor.isActive("underline")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <RiUnderline className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Tachado"
          active={editor.isActive("strike")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <RiStrikethrough className="size-4" />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          title="Lista con viñetas"
          active={editor.isActive("bulletList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <RiListUnordered className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <RiListOrdered className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Lista de tareas"
          active={editor.isActive("taskList")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <RiCheckboxLine className="size-4" />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn title="Enlace" disabled={disabled} onClick={() => void promptLink()}>
          <RiLink className="size-4" />
        </ToolbarBtn>
        <ToolbarSep />
        <ToolbarBtn
          title="Código"
          active={editor.isActive("code")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <RiCodeSSlashLine className="size-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Bloque de código"
          active={editor.isActive("codeBlock")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <span className="font-mono text-[11px] font-bold">&lt;/&gt;</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Cita"
          active={editor.isActive("blockquote")}
          disabled={disabled}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <RiDoubleQuotesL className="size-4" />
        </ToolbarBtn>
      </div>
    </div>
  );

  if (!onBlurCommit) return chrome;

  return (
    // tabIndex permite que el borde agrupe foco toolbar + contenido para detectar "salida" real.
    <div
      tabIndex={-1}
      className="rounded-[inherit] outline-none"
      onBlur={(e) => {
        const rt = e.relatedTarget as Node | null;
        if (rt && e.currentTarget.contains(rt)) return;
        onBlurCommit();
      }}
    >
      {chrome}
    </div>
  );
}
