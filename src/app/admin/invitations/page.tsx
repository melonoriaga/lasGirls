"use client";

import { useEffect, useMemo, useState } from "react";
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

  const pendingCount = useMemo(() => invitations.filter((inv) => inv.status === "pending").length, [invitations]);

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
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-0 transition focus:border-[#ff5faf] focus:ring-2 focus:ring-[#ff5faf]/25"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void loadInvitations()}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Refrescar tabla
          </button>
          <Button type="button" onClick={invite} disabled={loading}>
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

      <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[920px] text-left text-sm">
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
            ) : invitations.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-zinc-500" colSpan={7}>
                  Aún no hay invitaciones creadas.
                </td>
              </tr>
            ) : (
              invitations.map((item) => (
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
                    <div className="flex w-full items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-md border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                      >
                        Eliminar
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(item.inviteUrl);
                            setCopyState(`Copiado: ${item.email}`);
                            setTimeout(() => setCopyState(""), 1400);
                          }}
                          className="rounded-md border border-[#ff5faf]/40 bg-[#ff5faf]/10 px-2.5 py-1 text-xs font-semibold text-[#9d174d] hover:bg-[#ff5faf]/20"
                        >
                          Copiar
                        </button>
                        {item.status === "pending" && (
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch("/api/invites", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ invitationId: item.id, action: "revoke" }),
                              });
                              await loadInvitations();
                            }}
                            className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Revocar
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
