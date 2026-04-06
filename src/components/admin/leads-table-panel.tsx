"use client";

import Link from "next/link";
import {
  RiAddLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiRefreshLine,
} from "@remixicon/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { CreateLeadForm } from "@/components/admin/create-lead-form";
import { leadBudgetStatusLabel, leadPipelineStatusLabel } from "@/lib/admin/lead-statuses";

type LeadRow = {
  id: string;
  fullName?: string;
  email?: string;
  company?: string;
  inquiryType?: string;
  serviceInterest?: string[];
  status?: string;
  budgetStatus?: string;
  latestBudgetSentAt?: string;
  assignedTo?: string;
  assignedToUserId?: string;
  convertedToClientId?: string;
  createdAt?: string;
};

type Props = {
  leads: LeadRow[];
};

const getStatusClassName = (status?: string) => {
  const value = String(status ?? "new");
  const map: Record<string, string> = {
    new: "border-sky-200 bg-sky-50 text-sky-700",
    contacted: "border-amber-200 bg-amber-50 text-amber-700",
    brief_pending: "border-violet-200 bg-violet-50 text-violet-700",
    budget_pending: "border-violet-200 bg-violet-50 text-violet-700",
    budget_sent: "border-indigo-200 bg-indigo-50 text-indigo-700",
    awaiting_approval: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800",
    changes_requested: "border-orange-200 bg-orange-50 text-orange-800",
    docs_pending: "border-yellow-200 bg-yellow-50 text-yellow-800",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-800",
    converted: "border-rose-200 bg-rose-50 text-rose-700",
    in_followup: "border-violet-200 bg-violet-50 text-violet-700",
    qualified: "border-teal-200 bg-teal-50 text-teal-800",
    archived: "border-zinc-300 bg-zinc-100 text-zinc-700",
  };
  return map[value] ?? "border-zinc-200 bg-zinc-100 text-zinc-700";
};

const getBudgetStatusClassName = (status?: string) => {
  const value = String(status ?? "not_sent");
  if (value === "not_sent") return "border-zinc-200 bg-zinc-50 text-zinc-600";
  if (value === "sent") return "border-blue-200 bg-blue-50 text-blue-800";
  if (value === "awaiting_response") return "border-amber-200 bg-amber-50 text-amber-800";
  if (value === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (value === "rejected") return "border-red-200 bg-red-50 text-red-800";
  if (value === "needs_changes") return "border-orange-200 bg-orange-50 text-orange-800";
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
};

function serviceLabel(lead: LeadRow) {
  const s = lead.serviceInterest;
  if (Array.isArray(s) && s.length) return s.join(", ");
  return lead.inquiryType ?? "—";
}

export function LeadsTablePanel({ leads }: Props) {
  const router = useRouter();
  const toast = useAdminToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const statuses = useMemo(
    () => Array.from(new Set(leads.map((lead) => String(lead.status ?? "new")))).sort(),
    [leads],
  );
  const inquiryTypes = useMemo(
    () => Array.from(new Set(leads.map((lead) => String(lead.inquiryType ?? "consulta_general")))).sort(),
    [leads],
  );

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const name = String(lead.fullName ?? "").toLowerCase();
      const email = String(lead.email ?? "").toLowerCase();
      const company = String(lead.company ?? "").toLowerCase();
      const type = String(lead.inquiryType ?? "consulta_general");
      const status = String(lead.status ?? "new");

      const matchesQuery =
        !normalizedQuery ||
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        company.includes(normalizedQuery) ||
        type.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesType = typeFilter === "all" || type === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [leads, query, statusFilter, typeFilter]);

  const deleteLeadDisplay = deleteTarget
    ? String(deleteTarget.fullName || deleteTarget.email || deleteTarget.id)
    : "";

  const runDeleteLead = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${deleteTarget.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo eliminar el lead.");
        return;
      }
      setDeleteTarget(null);
      toast.success("Lead eliminado correctamente.");
      router.refresh();
    } catch {
      toast.error("Error de red al eliminar.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400"
          >
            <RiAddLine className="size-4 shrink-0" aria-hidden />
            Nuevo lead manual
          </button>
          <button
            type="button"
            onClick={() => {
              router.refresh();
              toast.success("Tabla actualizada manualmente.");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            <RiRefreshLine className="size-4 shrink-0" aria-hidden />
            Actualizar tabla
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nombre, email, empresa..."
            className="w-[220px] rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          >
            <option value="all">Todos los estados</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {leadPipelineStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          >
            <option value="all">Todos los tipos</option>
            {inquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3 font-medium text-zinc-600">Nombre</th>
              <th className="p-3 font-medium text-zinc-600">Email</th>
              <th className="p-3 font-medium text-zinc-600">Empresa</th>
              <th className="p-3 font-medium text-zinc-600">Servicio</th>
              <th className="p-3 font-medium text-zinc-600">Estado lead</th>
              <th className="p-3 font-medium text-zinc-600">Presupuesto</th>
              <th className="p-3 font-medium text-zinc-600">Último envío</th>
              <th className="p-3 font-medium text-zinc-600">Resp.</th>
              <th className="p-3 font-medium text-zinc-600">Alta</th>
              <th className="p-3 font-medium text-zinc-600">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={10}>
                  No hay resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-zinc-100/90 transition hover:bg-zinc-50/70 last:border-b-0">
                  <td className="p-3 font-medium text-zinc-900">{lead.fullName}</td>
                  <td className="p-3 text-zinc-700">{lead.email ?? "—"}</td>
                  <td className="p-3 text-zinc-600">{lead.company ?? "—"}</td>
                  <td className="max-w-[160px] truncate p-3 text-zinc-600">{serviceLabel(lead)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClassName(
                        lead.status,
                      )}`}
                    >
                      {leadPipelineStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getBudgetStatusClassName(
                        lead.budgetStatus,
                      )}`}
                    >
                      {leadBudgetStatusLabel(lead.budgetStatus)}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-500">{String(lead.latestBudgetSentAt ?? "").slice(0, 10) || "—"}</td>
                  <td className="max-w-[100px] truncate p-3 text-xs text-zinc-600" title={lead.assignedToUserId}>
                    {lead.assignedToUserId ? lead.assignedToUserId.slice(0, 8) + "…" : lead.assignedTo || "—"}
                  </td>
                  <td className="p-3 text-zinc-600">{String(lead.createdAt ?? "").slice(0, 10)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center gap-0.5 font-medium text-[#db2777] hover:underline"
                      >
                        Ver
                        <RiArrowRightSLine className="size-3.5" aria-hidden />
                      </Link>
                      {String(lead.status ?? "") === "converted" && lead.convertedToClientId ? (
                        <Link
                          href={`/admin/clients/${lead.convertedToClientId}`}
                          className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                        >
                          Ver cliente
                          <RiArrowRightSLine className="size-3.5" aria-hidden />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(lead)}
                        className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 hover:text-red-900 hover:underline"
                      >
                        <RiDeleteBinLine className="size-3.5" aria-hidden />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="¿Eliminar este lead?"
        description={
          deleteTarget
            ? `Se va a borrar permanentemente «${deleteLeadDisplay}» y todo lo asociado (notas y presupuestos del lead). Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        danger
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={() => void runDeleteLead()}
      />

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-zinc-100 p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Nuevo lead manual</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                <RiCloseLine className="size-3.5" aria-hidden />
                Cerrar
              </button>
            </div>
            <CreateLeadForm
              hideHeader
              onSuccess={() => {
                setIsModalOpen(false);
                toast.success("Lead creado correctamente.");
              }}
              onError={(message) => {
                toast.error(message);
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
