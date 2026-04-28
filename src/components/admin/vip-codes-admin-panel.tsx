"use client";

import { RiAddLine, RiCloseLine, RiRefreshLine } from "@remixicon/react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";

type VipRow = {
  id: string;
  code?: string;
  active?: boolean;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
  notes?: string;
  createdAt?: string;
};

function formatExpires(iso?: string) {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return format(d, "dd MMM yyyy HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

export function VipCodesAdminPanel() {
  const toast = useAdminToast();
  const [rows, setRows] = useState<VipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<VipRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vip-codes", { credentials: "include" });
      const json = (await res.json()) as { ok?: boolean; codes?: VipRow[]; error?: string };
      if (!res.ok || !json.ok || !json.codes) {
        throw new Error(json.error ?? "No se pudieron cargar los códigos.");
      }
      setRows(json.codes as VipRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const expiredIds = useMemo(() => {
    const now = Date.now();
    return new Set(
      rows
        .filter((r) => {
          if (!r.expiresAt) return false;
          const t = parseISO(r.expiresAt).getTime();
          return !Number.isNaN(t) && t < now;
        })
        .map((r) => r.id),
    );
  }, [rows]);

  const toggleActive = async (row: VipRow, active: boolean) => {
    try {
      const res = await fetch(`/api/admin/vip-codes/${encodeURIComponent(row.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo actualizar.");
      toast.success(active ? "Código activado." : "Código desactivado.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="space-y-4">
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
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[#db2777] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#be185d]"
        >
          <RiAddLine className="size-4" aria-hidden />
          Nuevo código
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] uppercase tracking-[0.14em] text-zinc-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Código</th>
              <th className="px-4 py-3 font-semibold">Usos</th>
              <th className="px-4 py-3 font-semibold">Expira</th>
              <th className="px-4 py-3 font-semibold">Activo</th>
              <th className="px-4 py-3 font-semibold">Notas</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Cargando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  Todavía no hay códigos. Creá uno con «Nuevo código».
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const expired = expiredIds.has(row.id);
                const used = Number(row.usedCount ?? 0);
                const max = Number(row.maxUses ?? 0);
                return (
                  <tr key={row.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-mono text-[13px] font-semibold text-zinc-900">{row.code ?? row.id}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {used} / {max}
                      {expired ? (
                        <span className="ml-2 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                          Expirado
                        </span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatExpires(row.expiresAt)}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-zinc-700">
                        <input
                          type="checkbox"
                          checked={Boolean(row.active)}
                          onChange={(e) => void toggleActive(row, e.target.checked)}
                          className="size-4 accent-[#db2777]"
                        />
                        {row.active ? "Sí" : "No"}
                      </label>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600" title={row.notes}>
                      {row.notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditRow(row)}
                        className="text-xs font-semibold text-[#db2777] hover:underline"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {createOpen ? (
        <CreateEditVipModal
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            void load();
          }}
        />
      ) : null}

      {editRow ? (
        <CreateEditVipModal
          mode="edit"
          initial={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            setEditRow(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function CreateEditVipModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  initial?: VipRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useAdminToast();
  const [code, setCode] = useState(initial?.code ?? "");
  const [maxUses, setMaxUses] = useState(initial?.maxUses?.toString() ?? "50");
  const [expiresLocal, setExpiresLocal] = useState(() => {
    if (initial?.expiresAt) {
      try {
        const d = parseISO(initial.expiresAt);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      } catch {
        return "";
      }
    }
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const submit = async () => {
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/vip-codes", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            maxUses: Number(maxUses),
            expiresAt: new Date(expiresLocal).toISOString(),
            notes,
            active,
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo crear.");
        toast.success("Código creado.");
      } else if (initial) {
        const res = await fetch(`/api/admin/vip-codes/${encodeURIComponent(initial.id)}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            maxUses: Number(maxUses),
            expiresAt: new Date(expiresLocal).toISOString(),
            notes,
            active,
          }),
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo guardar.");
        toast.success("Código actualizado.");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1] w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">{mode === "create" ? "Nuevo código VIP" : "Editar código"}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-zinc-500 hover:bg-zinc-100">
            <RiCloseLine className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Código</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={mode === "edit"}
              placeholder="JEAN20OFF"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm uppercase outline-none focus:border-[#db2777] disabled:bg-zinc-100"
            />
            {mode === "edit" ? <p className="mt-1 text-[11px] text-zinc-500">El identificador del código no se puede cambiar.</p> : null}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Máx. usos</label>
              <input
                type="number"
                min={1}
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#db2777]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Expira</label>
              <input
                type="datetime-local"
                value={expiresLocal}
                onChange={(e) => setExpiresLocal(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#db2777]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-600">Notas (internas)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-[#db2777]"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="size-4 accent-[#db2777]" />
            Activo
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || (mode === "create" && !code.trim())}
            onClick={() => void submit()}
            className="rounded-lg bg-[#db2777] px-4 py-2 text-sm font-semibold text-white hover:bg-[#be185d] disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
