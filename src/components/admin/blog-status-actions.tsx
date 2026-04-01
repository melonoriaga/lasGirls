"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  postId: string;
  status: "draft" | "published" | "archived";
  className?: string;
  onStatusChange?: (nextStatus: "draft" | "published" | "archived") => void;
};

export function BlogStatusActions({ postId, status, className = "", onStatusChange }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const effectiveStatus = currentStatus;

  const updateStatus = async (nextStatus: Props["status"]) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/${postId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) return;
      setCurrentStatus(nextStatus);
      onStatusChange?.(nextStatus);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`mt-3 flex flex-wrap gap-2 ${className}`}>
      {effectiveStatus !== "published" && (
        <button
          type="button"
          onClick={() => void updateStatus("published")}
          disabled={loading}
          className="inline-flex min-w-[150px] items-center justify-center rounded-lg border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          Publicar
        </button>
      )}
      {effectiveStatus !== "draft" && (
        <button
          type="button"
          onClick={() => void updateStatus("draft")}
          disabled={loading}
          className="inline-flex min-w-[150px] items-center justify-center rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-60"
        >
          Pasar a borrador
        </button>
      )}
      {effectiveStatus !== "archived" && (
        <button
          type="button"
          onClick={() => void updateStatus("archived")}
          disabled={loading}
          className="inline-flex min-w-[150px] items-center justify-center rounded-lg border border-amber-300 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 disabled:opacity-60"
        >
          Archivar
        </button>
      )}
    </div>
  );
}
