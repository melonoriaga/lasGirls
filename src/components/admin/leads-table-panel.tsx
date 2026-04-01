"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreateLeadForm } from "@/components/admin/create-lead-form";

type LeadRow = {
  id: string;
  fullName?: string;
  inquiryType?: string;
  status?: string;
  createdAt?: string;
};

type Props = {
  leads: LeadRow[];
};

const getStatusClassName = (status?: string) => {
  const value = String(status ?? "new");
  if (value === "new") return "border-sky-200 bg-sky-50 text-sky-700";
  if (value === "contacted") return "border-amber-200 bg-amber-50 text-amber-700";
  if (value === "in_followup") return "border-violet-200 bg-violet-50 text-violet-700";
  if (value === "qualified") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "converted") return "border-rose-200 bg-rose-50 text-rose-700";
  if (value === "archived") return "border-zinc-300 bg-zinc-100 text-zinc-700";
  return "border-zinc-200 bg-zinc-100 text-zinc-700";
};

export function LeadsTablePanel({ leads }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [flash, setFlash] = useState<{ type: "success" | "error"; text: string } | null>(null);
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
      const type = String(lead.inquiryType ?? "consulta_general");
      const status = String(lead.status ?? "new");

      const matchesQuery = !normalizedQuery || name.includes(normalizedQuery) || type.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesType = typeFilter === "all" || type === typeFilter;

      return matchesQuery && matchesStatus && matchesType;
    });
  }, [leads, query, statusFilter, typeFilter]);

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400"
          >
            Nuevo lead manual
          </button>
          <button
            type="button"
            onClick={() => {
              router.refresh();
              setFlash({ type: "success", text: "Tabla actualizada manualmente." });
            }}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
          >
            Actualizar tabla
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o tipo..."
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
                {status}
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

      {flash ? (
        <div
          className={`mt-3 rounded-xl px-3 py-2 text-sm ${
            flash.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {flash.text}
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3 font-medium text-zinc-600">Nombre</th>
              <th className="p-3 font-medium text-zinc-600">Tipo</th>
              <th className="p-3 font-medium text-zinc-600">Estado</th>
              <th className="p-3 font-medium text-zinc-600">Fecha</th>
              <th className="p-3 font-medium text-zinc-600">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={5}>
                  No hay resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-zinc-100/90 transition hover:bg-zinc-50/70 last:border-b-0">
                  <td className="p-3 font-medium text-zinc-900">{lead.fullName}</td>
                  <td className="p-3">{lead.inquiryType}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusClassName(
                        lead.status,
                      )}`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-3 text-zinc-600">{String(lead.createdAt ?? "").slice(0, 10)}</td>
                  <td className="p-3">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-[#db2777] hover:underline">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-zinc-100 p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Nuevo lead manual</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
              >
                Cerrar
              </button>
            </div>
            <CreateLeadForm
              hideHeader
              onSuccess={() => {
                setIsModalOpen(false);
                setFlash({ type: "success", text: "Lead creado correctamente." });
              }}
              onError={(message) => {
                setFlash({ type: "error", text: message });
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
