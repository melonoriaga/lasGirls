"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  RiAddLine,
  RiDeleteBin6Line,
  RiDraggable,
  RiLinkM,
  RiRefreshLine,
} from "@remixicon/react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CropUploadModal } from "@/components/admin/crop-upload-modal";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { Button } from "@/components/ui/button";
import { firebaseStorage } from "@/lib/firebase/client";
import type { PartnerLogoRecord } from "@/lib/partner-logos/types";

type Row = { id: string } & PartnerLogoRecord;

function safeFileName(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function PartnerLogosAdminPanel() {
  const toast = useAdminToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partner-logos", { credentials: "include" });
      const json = (await res.json()) as { ok?: boolean; items?: Row[]; error?: string };
      if (!res.ok || !json.ok || !json.items) {
        throw new Error(json.error ?? "No se pudieron cargar los logos.");
      }
      setRows(json.items);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination || destination.index === source.index) return;
    const next = Array.from(rows);
    const [removed] = next.splice(source.index, 1);
    if (!removed) return;
    next.splice(destination.index, 0, removed);
    setRows(next);
    try {
      const res = await fetch("/api/admin/partner-logos/reorder", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((r) => r.id) }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo guardar el orden.");
      toast.success("Orden actualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      void load();
    }
  };

  /** Called by CropUploadModal with the cropped blob */
  const uploadBlob = async (blob: Blob, originalName: string) => {
    setCropFile(null);
    setUploading(true);
    try {
      const ext = blob.type === "image/jpeg" ? "jpg" : "png";
      const baseName = originalName.replace(/\.[^.]+$/, "");
      const name = `${Date.now()}-${safeFileName(baseName)}.${ext}`;
      const storagePath = `partner/${name}`;
      const storageRef = ref(firebaseStorage, storagePath);
      await uploadBytes(storageRef, blob, { contentType: blob.type });
      const imageUrl = await getDownloadURL(storageRef);
      const res = await fetch("/api/admin/partner-logos", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, storagePath, enabled: true, linkUrl: "" }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo crear el registro.");
      toast.success("Logo subido.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Elegí un archivo de imagen.");
      return;
    }
    setCropFile(f);
  };

  const saveLink = async (row: Row, linkUrl: string) => {
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/admin/partner-logos/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkUrl }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo guardar el link.");
      toast.success("Link actualizado.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingId(null);
    }
  };

  const toggleEnabled = async (row: Row) => {
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/admin/partner-logos/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !row.enabled }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo actualizar.");
      toast.success(row.enabled ? "Oculto en el sitio." : "Visible en el sitio.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingId(null);
    }
  };

  const remove = async (row: Row) => {
    if (!window.confirm("¿Eliminar este logo del sitio y (si aplica) del bucket?")) return;
    setSavingId(row.id);
    try {
      const res = await fetch(`/api/admin/partner-logos/${encodeURIComponent(row.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo eliminar.");
      toast.success("Logo eliminado.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      {/* Crop modal */}
      {cropFile ? (
        <CropUploadModal
          file={cropFile}
          onConfirm={(blob, name) => void uploadBlob(blob, name)}
          onCancel={() => setCropFile(null)}
        />
      ) : null}

      <div className="space-y-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <RiRefreshLine className="size-4" aria-hidden />
            Actualizar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden
            onChange={onFileSelected}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            <RiAddLine className="size-4" aria-hidden />
            {uploading ? "Subiendo…" : "Subir logo"}
          </Button>
          <span className="text-xs text-zinc-500">1 : 1 · máx. 1 MB · se comprime automáticamente</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="rounded-2xl border border-zinc-100 bg-white p-10 text-center text-sm text-zinc-600">
            Cargando…
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600">
            Todavía no hay logos. Subí uno con el botón de arriba.
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="partner-logos">
              {(provided) => (
                <ul
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid list-none gap-3 p-0"
                >
                  {rows.map((row, index) => (
                    <Draggable key={row.id} draggableId={row.id} index={index}>
                      {(dragProvided, snapshot) => (
                        <li
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          style={dragProvided.draggableProps.style}
                          className={`rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm ${snapshot.isDragging ? "ring-2 ring-rose-200" : ""
                            } ${!row.enabled ? "opacity-60" : ""}`}
                        >
                          <div className="flex gap-4 items-center ">
                            <div
                              {...dragProvided.dragHandleProps}
                              className="flex shrink-0 cursor-grab items-center gap-2 text-zinc-400 active:cursor-grabbing"
                              aria-label="Arrastrar para reordenar"
                            >
                              <RiDraggable className="size-5" />

                              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
                                #{index + 1}
                              </span>
                            </div>

                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                              <Image
                                src={row.imageUrl}
                                alt=""
                                fill
                                className="object-contain p-1"
                                unoptimized={row.imageUrl.endsWith(".svg")}
                              />
                            </div>

                            <div className="min-w-0 flex-1 space-y-3">
                              <label className="block text-xs font-semibold text-zinc-600">
                                <span className="flex items-center gap-1">
                                  <RiLinkM className="size-3.5" aria-hidden />
                                  Link opcional (sitio del cliente, nueva pestaña)
                                </span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <input
                                    key={`${row.id}-${row.updatedAt}`}
                                    defaultValue={row.linkUrl}
                                    className="min-w-[200px] flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                                    placeholder="https://…"
                                    disabled={savingId === row.id}
                                    onBlur={(e) => {
                                      const next = e.target.value.trim();
                                      if (next === (row.linkUrl ?? "")) return;
                                      void saveLink(row, next);
                                    }}
                                  />
                                </div>
                              </label>
                              <p className="break-all font-mono text-[10px] text-zinc-500">{row.storagePath}</p>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                                <input
                                  type="checkbox"
                                  checked={row.enabled}
                                  disabled={savingId === row.id}
                                  onChange={() => void toggleEnabled(row)}
                                />
                                Visible
                              </label>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={savingId === row.id}
                                onClick={() => void remove(row)}
                                className="border-red-200 text-red-700 hover:bg-red-50"
                              >
                                <RiDeleteBin6Line className="size-4" aria-hidden />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </>
  );
}
