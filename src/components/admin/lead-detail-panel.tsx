"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { leadBudgetStatusLabel, leadPipelineStatusLabel } from "@/lib/admin/lead-statuses";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

type LeadData = Record<string, unknown> & { id: string };
type LeadNote = { id: string; content?: string; type?: string; pinned?: boolean; createdBy?: string; createdAt?: string };
type LeadBudget = {
  id: string;
  title?: string;
  link?: string;
  amount?: number;
  currency?: string;
  sentAt?: string;
  status?: string;
  notes?: string;
};
type AdminUser = { id: string; fullName: string; email: string };

const PIPELINE_STATUSES = [
  "new",
  "contacted",
  "brief_pending",
  "budget_pending",
  "budget_sent",
  "awaiting_approval",
  "changes_requested",
  "docs_pending",
  "approved",
  "rejected",
  "converted",
  "in_followup",
  "qualified",
  "archived",
] as const;

const BUDGET_STATUSES = [
  "not_sent",
  "sent",
  "awaiting_response",
  "approved",
  "rejected",
  "needs_changes",
] as const;

type Props = { leadId: string };

export function LeadDetailPanel({ leadId }: Props) {
  const toast = useAdminToast();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [budgets, setBudgets] = useState<LeadBudget[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    inquiryType: "consulta_general",
    projectStage: "solo_idea",
    source: "sitio-web",
    preferredContactMethod: "email",
    budgetRange: "",
    message: "",
    tags: "",
    serviceInterest: "",
    internalNotes: "",
    missingDocuments: "",
  });
  const [status, setStatus] = useState("new");
  const [budgetStatus, setBudgetStatus] = useState("not_sent");
  const [assignedToUserId, setAssignedToUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("internal_note");
  const [notePinned, setNotePinned] = useState(false);
  const [error, setError] = useState("");

  const [bTitle, setBTitle] = useState("");
  const [bLink, setBLink] = useState("");
  const [bAmount, setBAmount] = useState("");
  const [bCurrency, setBCurrency] = useState("USD");
  const [bStatus, setBStatus] = useState("sent");
  const [bNotes, setBNotes] = useState("");
  const [bSaving, setBSaving] = useState(false);
  const noteInFlightRef = useRef(false);

  const loadLead = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/admin/leads/${leadId}`, { cache: "no-store" });
    const payload = (await response.json()) as {
      ok?: boolean;
      lead?: LeadData;
      notes?: LeadNote[];
      budgets?: LeadBudget[];
      error?: string;
    };
    if (!response.ok || !payload.ok || !payload.lead) {
      setError(payload.error ?? "No pudimos cargar el lead.");
      return;
    }
    setLead(payload.lead);
    setNotes(payload.notes ?? []);
    setBudgets(payload.budgets ?? []);
    setStatus(String(payload.lead.status ?? "new"));
    setBudgetStatus(String(payload.lead.budgetStatus ?? "not_sent"));
    setAssignedToUserId(String(payload.lead.assignedToUserId ?? ""));
    setFormValues({
      fullName: String(payload.lead.fullName ?? ""),
      email: String(payload.lead.email ?? ""),
      phone: String(payload.lead.phone ?? ""),
      company: String(payload.lead.company ?? ""),
      inquiryType: String(payload.lead.inquiryType ?? "consulta_general"),
      projectStage: String(payload.lead.projectStage ?? "solo_idea"),
      source: String(payload.lead.source ?? "sitio-web"),
      preferredContactMethod: String(payload.lead.preferredContactMethod ?? "email"),
      budgetRange: String(payload.lead.budgetRange ?? ""),
      message: String(payload.lead.message ?? ""),
      tags: Array.isArray(payload.lead.tags) ? (payload.lead.tags as string[]).join(", ") : "",
      serviceInterest: Array.isArray(payload.lead.serviceInterest)
        ? (payload.lead.serviceInterest as string[]).join(", ")
        : "",
      internalNotes: String(payload.lead.internalNotes ?? ""),
      missingDocuments: Array.isArray(payload.lead.missingDocuments)
        ? (payload.lead.missingDocuments as string[]).join(", ")
        : "",
    });
  }, [leadId]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; users?: AdminUser[] };
    if (json.ok && json.users) setUsers(json.users);
  }, []);

  useEffect(() => {
    void loadLead();
    void loadUsers();
  }, [loadLead, loadUsers]);

  const saveLead = async () => {
    setSaving(true);
    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formValues,
        status,
        budgetStatus,
        assignedToUserId,
        tags: formValues.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        serviceInterest: formValues.serviceInterest
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        missingDocuments: formValues.missingDocuments
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    const json = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !json.ok) {
      toast.error(json.error ?? "No pudimos guardar.");
      setSaving(false);
      return;
    }
    await loadLead();
    toast.success("Lead actualizado.");
    setSaving(false);
  };

  const addBudget = async () => {
    setBSaving(true);
    const sentAt = new Date().toISOString();
    const res = await fetch(`/api/admin/leads/${leadId}/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: bTitle,
        link: bLink,
        amount: bAmount ? Number(bAmount) : undefined,
        currency: bCurrency,
        sentAt,
        status: bStatus,
        notes: bNotes,
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast.error(json.error ?? "No pudimos agregar el presupuesto.");
      setBSaving(false);
      return;
    }
    setBTitle("");
    setBLink("");
    setBAmount("");
    setBNotes("");
    await loadLead();
    toast.success("Presupuesto agregado al historial.");
    setBSaving(false);
  };

  const addNote = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = noteContent.trim();
    if (!trimmed || addingNote || noteInFlightRef.current) return;
    noteInFlightRef.current = true;
    setAddingNote(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed, type: noteType, pinned: notePinned }),
      });
      if (!response.ok) {
        toast.error("No pudimos agregar la nota.");
        return;
      }
      setNoteContent("");
      setNoteType("internal_note");
      setNotePinned(false);
      await loadLead();
    } finally {
      noteInFlightRef.current = false;
      setAddingNote(false);
    }
  };

  const convertLead = async () => {
    let force = false;
    if (status !== "approved" && lead?.status !== "approved") {
      force = window.confirm(
        "Este lead no está en estado «approved». ¿Forzar conversión a cliente de todos modos?",
      );
      if (!force) return;
    }
    const response = await fetch(`/api/admin/leads/${leadId}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force }),
    });
    const json = (await response.json()) as { ok?: boolean; error?: string; code?: string; clientId?: string };
    if (!response.ok || !json.ok) {
      toast.error(json.error ?? "No pudimos convertir.");
      return;
    }
    await loadLead();
    toast.success(json.clientId ? `Cliente creado. ID: ${json.clientId}` : "Lead convertido.");
  };

  if (error && !lead) return <p className="text-sm text-red-700">{error}</p>;
  if (!lead) return <p className="text-sm text-zinc-600">Cargando lead...</p>;

  const convertedId = lead.convertedToClientId ? String(lead.convertedToClientId) : "";

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
        <Link href="/admin/leads" className="hover:text-zinc-800 hover:underline">
          Leads
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{String(lead.fullName ?? "Detalle")}</span>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{String(lead.fullName ?? "Lead")}</h1>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Datos del lead</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Nombre
              <input className={inputClass} value={formValues.fullName} onChange={(e) => setFormValues((p) => ({ ...p, fullName: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Email
              <input className={inputClass} type="email" value={formValues.email} onChange={(e) => setFormValues((p) => ({ ...p, email: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Teléfono
              <input className={inputClass} value={formValues.phone} onChange={(e) => setFormValues((p) => ({ ...p, phone: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Empresa
              <input className={inputClass} value={formValues.company} onChange={(e) => setFormValues((p) => ({ ...p, company: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Tipo de consulta
              <input className={inputClass} value={formValues.inquiryType} onChange={(e) => setFormValues((p) => ({ ...p, inquiryType: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Etapa / proyecto
              <input className={inputClass} value={formValues.projectStage} onChange={(e) => setFormValues((p) => ({ ...p, projectStage: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Fuente
              <input className={inputClass} value={formValues.source} onChange={(e) => setFormValues((p) => ({ ...p, source: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Contacto preferido
              <input
                className={inputClass}
                value={formValues.preferredContactMethod}
                onChange={(e) => setFormValues((p) => ({ ...p, preferredContactMethod: e.target.value }))}
              />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Presupuesto estimado (texto)
              <input className={inputClass} value={formValues.budgetRange} onChange={(e) => setFormValues((p) => ({ ...p, budgetRange: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600">
              Responsable (equipo)
              <select className={inputClass} value={assignedToUserId} onChange={(e) => setAssignedToUserId(e.target.value)}>
                <option value="">—</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
              Tags (coma)
              <input className={inputClass} value={formValues.tags} onChange={(e) => setFormValues((p) => ({ ...p, tags: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
              Servicios (coma)
              <input className={inputClass} value={formValues.serviceInterest} onChange={(e) => setFormValues((p) => ({ ...p, serviceInterest: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
              Documentos faltantes (coma)
              <input className={inputClass} value={formValues.missingDocuments} onChange={(e) => setFormValues((p) => ({ ...p, missingDocuments: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
              Notas internas (libreta)
              <textarea className={`${inputClass} min-h-[80px]`} value={formValues.internalNotes} onChange={(e) => setFormValues((p) => ({ ...p, internalNotes: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
              Mensaje
              <textarea className={`${inputClass} min-h-[120px]`} value={formValues.message} onChange={(e) => setFormValues((p) => ({ ...p, message: e.target.value }))} />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveLead()}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
            >
              {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-700 border-t-transparent" /> : null}
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>

        <div className="grid h-fit gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Pipeline</h2>
          <label className="grid gap-1 text-xs font-medium text-zinc-600">
            Estado comercial
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {PIPELINE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {leadPipelineStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-zinc-600">
            Estado presupuesto
            <select className={inputClass} value={budgetStatus} onChange={(e) => setBudgetStatus(e.target.value)}>
              {BUDGET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {leadBudgetStatusLabel(s)}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveLead()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-60"
            >
              {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" /> : null}
              {saving ? "Guardando estado..." : "Guardar estado / presupuesto"}
            </button>
            <button
              type="button"
              onClick={() => void convertLead()}
              disabled={status === "converted" || Boolean(convertedId)}
              className="rounded-xl bg-rose-200 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-50"
            >
              {convertedId ? "Ya convertido" : "Convertir a cliente"}
            </button>
            {convertedId ? (
              <Link href={`/admin/clients/${convertedId}`} className="text-sm font-medium text-[#db2777] hover:underline">
                Ver cliente vinculado
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Historial de presupuestos</h2>
        <p className="mt-1 text-xs text-zinc-500">Cada envío queda registrado; el último también actualiza los campos resumen del lead.</p>
        <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <input className={inputClass} placeholder="Título" value={bTitle} onChange={(e) => setBTitle(e.target.value)} />
          <input className={inputClass} placeholder="URL del presupuesto" value={bLink} onChange={(e) => setBLink(e.target.value)} />
          <input className={inputClass} placeholder="Monto (opcional)" value={bAmount} onChange={(e) => setBAmount(e.target.value)} />
          <select className={inputClass} value={bCurrency} onChange={(e) => setBCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <select className={inputClass} value={bStatus} onChange={(e) => setBStatus(e.target.value)}>
            <option value="sent">sent</option>
            <option value="awaiting_approval">awaiting_approval</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="needs_changes">needs_changes</option>
          </select>
          <input className={inputClass} placeholder="Notas" value={bNotes} onChange={(e) => setBNotes(e.target.value)} />
        </div>
        <button
          type="button"
          disabled={bSaving || !bTitle.trim() || !bLink.trim()}
          onClick={() => void addBudget()}
          className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-50"
        >
          {bSaving ? "Guardando..." : "Agregar presupuesto al historial"}
        </button>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-2">Título</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Enviado</th>
                <th className="p-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-zinc-500">
                    Todavía no hay presupuestos cargados.
                  </td>
                </tr>
              ) : (
                budgets.map((b) => (
                  <tr key={b.id} className="border-b border-zinc-100">
                    <td className="p-2">{String(b.title ?? "")}</td>
                    <td className="p-2">{String(b.status ?? "")}</td>
                    <td className="p-2 text-zinc-500">{String(b.sentAt ?? "").slice(0, 16)}</td>
                    <td className="p-2">
                      {b.link ? (
                        <a href={String(b.link)} className="text-[#db2777] hover:underline" target="_blank" rel="noreferrer">
                          abrir
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5"
        onSubmit={(e) => void addNote(e)}
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Notas internas</h2>
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
          <textarea
            className={`${inputClass} min-h-[88px]`}
            placeholder="Agregar nota..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <select className={inputClass} value={noteType} onChange={(e) => setNoteType(e.target.value)}>
            <option value="internal_note">Nota interna</option>
            <option value="call_summary">Resumen llamada</option>
            <option value="meeting">Meeting</option>
            <option value="followup">Follow up</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input type="checkbox" checked={notePinned} onChange={(e) => setNotePinned(e.target.checked)} />
            Fijada
          </label>
        </div>
        <button
          type="submit"
          disabled={addingNote || !noteContent.trim()}
          className="w-fit rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-50"
        >
          {addingNote ? "Guardando..." : "Agregar nota"}
        </button>
        <div className="grid gap-2">
          {notes.map((note) => (
            <article key={note.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
                <span className="rounded bg-zinc-200 px-2 py-0.5 uppercase">{note.type ?? "internal_note"}</span>
                <span>{String(note.createdAt ?? "").slice(0, 16)}</span>
              </div>
              <p className="mt-2 text-zinc-800">{note.content}</p>
            </article>
          ))}
        </div>
      </form>
    </section>
  );
}
