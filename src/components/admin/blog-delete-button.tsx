"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  postId: string;
  compact?: boolean;
};

export function BlogDeleteButton({ postId, compact = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const remove = async () => {
    const confirmed = window.confirm("¿Eliminar este post? Esta acción no se puede deshacer.");
    if (!confirmed) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
      if (!response.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void remove()}
      disabled={loading}
      className={
        compact
          ? "rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
          : "inline-flex min-w-[150px] items-center justify-center rounded-lg border border-red-300 bg-red-100 px-4 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-200 disabled:opacity-60"
      }
    >
      {loading ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
