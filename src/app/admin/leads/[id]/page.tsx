"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-[#ff5faf] focus:ring-2 focus:ring-[#ff5faf]/25";

type LeadData = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  inquiryType?: string;
  projectStage?: string;
  source?: string;
  preferredContactMethod?: string;
  budgetRange?: string;
  message?: string;
  assignedTo?: string;
  status?: string;
  convertedToClientId?: string;
  tags?: string[];
  serviceInterest?: string[];
};

type LeadNote = {
  id: string;
  content?: string;
  type?: string;
  pinned?: boolean;
  createdBy?: string;
  createdAt?: string;
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<LeadData | null>(null);
  const [notes, setNotes] = useState<LeadNote[]>([]);
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
    assignedTo: "",
    message: "",
    tags: "",
    serviceInterest: "",
  });
  const [status, setStatus] = useState("new");
  const [saving, setSaving] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteType, setNoteType] = useState("internal_note");
  const [notePinned, setNotePinned] = useState(false);
  const [error, setError] = useState("");
  const leadId = params.id;

  const loadLead = useCallback(async () => {
    setError("");
    const response = await fetch(`/api/admin/leads/${leadId}`, { cache: "no-store" });
    const payload = (await response.json()) as { ok?: boolean; lead?: LeadData; notes?: LeadNote[]; error?: string };
    if (!response.ok || !payload.ok || !payload.lead) {
      setError(payload.error ?? "No pudimos cargar el lead.");
      return;
    }
    setLead(payload.lead);
    setNotes(payload.notes ?? []);
    setStatus(String(payload.lead.status ?? "new"));
    setFormValues({
      fullName: payload.lead.fullName ?? "",
      email: payload.lead.email ?? "",
      phone: payload.lead.phone ?? "",
      company: payload.lead.company ?? "",
      inquiryType: payload.lead.inquiryType ?? "consulta_general",
      projectStage: payload.lead.projectStage ?? "solo_idea",
      source: payload.lead.source ?? "sitio-web",
      preferredContactMethod: payload.lead.preferredContactMethod ?? "email",
      budgetRange: payload.lead.budgetRange ?? "",
      assignedTo: payload.lead.assignedTo ?? "",
      message: payload.lead.message ?? "",
      tags: (payload.lead.tags ?? []).join(", "),
      serviceInterest: (payload.lead.serviceInterest ?? []).join(", "),
    });
  }, [leadId]);

  useEffect(() => {
    void loadLead();
  }, [loadLead]);

  const saveLead = async () => {
    setSaving(true);
    const response = await fetch(`/api/admin/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formValues,
        status,
        tags: formValues.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        serviceInterest: formValues.serviceInterest
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });
    if (!response.ok) {
      setError("No pudimos guardar los cambios del lead.");
      setSaving(false);
      return;
    }
    await loadLead();
    setSaving(false);
  };

  const updateStatus = async () => {
    const response = await fetch(`/api/admin/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError("No pudimos actualizar el estado del lead.");
      return;
    }
    await loadLead();
  };

  const addNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    const response = await fetch(`/api/admin/leads/${leadId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: noteContent, type: noteType, pinned: notePinned }),
    });
    if (!response.ok) {
      setError("No pudimos agregar la nota.");
      setAddingNote(false);
      return;
    }
    setNoteContent("");
    setNoteType("internal_note");
    setNotePinned(false);
    await loadLead();
    setAddingNote(false);
  };

  const convertLead = async () => {
    const response = await fetch(`/api/admin/leads/${leadId}/convert`, { method: "POST" });
    if (!response.ok) {
      setError("No pudimos convertir el lead a cliente.");
      return;
    }
    await loadLead();
  };

  if (error && !lead) return <p className="text-sm text-red-700">{error}</p>;
  if (!lead) return <p className="text-sm text-zinc-600">Cargando lead...</p>;

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
      <p className="text-sm text-zinc-600">{String(lead.message ?? "Sin mensaje.")}</p>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Datos del lead</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Nombre</label>
              <input
                className={inputClassName}
                value={formValues.fullName}
                onChange={(event) => setFormValues((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Email</label>
              <input
                className={inputClassName}
                value={formValues.email}
                onChange={(event) => setFormValues((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Teléfono</label>
              <input
                className={inputClassName}
                value={formValues.phone}
                onChange={(event) => setFormValues((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Empresa</label>
              <input
                className={inputClassName}
                value={formValues.company}
                onChange={(event) => setFormValues((prev) => ({ ...prev, company: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Tipo de consulta</label>
              <input
                className={inputClassName}
                value={formValues.inquiryType}
                onChange={(event) => setFormValues((prev) => ({ ...prev, inquiryType: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Etapa del proyecto</label>
              <input
                className={inputClassName}
                value={formValues.projectStage}
                onChange={(event) => setFormValues((prev) => ({ ...prev, projectStage: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Fuente</label>
              <input
                className={inputClassName}
                value={formValues.source}
                onChange={(event) => setFormValues((prev) => ({ ...prev, source: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Contacto preferido</label>
              <input
                className={inputClassName}
                value={formValues.preferredContactMethod}
                onChange={(event) =>
                  setFormValues((prev) => ({ ...prev, preferredContactMethod: event.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Presupuesto</label>
              <input
                className={inputClassName}
                value={formValues.budgetRange}
                onChange={(event) => setFormValues((prev) => ({ ...prev, budgetRange: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Asignado a</label>
              <input
                className={inputClassName}
                value={formValues.assignedTo}
                onChange={(event) => setFormValues((prev) => ({ ...prev, assignedTo: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Tags (coma separada)</label>
              <input
                className={inputClassName}
                value={formValues.tags}
                onChange={(event) => setFormValues((prev) => ({ ...prev, tags: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-600">Servicios (coma separada)</label>
              <input
                className={inputClassName}
                value={formValues.serviceInterest}
                onChange={(event) => setFormValues((prev) => ({ ...prev, serviceInterest: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs text-zinc-600">Mensaje</label>
              <textarea
                className={`${inputClassName} min-h-[120px]`}
                value={formValues.message}
                onChange={(event) => setFormValues((prev) => ({ ...prev, message: event.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveLead} disabled={saving}>
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>

        <div className="grid h-fit gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Pipeline</h2>
          <select className={inputClassName} value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="in_followup">in_followup</option>
            <option value="qualified">qualified</option>
            <option value="archived">archived</option>
            <option value="converted">converted</option>
          </select>
          <div className="grid gap-2">
            <Button onClick={updateStatus}>Guardar estado</Button>
            <Button onClick={convertLead} variant="outline" disabled={status === "converted"}>
              {status === "converted" ? "Ya convertido" : "Convertir a cliente"}
            </Button>
            {lead.convertedToClientId ? (
              <Link
                href={`/admin/clients/${lead.convertedToClientId}`}
                className="text-sm font-medium text-[#db2777] hover:underline"
              >
                Ver cliente vinculado
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Notas internas</h2>
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_120px_auto]">
          <textarea
            className={`${inputClassName} min-h-[88px]`}
            placeholder="Agregar nota interna..."
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
          <select className={inputClassName} value={noteType} onChange={(event) => setNoteType(event.target.value)}>
            <option value="internal_note">Nota interna</option>
            <option value="call_summary">Resumen llamada</option>
            <option value="meeting">Meeting</option>
            <option value="followup">Follow up</option>
          </select>
          <label className="flex items-center gap-2 text-xs text-zinc-600">
            <input
              type="checkbox"
              checked={notePinned}
              onChange={(event) => setNotePinned(event.target.checked)}
            />
            Fijada
          </label>
          <Button onClick={addNote} disabled={addingNote || !noteContent.trim()}>
            {addingNote ? "Guardando..." : "Agregar nota"}
          </Button>
        </div>
        <div className="grid gap-2">
          {notes.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no hay notas en este lead.</p>
          ) : (
            notes.map((note) => (
              <article key={note.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded bg-zinc-200 px-2 py-0.5 uppercase tracking-[0.1em] text-zinc-700">
                    {note.type ?? "internal_note"}
                  </span>
                  {note.pinned ? (
                    <span className="rounded bg-[#ffd6e8] px-2 py-0.5 uppercase tracking-[0.1em] text-zinc-900">
                      pinned
                    </span>
                  ) : null}
                  <span>{String(note.createdAt ?? "").slice(0, 16).replace("T", " ")}</span>
                  <span>·</span>
                  <span>{note.createdBy ?? "admin"}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-800">{note.content}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
