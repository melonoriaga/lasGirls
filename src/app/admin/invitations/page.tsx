"use client";

import { useEffect, useMemo, useState } from "react";
import { RiAddLine, RiRefreshLine, RiSearchLine } from "@remixicon/react";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Button } from "@/components/ui/button";

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  inviteUrl: string;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export default function InvitationsPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [link, setLink] = useState("");
  const [linkInfo, setLinkInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(true);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("");
  const [invitations, setInvitations] = useState<InvitationRow[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());
  const [deleteTarget, setDeleteTarget] = useState<InvitationRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const pendingCount = useMemo(() => invitations.filter((inv) => inv.status === "pending").length, [invitations]);
  const filteredInvitations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return invitations.filter((inv) => {
      const matchesQuery = !needle || inv.email.toLowerCase().includes(needle) || inv.role.toLowerCase().includes(needle);
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [invitations, query, statusFilter]);
  const totalItems = filteredInvitations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredInvitations.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasPrev = safePage > 1;
  const hasNext = safePage < totalPages;
  const startCount = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endCount = Math.min(safePage * pageSize, totalItems);
  const pageButtons = (() => {
    const span = 2;
    const from = Math.max(1, safePage - span);
    const to = Math.min(totalPages, safePage + span);
    const pages: number[] = [];
    for (let n = from; n <= to; n += 1) pages.push(n);
    return pages;
  })();

  const loadInvitations = async () => {
    setLoadingTable(true);
    const response = await fetch("/api/invites");
    const json = (await response.json()) as { ok: boolean; invitations?: InvitationRow[]; error?: string };
    if (!json.ok) {
      setError(json.error ?? "No pudimos cargar las invitaciones.");
      setLoadingTable(false);
      return;
    }
    setInvitations(json.invitations ?? []);
    setLoadingTable(false);
  };

  useEffect(() => {
    void loadInvitations();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getRemainingLabel = (expiresAt: string, status: string) => {
    if (status !== "pending") return "—";
    const targetMs = new Date(expiresAt).getTime();
    if (Number.isNaN(targetMs)) return "—";
    const diff = targetMs - nowMs;
    if (diff <= 0) return "Expirada";
    const totalSec = Math.floor(diff / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const invite = async () => {
    try {
      setLoading(true);
      setError("");
      setCopyState("");
      setLinkInfo("");
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const json = (await response.json()) as { ok: boolean; inviteUrl?: string; error?: string; reused?: boolean };
      if (!json.ok) {
        setError(json.error ?? "No pudimos generar la invitación.");
        return;
      }
      setLink(json.inviteUrl ?? "");
      setLinkInfo(json.reused ? "Ya existía una invitación pendiente para este email. Reutilizamos ese link." : "Nueva invitación creada.");
      setEmail("");
      await loadInvitations();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Invitaciones</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Generá links de acceso y monitoreá el estado de invitaciones. Pendientes:{" "}
        <span className="font-semibold text-zinc-900">{pendingCount}</span>
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Email</span>
            <input
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-[#ff5faf] focus:ring-2 focus:ring-[#ff5faf]/25"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@dominio.com"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Rol</span>
            <select
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pr-8 text-sm text-zinc-900 outline-none ring-0 transition focus:border-[#ff5faf] focus:ring-2 focus:ring-[#ff5faf]/25"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
        </div>

        <div className="flex justify-end">
          <Button type="button" onClick={invite} disabled={loading}>
            <RiAddLine className="size-4" aria-hidden />
            {loading ? "Generando..." : "Generar invitación"}
          </Button>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {link && (
          <div className="rounded-lg border border-[#ff5faf]/40 bg-[#ff5faf]/10 p-3 text-sm">
            <p className="font-medium text-zinc-900">Link generado</p>
            {linkInfo && <p className="mt-1 text-xs text-zinc-700">{linkInfo}</p>}
            <a className="mt-1 block break-all text-[#b3126b] underline" href={link}>
              {link}
            </a>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(link);
                setCopyState("Link copiado");
                setTimeout(() => setCopyState(""), 1400);
              }}
              className="mt-2 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              Copiar link
            </button>
            {copyState && <p className="mt-1 text-xs text-emerald-700">{copyState}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="grid gap-1 text-xs text-zinc-600">
            Buscar
            <div className="relative">
              <RiSearchLine className="pointer-events-none absolute left-2 top-2.5 size-4 text-zinc-400" aria-hidden />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar email o rol..."
                className="w-[240px] rounded-lg border border-zinc-300 bg-zinc-50 py-2.5 pl-8 pr-3 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
              />
            </div>
          </label>
          <label className="grid gap-1 text-xs text-zinc-600">
            Estado
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 pr-8 text-xs text-zinc-800"
            >
              <option value="all">Todos</option>
              <option value="pending">pending</option>
              <option value="accepted">accepted</option>
              <option value="revoked">revoked</option>
              <option value="expired">expired</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          aria-label="Actualizar tabla"
          onClick={() => void loadInvitations()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
        >
          <RiRefreshLine className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3 font-medium text-zinc-600">Email</th>
              <th className="p-3 font-medium text-zinc-600">Rol</th>
              <th className="p-3 font-medium text-zinc-600">Estado</th>
              <th className="p-3 font-medium text-zinc-600">Creada</th>
              <th className="p-3 font-medium text-zinc-600">Expira</th>
              <th className="p-3 font-medium text-zinc-600">Expira en</th>
              <th className="p-3 font-medium text-zinc-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loadingTable ? (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={7}>
                  Cargando invitaciones...
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={7}>
                  Aún no hay invitaciones creadas.
                </td>
              </tr>
            ) : (
              pageRows.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="p-3 text-zinc-900">{item.email}</td>
                  <td className="p-3 capitalize text-zinc-700">{item.role}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        item.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : item.status === "accepted"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-600">{formatDate(item.createdAt)}</td>
                  <td className="p-3 text-zinc-600">{formatDate(item.expiresAt)}</td>
                  <td className="p-3 text-zinc-700">{getRemainingLabel(item.expiresAt, item.status)}</td>
                  <td className="p-3">
                    <div className="flex justify-end">
                      <RowActionsMenu
                        items={[
                          {
                            label: "Copiar link",
                            onClick: async () => {
                              await navigator.clipboard.writeText(item.inviteUrl);
                              setCopyState(`Copiado: ${item.email}`);
                              setTimeout(() => setCopyState(""), 1400);
                            },
                          },
                          ...(item.status === "pending"
                            ? [
                                {
                                  label: "Revocar",
                                  onClick: async () => {
                                    await fetch("/api/invites", {
                                      method: "DELETE",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ invitationId: item.id, action: "revoke" }),
                                    });
                                    await loadInvitations();
                                  },
                                },
                              ]
                            : []),
                          { label: "Eliminar", onClick: () => setDeleteTarget(item), danger: true },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loadingTable && totalItems > 0 ? (
        <nav aria-label="Paginación de invitaciones" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            Mostrando <strong>{startCount}</strong> a <strong>{endCount}</strong> de <strong>{totalItems}</strong> invitaciones
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <ul className="flex -space-x-px text-sm">
              <li>
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-9 items-center justify-center rounded-s-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                >
                  Previous
                </button>
              </li>
              {pageButtons.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    aria-current={n === safePage ? "page" : undefined}
                    onClick={() => setPage(n)}
                    className={
                      n === safePage
                        ? "flex h-9 w-9 items-center justify-center border border-zinc-300 bg-zinc-200 text-sm font-semibold text-zinc-900"
                        : "flex h-9 w-9 items-center justify-center border border-zinc-300 bg-zinc-100 text-sm text-zinc-700 hover:bg-zinc-200"
                    }
                  >
                    {n}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-9 items-center justify-center rounded-e-lg border border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                >
                  Next
                </button>
              </li>
            </ul>
            <form className="w-32">
              <label htmlFor="invites-per-page" className="sr-only">
                Items por página
              </label>
              <select
                id="invites-per-page"
                className="block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 pr-8 text-sm text-zinc-800"
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/35 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">Eliminar invitación</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Esta acción elimina la invitación de <strong>{deleteTarget.email}</strong>.
            </p>
            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDeletingId(deleteTarget.id);
                    await fetch("/api/invites", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ invitationId: deleteTarget.id, action: "delete" }),
                    });
                    setDeleteTarget(null);
                    await loadInvitations();
                  } finally {
                    setDeletingId(null);
                  }
                }}
                className="rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-200 disabled:opacity-60"
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id ? "Eliminando..." : "Confirmar eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
