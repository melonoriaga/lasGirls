"use client";

import Link from "next/link";
import {
  RiAddLine,
  RiCloseCircleLine,
  RiRefreshLine,
  RiSearchLine,
} from "@remixicon/react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { getClientDisplayName } from "@/types/client";

type ClientRow = Record<string, unknown> & { id: string };
type AdminUser = { id: string; fullName: string; email: string; photoURL?: string };

type ListResponse = {
  ok: boolean;
  items?: ClientRow[];
  hasNext?: boolean;
  hasPrev?: boolean;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  nextStartAfterId?: string | null;
  firstId?: string | null;
  lastId?: string | null;
  searchMode?: boolean;
  scanCapped?: boolean;
  error?: string;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300";

function serviceLabel(row: ClientRow) {
  const st = row.serviceType;
  if (Array.isArray(st) && st.length) return st.join(", ");
  const sc = row.servicesContracted;
  if (Array.isArray(sc) && sc.length) return sc.join(", ");
  return "—";
}

function getPrimaryEmail(row: ClientRow) {
  const emails = Array.isArray(row.emails) ? row.emails : [];
  const primary = emails.find((item) => item && typeof item === "object" && (item as { isPrimary?: boolean }).isPrimary);
  const fallback = emails[0] as { email?: string } | undefined;
  return String((primary as { email?: string } | undefined)?.email ?? fallback?.email ?? row.email ?? "—");
}

function getPrimaryPhone(row: ClientRow) {
  const phones = Array.isArray(row.phones) ? row.phones : [];
  const primary = phones.find((item) => item && typeof item === "object" && (item as { isPrimary?: boolean }).isPrimary);
  const fallback = phones[0] as { number?: string } | undefined;
  return String((primary as { number?: string } | undefined)?.number ?? fallback?.number ?? row.phone ?? "—");
}

function getMainContact(row: ClientRow) {
  const contacts = Array.isArray(row.contacts) ? row.contacts : [];
  const first = contacts[0] as { name?: string } | undefined;
  return String(first?.name ?? "—");
}

function isClientInactive(row: ClientRow) {
  const s = String(row.status ?? "active").toLowerCase();
  return s === "inactive" || s === "archived";
}

type ConfirmAction = "deactivate" | "reactivate" | "delete";

export function ClientsTablePanel({ actorUid: _actorUid }: { actorUid: string }) {
  const toast = useAdminToast();
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ClientRow[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchMode, setSearchMode] = useState(false);
  const [scanCapped, setScanCapped] = useState(false);
  const [confirm, setConfirm] = useState<{ action: ConfirmAction; row: ClientRow } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine">("all");
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = (await res.json()) as { ok?: boolean; users?: AdminUser[] };
      if (json.ok && json.users) setUsers(json.users);
    };
    void loadUsers();
  }, []);

  const fetchList = async (opts: { searchQuery?: string; page?: number } = {}) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.set("limit", String(pageSize));
    const query = opts.searchQuery !== undefined ? opts.searchQuery : q;
    params.set("page", String(opts.page ?? page));
    if (query.trim()) params.set("q", query.trim());
    params.set("scope", scopeFilter);
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
      setPage(Number(data.page ?? 1));
      setTotalPages(Math.max(1, Number(data.totalPages ?? 1)));
      setTotalItems(Math.max(0, Number(data.totalItems ?? 0)));
      return true;
    } catch {
      setError("Error de red al cargar clientes.");
      setItems([]);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    void fetchList({ searchQuery: q, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch list when page size or active search changes
  }, [pageSize, q, scopeFilter]);

  const refreshFirstPage = () => {
    setPage(1);
    void fetchList({ searchQuery: q, page: 1 });
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
    setPage(1);
    setQ(qInput);
  };

  const clearSearch = () => {
    setQInput("");
    setPage(1);
    setQ("");
  };

  const goToPage = (nextPage: number) => {
    const safe = Math.min(Math.max(nextPage, 1), totalPages);
    if (safe === page) return;
    setPage(safe);
    void fetchList({ page: safe });
  };

  const goNext = () => {
    if (!hasNext) return;
    goToPage(page + 1);
  };

  const goPrev = () => {
    if (!hasPrev) return;
    goToPage(page - 1);
  };

  const pageButtons = (() => {
    const span = 2;
    const from = Math.max(1, page - span);
    const to = Math.min(totalPages, page + span);
    const pages: number[] = [];
    for (let n = from; n <= to; n += 1) pages.push(n);
    return pages;
  })();

  const startCount = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endCount = Math.min(page * pageSize, totalItems);
  const paginationBtn =
    "flex items-center justify-center border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 text-sm h-9 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";
  const paginationPageBtn =
    "flex items-center justify-center border border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 text-sm font-medium w-9 h-9 focus:outline-none";
  const paginationPageBtnActive =
    "flex items-center justify-center border border-zinc-300 bg-zinc-200 text-zinc-900 text-sm font-semibold w-9 h-9 focus:outline-none";
  const paginationEdgeBtn = `${paginationBtn} px-3`;
  const perPageClass =
    "block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800 shadow-sm focus:border-rose-300 focus:ring-rose-300";
  const getResponsible = (row: ClientRow) => {
    const uid = String(row.accountManagerUserId ?? "");
    const user = users.find((item) => item.id === uid);
    const label = user?.fullName || user?.email || (uid ? uid.slice(0, 8) : "—");
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return { user, label, initials };
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
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
          Visibilidad
          <select
            className={`${inputClass} pr-8`}
            value={scopeFilter}
            onChange={(e) => {
              setScopeFilter(e.target.value as "all" | "mine");
            }}
          >
            <option value="all">Todos visibles</option>
            <option value="mine">Solo míos</option>
          </select>
        </label>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/leads"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-semibold text-zinc-900 hover:bg-rose-400"
          >
            <RiAddLine className="size-4 shrink-0" aria-hidden />
            Agregar
          </Link>
          <button
            type="button"
            aria-label="Actualizar tabla"
            onClick={refreshFirstPage}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          >
            <RiRefreshLine className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
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

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-zinc-500">Cargando clientes...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-zinc-600">No hay clientes para mostrar.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3 font-medium text-zinc-600">Cliente</th>
                <th className="p-3 font-medium text-zinc-600">Contacto principal</th>
                <th className="p-3 font-medium text-zinc-600">Email principal</th>
                <th className="p-3 font-medium text-zinc-600">Telefono principal</th>
                <th className="p-3 font-medium text-zinc-600">Servicio</th>
                <th className="p-3 font-medium text-zinc-600">Responsable de cuenta</th>
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
                    <div className="flex items-center gap-2">
                      {row.logoURL ? (
                        <img
                          src={String(row.logoURL)}
                          alt={getClientDisplayName(row)}
                          className="h-8 w-8 rounded-md border border-zinc-200 object-cover"
                        />
                      ) : null}
                      <span>{getClientDisplayName(row)}</span>
                      {String(row.visibilityScope ?? "team") === "private" ? (
                        <span className="ml-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                          privado
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="p-3 text-zinc-700">{getMainContact(row)}</td>
                  <td className="p-3 text-zinc-700">{getPrimaryEmail(row)}</td>
                  <td className="p-3 text-zinc-700">{getPrimaryPhone(row)}</td>
                  <td className="max-w-[180px] truncate p-3 text-zinc-600">{serviceLabel(row)}</td>
                  <td className="p-3 text-zinc-600">
                    {(() => {
                      const responsible = getResponsible(row);
                      return (
                        <div className="flex items-center gap-2">
                          {responsible.user?.photoURL ? (
                            <img
                              src={responsible.user.photoURL}
                              alt={responsible.label}
                              className="h-6 w-6 rounded-full border border-zinc-200 object-cover"
                            />
                          ) : (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                              {responsible.initials || "?"}
                            </span>
                          )}
                          <span>{responsible.label}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-zinc-500">{String(row.createdAt ?? "").slice(0, 10)}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        items={[
                          { label: "Ver", href: `/admin/clients/${row.id}` },
                          { label: "Editar", href: `/admin/clients/${row.id}` },
                          inactive
                            ? { label: "Reactivar", onClick: () => setConfirm({ action: "reactivate", row }) }
                            : { label: "Desactivar", onClick: () => setConfirm({ action: "deactivate", row }) },
                          { label: "Eliminar", onClick: () => setConfirm({ action: "delete", row }), danger: true },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && items.length > 0 ? (
        <nav aria-label="Paginación de clientes" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            Mostrando <strong>{startCount}</strong> a <strong>{endCount}</strong> de <strong>{totalItems}</strong> clientes
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ul className="flex -space-x-px text-sm">
              <li>
                <button type="button" disabled={!hasPrev} onClick={goPrev} className={`${paginationEdgeBtn} rounded-s-lg`}>
                  Previous
                </button>
              </li>
              {pageButtons.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => goToPage(n)}
                    className={n === page ? paginationPageBtnActive : paginationPageBtn}
                  >
                    {n}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" disabled={!hasNext} onClick={goNext} className={`${paginationEdgeBtn} rounded-e-lg`}>
                  Next
                </button>
              </li>
            </ul>
            <form className="w-32">
              <label htmlFor="clients-per-page" className="sr-only">
                Items por página
              </label>
              <select
                id="clients-per-page"
                className={perPageClass}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </form>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
