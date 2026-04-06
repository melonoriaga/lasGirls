"use client";

import Link from "next/link";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseCircleLine,
  RiDeleteBinLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiSearchLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { getClientDisplayName } from "@/types/client";

type ClientRow = Record<string, unknown> & { id: string };

type ListResponse = {
  ok: boolean;
  items?: ClientRow[];
  hasNext?: boolean;
  hasPrev?: boolean;
  nextStartAfterId?: string | null;
  firstId?: string | null;
  lastId?: string | null;
  searchMode?: boolean;
  scanCapped?: boolean;
  error?: string;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300";

function formatMoney(amount: unknown, currency: unknown) {
  const n = Number(amount ?? 0);
  const c = String(currency ?? "USD");
  return `${c} ${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function serviceLabel(row: ClientRow) {
  const st = row.serviceType;
  if (Array.isArray(st) && st.length) return st.join(", ");
  const sc = row.servicesContracted;
  if (Array.isArray(sc) && sc.length) return sc.join(", ");
  return "—";
}

function billingLabel(row: ClientRow) {
  return String(row.billingType ?? row.billingModel ?? "—");
}

function monthlyRef(row: ClientRow) {
  const mf = row.monthlyFee;
  if (typeof mf === "number" && mf > 0) return formatMoney(mf, row.currency);
  const pricing = row.pricing as { amount?: number; currency?: string } | undefined;
  if (pricing?.amount != null) return formatMoney(pricing.amount, pricing.currency ?? row.currency);
  return "—";
}

function isClientInactive(row: ClientRow) {
  const s = String(row.status ?? "active").toLowerCase();
  return s === "inactive" || s === "archived";
}

type ConfirmAction = "deactivate" | "reactivate" | "delete";

export function ClientsTablePanel() {
  const toast = useAdminToast();
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ClientRow[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [scanCapped, setScanCapped] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  const [firstId, setFirstId] = useState<string | null>(null);
  const [backStack, setBackStack] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; row: ClientRow } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchList = async (opts: { startAfterId?: string; endBeforeId?: string; searchQuery?: string } = {}) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    const query = opts.searchQuery !== undefined ? opts.searchQuery : q;
    if (query.trim()) params.set("q", query.trim());
    if (opts.startAfterId) params.set("startAfterId", opts.startAfterId);
    if (opts.endBeforeId) params.set("endBeforeId", opts.endBeforeId);
    try {
      const res = await fetch(`/api/admin/clients?${params.toString()}`, { cache: "no-store" });
      const data = (await res.json()) as ListResponse;
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No pudimos cargar clientes.");
        setItems([]);
        return null;
      }
      setItems(data.items ?? []);
      setHasNext(Boolean(data.hasNext));
      setHasPrev(Boolean(data.hasPrev));
      setSearchMode(Boolean(data.searchMode));
      setScanCapped(Boolean(data.scanCapped));
      const f = data.firstId ? String(data.firstId) : null;
      setLastId(data.lastId ? String(data.lastId) : null);
      setFirstId(f);
      return { firstId: f };
    } catch {
      setError("Error de red al cargar clientes.");
      setItems([]);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setBackStack([]);
    void fetchList({ searchQuery: q });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch list when page size or active search changes
  }, [pageSize, q]);

  const refreshFirstPage = () => {
    setBackStack([]);
    void fetchList({ searchQuery: q });
  };

  const runConfirmedAction = async () => {
    if (!confirm) return;
    const { action, row } = confirm;
    setConfirmLoading(true);
    try {
      if (action === "deactivate") {
        const res = await fetch(`/api/admin/clients/${row.id}/deactivate`, {
          method: "POST",
          credentials: "include",
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo desactivar.");
        toast.success("Cliente desactivado.");
      } else if (action === "reactivate") {
        const res = await fetch(`/api/admin/clients/${row.id}/reactivate`, {
          method: "POST",
          credentials: "include",
        });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo reactivar.");
        toast.success("Cliente reactivado.");
      } else {
        const res = await fetch(`/api/admin/clients/${row.id}`, { method: "DELETE", credentials: "include" });
        const json = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo eliminar.");
        toast.success("Cliente eliminado.");
      }
      setConfirm(null);
      refreshFirstPage();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al procesar la acción.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const applySearch = () => {
    setQ(qInput);
    setBackStack([]);
  };

  const clearSearch = () => {
    setQInput("");
    setQ("");
    setBackStack([]);
  };

  const goNext = async () => {
    if (!lastId || searchMode) return;
    const res = await fetchList({ startAfterId: lastId });
    const fid = res?.firstId;
    if (fid) setBackStack((s) => [...s, fid]);
  };

  const goPrev = () => {
    if (searchMode || backStack.length === 0) return;
    const anchor = backStack[backStack.length - 1];
    setBackStack((s) => s.slice(0, -1));
    void fetchList({ endBeforeId: anchor });
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-xs text-zinc-600">
          Buscar
          <input
            className={`${inputClass} w-[220px]`}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Nombre, email, empresa..."
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
          />
        </label>
        <button
          type="button"
          onClick={applySearch}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-rose-400"
        >
          <RiSearchLine className="size-4 shrink-0" aria-hidden />
          Buscar
        </button>
        {q ? (
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs text-zinc-700"
          >
            <RiCloseCircleLine className="size-4 shrink-0" aria-hidden />
            Limpiar
          </button>
        ) : null}
        <label className="grid gap-1 text-xs text-zinc-600">
          Por página
          <select
            className={inputClass}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setBackStack([]);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      {searchMode && scanCapped ? (
        <p className="mt-2 text-xs text-amber-700">
          Mostramos coincidencias dentro de los últimos {350} clientes por fecha. Afiná la búsqueda si falta alguien.
        </p>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={
          confirm?.action === "delete"
            ? "¿Eliminar este cliente?"
            : confirm?.action === "deactivate"
              ? "¿Desactivar este cliente?"
              : "¿Reactivar este cliente?"
        }
        description={
          confirm?.action === "delete"
            ? `Se borrará permanentemente «${getClientDisplayName(confirm.row)}» y todo lo asociado: notas, links, facturas, pagos e historial de actividad. No se puede deshacer.`
            : confirm?.action === "deactivate"
              ? `«${getClientDisplayName(confirm.row)}» quedará como inactivo: seguirá en el listado pero marcado como desactivado. Podés reactivarlo cuando quieras.`
              : confirm
                ? `«${getClientDisplayName(confirm.row)}» volverá a estado activo.`
                : undefined
        }
        confirmLabel={
          confirm?.action === "delete"
            ? "Sí, eliminar"
            : confirm?.action === "deactivate"
              ? "Desactivar"
              : "Reactivar"
        }
        danger={confirm?.action === "delete" || confirm?.action === "deactivate"}
        loading={confirmLoading}
        onCancel={() => !confirmLoading && setConfirm(null)}
        onConfirm={() => void runConfirmedAction()}
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando clientes...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-600">No hay clientes para mostrar.</div>
        ) : (
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3 font-medium text-zinc-600">Cliente</th>
                <th className="p-3 font-medium text-zinc-600">Email</th>
                <th className="p-3 font-medium text-zinc-600">Marca / empresa</th>
                <th className="p-3 font-medium text-zinc-600">Estado</th>
                <th className="p-3 font-medium text-zinc-600">Servicio</th>
                <th className="p-3 font-medium text-zinc-600">Cobro</th>
                <th className="p-3 font-medium text-zinc-600">Fee / ref.</th>
                <th className="p-3 font-medium text-zinc-600">Factura</th>
                <th className="p-3 font-medium text-zinc-600">Alta</th>
                <th className="p-3 font-medium text-zinc-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const inactive = isClientInactive(row);
                return (
                <tr
                  key={row.id}
                  className={`border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80 ${
                    inactive ? "bg-zinc-50/90 text-zinc-600" : ""
                  }`}
                >
                  <td className={`p-3 font-medium ${inactive ? "text-zinc-600" : "text-zinc-900"}`}>
                    {getClientDisplayName(row)}
                  </td>
                  <td className="p-3 text-zinc-700">{String(row.email ?? "—")}</td>
                  <td className="p-3 text-zinc-600">{String(row.brandName || row.company || "—")}</td>
                  <td className="p-3 text-zinc-700">
                    {inactive ? (
                      <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-900">
                        {String(row.status ?? "—")}
                      </span>
                    ) : (
                      String(row.status ?? "—")
                    )}
                  </td>
                  <td className="max-w-[180px] truncate p-3 text-zinc-600">{serviceLabel(row)}</td>
                  <td className="p-3 text-zinc-600">{billingLabel(row)}</td>
                  <td className="p-3 text-zinc-700">{monthlyRef(row)}</td>
                  <td className="p-3 text-zinc-600">{String(row.invoiceStatus ?? "—")}</td>
                  <td className="p-3 text-zinc-500">{String(row.createdAt ?? "").slice(0, 10)}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <Link
                        href={`/admin/clients/${row.id}`}
                        className="inline-flex items-center gap-0.5 font-medium text-[#db2777] hover:underline"
                      >
                        Ver
                        <RiArrowRightSLine className="size-3.5" aria-hidden />
                      </Link>
                      {inactive ? (
                        <button
                          type="button"
                          onClick={() => setConfirm({ action: "reactivate", row })}
                          className="inline-flex items-center gap-0.5 text-left text-xs font-semibold text-emerald-800 hover:underline"
                        >
                          <RiPlayCircleLine className="size-3.5 shrink-0" aria-hidden />
                          Reactivar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirm({ action: "deactivate", row })}
                          className="inline-flex items-center gap-0.5 text-left text-xs font-semibold text-amber-800 hover:underline"
                        >
                          <RiPauseCircleLine className="size-3.5 shrink-0" aria-hidden />
                          Desactivar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirm({ action: "delete", row })}
                        className="inline-flex items-center gap-0.5 text-left text-xs font-semibold text-red-700 hover:underline"
                      >
                        <RiDeleteBinLine className="size-3.5 shrink-0" aria-hidden />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!searchMode && !loading && items.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!hasPrev}
            onClick={goPrev}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 hover:bg-zinc-100"
          >
            <RiArrowLeftSLine className="size-4 shrink-0" aria-hidden />
            Anterior
          </button>
          <button
            type="button"
            disabled={!hasNext}
            onClick={goNext}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 disabled:opacity-40 hover:bg-zinc-100"
          >
            Siguiente
            <RiArrowRightSLine className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}
