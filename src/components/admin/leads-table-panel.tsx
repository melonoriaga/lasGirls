"use client";

import {
  RiAddLine,
  RiCloseLine,
  RiRefreshLine,
} from "@remixicon/react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { CreateLeadForm } from "@/components/admin/create-lead-form";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
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
  visibilityScope?: "team" | "private";
  ownerUserId?: string;
  createdAt?: string;
};

type Props = {
  leads: LeadRow[];
  actorUid: string;
};

const getStatusClassName = (status?: string) => {
  const value = String(status ?? "new");
  const map: Record<string, string> = {
    new: "border-sky-200 bg-sky-50 text-sky-700",
    reviewed: "border-cyan-200 bg-cyan-50 text-cyan-700",
    awaiting_response: "border-amber-200 bg-amber-50 text-amber-700",
    lost: "border-red-200 bg-red-50 text-red-800",
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

export function LeadsTablePanel({ leads, actorUid }: Props) {
  const router = useRouter();
  const toast = useAdminToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<"all" | "mine">("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [convertTarget, setConvertTarget] = useState<LeadRow | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertForm, setConvertForm] = useState({
    clientName: "",
    company: "",
    contacts: "",
    emails: "",
    phones: "",
    service: "",
    accountManagerUserId: "",
    tags: "",
    initialNotes: "",
  });

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
      const isMine = String(lead.ownerUserId ?? "") === actorUid;
      const matchesScope = scopeFilter === "all" || isMine;

      return matchesQuery && matchesStatus && matchesType && matchesScope;
    });
  }, [actorUid, leads, query, scopeFilter, statusFilter, typeFilter]);
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const pageRows = filteredLeads.slice(startIdx, startIdx + pageSize);
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

  const openConvertModal = (lead: LeadRow) => {
    setConvertTarget(lead);
    setConvertForm({
      clientName: String(lead.fullName ?? ""),
      company: String(lead.company ?? ""),
      contacts: "",
      emails: String(lead.email ?? ""),
      phones: "",
      service: serviceLabel(lead) === "—" ? "" : serviceLabel(lead),
      accountManagerUserId: String(lead.assignedToUserId ?? ""),
      tags: "",
      initialNotes: "",
    });
  };

  const runConvertLead = async () => {
    if (!convertTarget) return;
    if (!convertForm.clientName.trim() || !convertForm.emails.trim()) {
      toast.error("Completá al menos nombre y email principal.");
      return;
    }
    setConvertLoading(true);
    try {
      const res = await fetch(`/api/admin/leads/${convertTarget.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          force: true,
          client: {
            clientName: convertForm.clientName.trim(),
            company: convertForm.company.trim(),
            contacts: convertForm.contacts
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
            emails: convertForm.emails
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            phones: convertForm.phones
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            service: convertForm.service
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            accountManagerUserId: convertForm.accountManagerUserId.trim(),
            tags: convertForm.tags
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            initialNotes: convertForm.initialNotes.trim(),
          },
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; clientId?: string };
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "No se pudo convertir el lead.");
        return;
      }
      toast.success("Lead convertido a cliente.");
      setConvertTarget(null);
      router.refresh();
    } catch {
      toast.error("Error de red al convertir.");
    } finally {
      setConvertLoading(false);
    }
  };

  return (
    <>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar nombre, email, empresa..."
            className="w-[220px] rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          />
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 pr-8 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
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
            onChange={(event) => {
              setTypeFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 pr-8 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          >
            <option value="all">Todos los tipos</option>
            {inquiryTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={scopeFilter}
            onChange={(event) => {
              setScopeFilter(event.target.value as "all" | "mine");
              setPage(1);
            }}
            className="rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 pr-8 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
          >
            <option value="all">Todos visibles</option>
            <option value="mine">Solo míos</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400"
          >
            <RiAddLine className="size-4 shrink-0" aria-hidden />
            Agregar
          </button>
          <button
            type="button"
            aria-label="Actualizar tabla"
            onClick={() => {
              router.refresh();
              toast.success("Tabla actualizada.");
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
          >
            <RiRefreshLine className="size-4 shrink-0" aria-hidden />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
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
            {pageRows.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={10}>
                  No hay resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              pageRows.map((lead) => (
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
                    <div className="flex items-center justify-end gap-2">
                      {lead.visibilityScope === "private" ? (
                        <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                          privado
                        </span>
                      ) : null}
                      <RowActionsMenu
                        items={[
                          { label: "Ver", href: `/admin/leads/${lead.id}` },
                          ...(String(lead.status ?? "") !== "converted"
                            ? [{ label: "Convertir a cliente", onClick: () => openConvertModal(lead) }]
                            : []),
                          ...(String(lead.status ?? "") === "converted" && lead.convertedToClientId
                            ? [{ label: "Ver cliente", href: `/admin/clients/${lead.convertedToClientId}` }]
                            : []),
                          { label: "Eliminar", onClick: () => setDeleteTarget(lead), danger: true },
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

      {totalItems > 0 ? (
        <nav aria-label="Paginación de leads" className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            Mostrando <strong>{startCount}</strong> a <strong>{endCount}</strong> de <strong>{totalItems}</strong> leads
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
              <label htmlFor="leads-per-page" className="sr-only">
                Items por página
              </label>
              <select
                id="leads-per-page"
                className="block w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2.5 text-sm text-zinc-800"
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

      {convertTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Convertir lead a cliente</h2>
              <button
                type="button"
                onClick={() => setConvertTarget(null)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Nombre cliente / empresa" value={convertForm.clientName} onChange={(e) => setConvertForm((p) => ({ ...p, clientName: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Empresa" value={convertForm.company} onChange={(e) => setConvertForm((p) => ({ ...p, company: e.target.value }))} />
              <textarea className="min-h-[72px] rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm md:col-span-2" placeholder="Personas de contacto (una por linea)" value={convertForm.contacts} onChange={(e) => setConvertForm((p) => ({ ...p, contacts: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Emails (separados por coma)" value={convertForm.emails} onChange={(e) => setConvertForm((p) => ({ ...p, emails: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Telefonos (separados por coma)" value={convertForm.phones} onChange={(e) => setConvertForm((p) => ({ ...p, phones: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Servicio (coma)" value={convertForm.service} onChange={(e) => setConvertForm((p) => ({ ...p, service: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm" placeholder="Responsable de cuenta (userId)" value={convertForm.accountManagerUserId} onChange={(e) => setConvertForm((p) => ({ ...p, accountManagerUserId: e.target.value }))} />
              <input className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm md:col-span-2" placeholder="Tags (coma)" value={convertForm.tags} onChange={(e) => setConvertForm((p) => ({ ...p, tags: e.target.value }))} />
              <textarea className="min-h-[72px] rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm md:col-span-2" placeholder="Notas internas iniciales" value={convertForm.initialNotes} onChange={(e) => setConvertForm((p) => ({ ...p, initialNotes: e.target.value }))} />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                disabled={convertLoading}
                onClick={() => void runConvertLead()}
                className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
              >
                {convertLoading ? "Convirtiendo..." : "Convertir a cliente"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
