"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { getClientDisplayName } from "@/types/client";

type ClientDoc = Record<string, unknown> & { id: string };

type TabId = "summary" | "links" | "invoices" | "payments" | "notes" | "activity";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

type AdminUser = { id: string; fullName: string; email: string };

type Props = { clientId: string };

export function ClientDetailShell({ clientId }: Props) {
  const toast = useAdminToast();
  const [tab, setTab] = useState<TabId>("summary");
  const [client, setClient] = useState<ClientDoc | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [payTotals, setPayTotals] = useState<{ totalsByUser: Record<string, number>; totalPaid: number } | null>(
    null,
  );
  const [notes, setNotes] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [activity, setActivity] = useState<Array<Record<string, unknown> & { id: string }>>([]);

  const onFlash = useCallback(
    (f: { type: "ok" | "err"; text: string } | null) => {
      if (!f) return;
      if (f.type === "ok") toast.success(f.text);
      else toast.error(f.text);
    },
    [toast],
  );

  const loadClient = useCallback(async () => {
    setLoadError("");
    const res = await fetch(`/api/admin/clients/${clientId}`, { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; client?: ClientDoc; error?: string };
    if (!res.ok || !json.ok || !json.client) {
      setLoadError(json.error ?? "No pudimos cargar el cliente.");
      return;
    }
    setClient(json.client);
  }, [clientId]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; users?: AdminUser[] };
    if (json.ok && json.users) setUsers(json.users);
  }, []);

  useEffect(() => {
    void loadClient();
    void loadUsers();
  }, [loadClient, loadUsers]);

  const loadTabData = useCallback(async () => {
    if (tab === "summary") return;
    if (tab === "payments") {
      const [payRes, invRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}/payments`, { cache: "no-store" }),
        fetch(`/api/admin/clients/${clientId}/invoices`, { cache: "no-store" }),
      ]);
      const payJson = (await payRes.json()) as Record<string, unknown>;
      const invJson = (await invRes.json()) as Record<string, unknown>;
      if (payJson.ok) {
        setPayments((payJson.items as typeof payments) ?? []);
        setPayTotals({
          totalsByUser: (payJson.totalsByUser as Record<string, number>) ?? {},
          totalPaid: Number(payJson.totalPaid ?? 0),
        });
      }
      if (invJson.ok) setInvoices((invJson.items as typeof invoices) ?? []);
      return;
    }
    const path = tab === "activity" ? "activity" : tab;
    const res = await fetch(`/api/admin/clients/${clientId}/${path}`, { cache: "no-store" });
    const json = (await res.json()) as Record<string, unknown>;
    if (!json.ok) return;
    if (tab === "links") setLinks((json.items as typeof links) ?? []);
    if (tab === "invoices") setInvoices((json.items as typeof invoices) ?? []);
    if (tab === "notes") setNotes((json.items as typeof notes) ?? []);
    if (tab === "activity") setActivity((json.items as typeof activity) ?? []);
  }, [clientId, tab]);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  const name = client ? getClientDisplayName(client) : "Cliente";

  const userName = (uid: string) => users.find((u) => u.id === uid)?.fullName || uid.slice(0, 8);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-zinc-500">
        <Link href="/admin/clients" className="hover:text-zinc-800 hover:underline">
          Clientes
        </Link>
        <span>/</span>
        <span className="text-zinc-800">{name}</span>
      </div>

      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      {!client && !loadError ? <p className="text-sm text-zinc-600">Cargando...</p> : null}

      {client ? (
        <>
          <header className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start gap-4">
              {client.logoURL ? (
                <img
                  src={String(client.logoURL)}
                  alt={`${name} logo`}
                  className="h-14 w-14 rounded-md border border-zinc-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-zinc-300 text-[10px] text-zinc-500">
                  Sin logo
                </div>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900">{name}</h1>
                <p className="mt-1 text-sm text-zinc-600">{String(client.email ?? "")}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Tel: <strong className="text-zinc-800">{String(client.phone ?? "—")}</strong>
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Estado: <strong className="text-zinc-800">{String(client.status ?? "—")}</strong> · Alta{" "}
                  {String(client.createdAt ?? "").slice(0, 10)}
                </p>
              </div>
            </div>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
            {(
              [
                ["summary", "Resumen"],
                ["links", "Links"],
                ["invoices", "Facturación"],
                ["payments", "Pagos"],
                ["notes", "Notas"],
                ["activity", "Actividad"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  tab === id ? "bg-rose-300 text-zinc-900" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "summary" ? (
            <ClientSummaryTab
              client={client}
              clientId={clientId}
              users={users}
              onSaved={() => {
                void loadClient();
                toast.success("Cambios guardados.");
              }}
              onError={(t) => toast.error(t)}
            />
          ) : null}

          {tab === "links" ? (
            <LinksTab
              clientId={clientId}
              rows={links}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
            />
          ) : null}

          {tab === "invoices" ? (
            <InvoicesTab
              clientId={clientId}
              rows={invoices}
              users={users}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
            />
          ) : null}

          {tab === "payments" ? (
            <PaymentsTab
              clientId={clientId}
              users={users}
              rows={payments}
              payTotals={payTotals}
              invoices={invoices}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
              userName={userName}
            />
          ) : null}

          {tab === "notes" ? (
            <NotesTab clientId={clientId} rows={notes} onRefresh={() => void loadTabData()} onFlash={onFlash} />
          ) : null}

          {tab === "activity" ? <ActivityTab rows={activity} userName={userName} /> : null}
        </>
      ) : null}
    </section>
  );
}

function ClientSummaryTab({
  client,
  clientId,
  users,
  onSaved,
  onError,
}: {
  client: ClientDoc;
  clientId: string;
  users: AdminUser[];
  onSaved: () => void;
  onError: (t: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    fullName: String(client.fullName ?? client.displayName ?? ""),
    email: String(client.email ?? ""),
    phone: String(client.phone ?? ""),
    company: String(client.company ?? ""),
    brandName: String(client.brandName ?? client.company ?? ""),
    status: String(client.status ?? "active"),
    onboardingStatus: String(client.onboardingStatus ?? "pending"),
    billingType: String(client.billingType ?? client.billingModel ?? "monthly"),
    monthlyFee: String(client.monthlyFee ?? (client.pricing as { amount?: number })?.amount ?? 0),
    currency: String(client.currency ?? "USD"),
    invoiceStatus: String(client.invoiceStatus ?? "not_sent"),
    nextInvoiceDate: String(client.nextInvoiceDate ?? ""),
    accountManagerUserId: String(client.accountManagerUserId ?? ""),
    clientType: String(client.clientType ?? "recurring"),
    billingFrequency: String(client.billingFrequency ?? "monthly"),
    health: String(client.health ?? "healthy"),
    tags: Array.isArray(client.tags) ? (client.tags as string[]).join(", ") : "",
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone,
          company: form.company,
          brandName: form.brandName,
          status: form.status,
          onboardingStatus: form.onboardingStatus,
          billingType: form.billingType,
          monthlyFee: Number(form.monthlyFee) || 0,
          currency: form.currency,
          invoiceStatus: form.invoiceStatus,
          nextInvoiceDate: form.nextInvoiceDate,
          accountManagerUserId: form.accountManagerUserId,
          clientType: form.clientType,
          billingFrequency: form.billingFrequency,
          health: form.health,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onError(j.error ?? "No se pudo guardar.");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onError("Solo se permiten imágenes.");
      return;
    }
    if (file.size > 1024 * 1024) {
      onError("El logo supera 1MB.");
      return;
    }

    const isSquare = await new Promise<boolean>((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        resolve(img.width === img.height);
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        resolve(false);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
    if (!isSquare) {
      onError("El logo debe ser formato 1:1.");
      return;
    }

    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/admin/clients/${clientId}/logo`, {
        method: "POST",
        body: fd,
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onError(j.error ?? "No se pudo subir el logo.");
        return;
      }
      onSaved();
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Datos generales</h2>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <p className="mb-2 text-xs font-medium text-zinc-600">Logo del cliente (1:1, máx. 1MB)</p>
        <div className="flex items-center gap-3">
          {client.logoURL ? (
            <img
              src={String(client.logoURL)}
              alt="Logo cliente"
              className="h-14 w-14 rounded-md border border-zinc-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-dashed border-zinc-300 text-[10px] text-zinc-500">
              Sin logo
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100">
            {uploadingLogo ? "Subiendo..." : "Subir logo"}
            <input
              type="file"
              accept="image/*"
              disabled={uploadingLogo}
              className="hidden"
              onChange={(e) => void uploadLogo(e.target.files?.[0])}
            />
          </label>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Nombre
          <input className={inputClass} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Email
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Teléfono
          <input className={inputClass} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Empresa
          <input className={inputClass} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Marca
          <input className={inputClass} value={form.brandName} onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Estado cliente
          <select className={inputClass} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="pending_onboarding">pending_onboarding</option>
            <option value="inactive">inactive</option>
            <option value="archived">archived</option>
            <option value="completed">completed (legado)</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Onboarding
          <select
            className={inputClass}
            value={form.onboardingStatus}
            onChange={(e) => setForm((f) => ({ ...f, onboardingStatus: e.target.value }))}
          >
            <option value="pending">pending</option>
            <option value="in_progress">in_progress</option>
            <option value="completed">completed</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Tipo de cobro
          <select className={inputClass} value={form.billingType} onChange={(e) => setForm((f) => ({ ...f, billingType: e.target.value }))}>
            <option value="monthly">monthly</option>
            <option value="one_time">one_time</option>
            <option value="hourly">hourly</option>
            <option value="custom">custom</option>
            <option value="monthly_retainer">monthly_retainer (legado)</option>
            <option value="hybrid">hybrid (legado)</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Fee mensual / referencia
          <input className={inputClass} value={form.monthlyFee} onChange={(e) => setForm((f) => ({ ...f, monthlyFee: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Moneda
          <select className={inputClass} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Estado factura (resumen)
          <select
            className={inputClass}
            value={form.invoiceStatus}
            onChange={(e) => setForm((f) => ({ ...f, invoiceStatus: e.target.value }))}
          >
            <option value="not_sent">not_sent</option>
            <option value="sent">sent</option>
            <option value="paid">paid</option>
            <option value="overdue">overdue</option>
            <option value="draft">draft</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Próxima facturación
          <input
            className={inputClass}
            type="date"
            value={form.nextInvoiceDate ? form.nextInvoiceDate.slice(0, 10) : ""}
            onChange={(e) => setForm((f) => ({ ...f, nextInvoiceDate: e.target.value }))}
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Responsable de cuenta
          <select
            className={inputClass}
            value={form.accountManagerUserId}
            onChange={(e) => setForm((f) => ({ ...f, accountManagerUserId: e.target.value }))}
          >
            <option value="">—</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName || u.email}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Tipo de cliente
          <select className={inputClass} value={form.clientType} onChange={(e) => setForm((f) => ({ ...f, clientType: e.target.value }))}>
            <option value="one_time">one_time</option>
            <option value="recurring">recurring</option>
            <option value="vip">vip</option>
            <option value="internal">internal</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Frecuencia facturación
          <select
            className={inputClass}
            value={form.billingFrequency}
            onChange={(e) => setForm((f) => ({ ...f, billingFrequency: e.target.value }))}
          >
            <option value="monthly">monthly</option>
            <option value="biweekly">biweekly</option>
            <option value="per_project">per_project</option>
            <option value="per_milestone">per_milestone</option>
            <option value="custom">custom</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Health
          <select className={inputClass} value={form.health} onChange={(e) => setForm((f) => ({ ...f, health: e.target.value }))}>
            <option value="healthy">healthy</option>
            <option value="at_risk">at_risk</option>
            <option value="delayed">delayed</option>
            <option value="inactive">inactive</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
          Tags (coma)
          <input className={inputClass} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

function LinksTab({
  clientId,
  rows,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  rows: Array<Record<string, unknown> & { id: string }>;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("drive");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [togglingLinkId, setTogglingLinkId] = useState<string | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setCategory("drive");
    setDescription("");
    setEditingLinkId(null);
  };

  const startEdit = (r: Record<string, unknown> & { id: string }) => {
    setEditingLinkId(r.id);
    setTitle(String(r.title ?? ""));
    setUrl(String(r.url ?? ""));
    setCategory(String(r.category ?? "drive"));
    setDescription(String(r.description ?? ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    if (!trimmedTitle || !trimmedUrl) {
      onFlash({ type: "err", text: "Completá título y URL." });
      return;
    }
    let href = trimmedUrl;
    if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`;
    }
    setSaving(true);
    try {
      const payload = {
        title: trimmedTitle,
        url: href,
        category,
        description: description.trim() || "",
      };
      const endpoint = editingLinkId
        ? `/api/admin/clients/${clientId}/links/${editingLinkId}`
        : `/api/admin/clients/${clientId}/links`;
      const method = editingLinkId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo guardar el link." });
        return;
      }
      const wasEdit = Boolean(editingLinkId);
      resetForm();
      onFlash({
        type: "ok",
        text: wasEdit ? "Link actualizado." : "Link agregado.",
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (linkId: string, nextActive: boolean) => {
    if (togglingLinkId) return;
    setTogglingLinkId(linkId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo actualizar el estado." });
        return;
      }
      onFlash({
        type: "ok",
        text: nextActive ? "Link reactivado." : "Link desactivado.",
      });
      onRefresh();
    } finally {
      setTogglingLinkId(null);
    }
  };

  const runDelete = async () => {
    if (!deleteConfirm) return;
    const { id: lid } = deleteConfirm;
    setDeletingLinkId(lid);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/links/${lid}`, { method: "DELETE" });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar." });
        return;
      }
      onFlash({ type: "ok", text: "Link eliminado." });
      if (editingLinkId === lid) resetForm();
      setDeleteConfirm(null);
      onRefresh();
    } finally {
      setDeletingLinkId(null);
    }
  };

  const selectLinkClass = `${inputClass} pr-8`;

  return (
    <div className="grid gap-4">
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="¿Eliminar este link?"
        description={
          deleteConfirm
            ? `Se borrará «${deleteConfirm.title}» y se actualizará el contador del cliente.`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={Boolean(deletingLinkId)}
        onCancel={() => !deletingLinkId && setDeleteConfirm(null)}
        onConfirm={() => void runDelete()}
      />

      <form
        onSubmit={(e) => void submit(e)}
        className="rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">
          {editingLinkId ? "Editar link" : "Nuevo link"}
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input
            className={inputClass}
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            autoComplete="off"
          />
          <input
            className={inputClass}
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={saving}
            autoComplete="off"
          />
          <select
            className={selectLinkClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
          >
            {["drive", "slides", "sheets", "figma", "invoice", "brief", "assets", "other"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Nota"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            autoComplete="off"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
          >
            {saving ? (editingLinkId ? "Guardando..." : "Agregando...") : editingLinkId ? "Guardar cambios" : "Agregar"}
          </button>
          {editingLinkId ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => resetForm()}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
            >
              Cancelar edición
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">URL</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3 w-12"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const inactive = r.active === false;
              const rowBusy = togglingLinkId === r.id;
              const href = String(r.url ?? "#");
              return (
                <tr
                  key={r.id}
                  className={`border-b border-zinc-100 last:border-b-0 ${
                    editingLinkId === r.id ? "bg-rose-100" : inactive ? "bg-zinc-50/90 text-zinc-600" : ""
                  }`}
                >
                  <td className="p-3 font-medium">{String(r.title ?? "")}</td>
                  <td className="p-3">{String(r.category ?? "")}</td>
                  <td className="p-3">
                    {inactive ? (
                      <span className="text-zinc-500">—</span>
                    ) : (
                      <a
                        href={href}
                        className="cursor-pointer font-medium text-[#db2777] underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir
                      </a>
                    )}
                  </td>
                  <td className="p-3">
                    {inactive ? (
                      <span className="inline-flex rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                        Desactivado
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-zinc-500">{String(r.createdAt ?? "").slice(0, 10)}</td>
                  <td className="p-3">
                    <RowActionsMenu
                      items={[
                        {
                          label: "Editar",
                          onClick: () => startEdit(r),
                        },
                        {
                          label: inactive ? "Reactivar" : "Desactivar",
                          onClick: () => void setActive(r.id, inactive),
                        },
                        {
                          label: "Eliminar",
                          danger: true,
                          onClick: () =>
                            setDeleteConfirm({ id: r.id, title: String(r.title ?? "Link") }),
                        },
                      ]}
                    />
                    {rowBusy ? (
                      <span className="mt-1 block text-[10px] text-zinc-500">Actualizando…</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function InvoicesTab({
  clientId,
  rows,
  users,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  rows: Array<Record<string, unknown> & { id: string }>;
  users: AdminUser[];
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [periodLabel, setPeriodLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("draft");
  const [invoiceLink, setInvoiceLink] = useState("");
  const [collectionEmailSent, setCollectionEmailSent] = useState(false);
  const [invoiceEmailSent, setInvoiceEmailSent] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [receivedByUserId, setReceivedByUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const resetForm = () => {
    setPeriodLabel("");
    setAmount("");
    setCurrency("USD");
    setStatus("draft");
    setInvoiceLink("");
    setCollectionEmailSent(false);
    setInvoiceEmailSent(false);
    setIsPaid(false);
    setReceivedByUserId("");
    setEditingInvoiceId(null);
  };

  const startEdit = (row: Record<string, unknown> & { id: string }) => {
    setEditingInvoiceId(row.id);
    setPeriodLabel(String(row.periodLabel ?? ""));
    setAmount(String(row.amount ?? ""));
    setCurrency(String(row.currency ?? "USD"));
    setStatus(String(row.status ?? "draft"));
    setInvoiceLink(String(row.invoiceLink ?? ""));
    setCollectionEmailSent(Boolean(row.collectionEmailSent));
    setInvoiceEmailSent(Boolean(row.invoiceEmailSent));
    setIsPaid(Boolean(row.isPaid));
    setReceivedByUserId(String(row.receivedByUserId ?? ""));
  };

  const remove = async (invoiceId: string) => {
    setDeletingInvoiceId(invoiceId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/invoices/${invoiceId}`, {
        method: "DELETE",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar." });
        return;
      }
      onFlash({ type: "ok", text: "Factura eliminada." });
      if (editingInvoiceId === invoiceId) resetForm();
      onRefresh();
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const add = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        periodLabel,
        amount: Number(amount) || 0,
        currency,
        status,
        invoiceLink: invoiceLink || undefined,
        collectionEmailSent,
        invoiceEmailSent,
        isPaid,
        receivedByUserId: receivedByUserId || undefined,
      };
      const endpoint = editingInvoiceId
        ? `/api/admin/clients/${clientId}/invoices/${editingInvoiceId}`
        : `/api/admin/clients/${clientId}/invoices`;
      const method = editingInvoiceId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "Error" });
        return;
      }
      resetForm();
      onFlash({ type: "ok", text: editingInvoiceId ? "Factura actualizada." : "Factura registrada." });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Nueva factura</p>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <input className={inputClass} placeholder="Ej. Marzo 2026" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} />
          <input className={inputClass} placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="paid">paid</option>
            <option value="overdue">overdue</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input className={`${inputClass} md:col-span-2`} placeholder="Link factura (opcional)" value={invoiceLink} onChange={(e) => setInvoiceLink(e.target.value)} />
          <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
            <input type="checkbox" checked={collectionEmailSent} onChange={(e) => setCollectionEmailSent(e.target.checked)} />
            Mail de cobro enviado
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
            <input type="checkbox" checked={invoiceEmailSent} onChange={(e) => setInvoiceEmailSent(e.target.checked)} />
            Factura enviada
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
            <input type="checkbox" checked={isPaid} onChange={(e) => setIsPaid(e.target.checked)} />
            Pagado
          </label>
          {isPaid ? (
            <select
              className={inputClass}
              value={receivedByUserId}
              onChange={(e) => setReceivedByUserId(e.target.value)}
            >
              <option value="">Quién recibió el pago</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <button
          type="button"
          disabled={saving || !periodLabel.trim()}
          onClick={() => void add()}
          className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
        >
          {saving ? "Guardando..." : editingInvoiceId ? "Guardar cambios" : "Guardar"}
        </button>
        {editingInvoiceId ? (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-800"
          >
            Cancelar edición
          </button>
        ) : null}
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3">Período</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Enviada</th>
              <th className="p-3">Mail cobro</th>
              <th className="p-3">Factura env.</th>
              <th className="p-3">Pagado</th>
              <th className="p-3">Link</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className={`border-b border-zinc-100 ${editingInvoiceId === r.id ? "bg-rose-100" : ""}`}
              >
                <td className="p-3">{String(r.periodLabel ?? "")}</td>
                <td className="p-3">
                  {String(r.currency ?? "")} {String(r.amount ?? "")}
                </td>
                <td className="p-3">{String(r.status ?? "")}</td>
                <td className="p-3 text-zinc-500">{String(r.sentAt ?? "").slice(0, 10)}</td>
                <td className="p-3 text-zinc-700">{Boolean(r.collectionEmailSent) ? "si" : "no"}</td>
                <td className="p-3 text-zinc-700">{Boolean(r.invoiceEmailSent) ? "si" : "no"}</td>
                <td className="p-3 text-zinc-700">{Boolean(r.isPaid) ? "si" : "no"}</td>
                <td className="p-3">
                  {r.invoiceLink ? (
                    <a href={String(r.invoiceLink)} className="text-[#db2777] hover:underline" target="_blank" rel="noreferrer">
                      ver
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(r)}
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-700"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={deletingInvoiceId === r.id}
                      onClick={() => void remove(r.id)}
                      className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 disabled:opacity-60"
                    >
                      {deletingInvoiceId === r.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentsTab({
  clientId,
  users,
  rows,
  payTotals,
  invoices,
  onRefresh,
  onFlash,
  userName,
}: {
  clientId: string;
  users: AdminUser[];
  rows: Array<Record<string, unknown> & { id: string }>;
  payTotals: { totalsByUser: Record<string, number>; totalPaid: number } | null;
  invoices: Array<Record<string, unknown> & { id: string }>;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
  userName: (uid: string) => string;
}) {
  const [totalAmount, setTotalAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentType, setPaymentType] = useState("full_to_one_person");
  const [receivedByUserId, setReceivedByUserId] = useState("");
  const [relatedInvoiceId, setRelatedInvoiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [splitLines, setSplitLines] = useState<{ userId: string; amount: string }[]>([{ userId: "", amount: "" }]);

  const addSplitRow = () => setSplitLines((s) => [...s, { userId: "", amount: "" }]);

  const submit = async () => {
    const body: Record<string, unknown> = {
      totalAmount: Number(totalAmount) || 0,
      currency,
      receivedAt: new Date(receivedAt + "T12:00:00.000Z").toISOString(),
      paymentType,
      receivedByUserId,
      relatedInvoiceId,
      notes,
    };
    if (paymentType !== "full_to_one_person") {
      body.splits = splitLines
        .filter((l) => l.userId && l.amount)
        .map((l) => ({ userId: l.userId, amount: Number(l.amount) }));
    }
    const res = await fetch(`/api/admin/clients/${clientId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !j.ok) {
      onFlash({ type: "err", text: j.error ?? "Error" });
      return;
    }
    setTotalAmount("");
    setNotes("");
    setSplitLines([{ userId: "", amount: "" }]);
    onFlash({ type: "ok", text: "Pago registrado." });
    onRefresh();
  };

  return (
    <div className="grid gap-4">
      {payTotals ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-semibold text-zinc-900">Totales por usuaria</p>
          <ul className="mt-2 space-y-1 text-zinc-700">
            {Object.entries(payTotals.totalsByUser).map(([uid, amt]) => (
              <li key={uid}>
                {userName(uid)}: {amt.toLocaleString("es-AR")}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-zinc-600">Total cobrado: {payTotals.totalPaid.toLocaleString("es-AR")}</p>
        </div>
      ) : null}
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Registrar pago</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input className={inputClass} placeholder="Total" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
          <input className={inputClass} type="date" value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} />
          <select className={inputClass} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
            <option value="full_to_one_person">Una persona cobra todo</option>
            <option value="split_between_people">Dividido</option>
            <option value="custom_split">Dividido (custom)</option>
          </select>
          {paymentType === "full_to_one_person" ? (
            <select className={inputClass} value={receivedByUserId} onChange={(e) => setReceivedByUserId(e.target.value)}>
              <option value="">Quién cobró</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName || u.email}
                </option>
              ))}
            </select>
          ) : (
            <div className="md:col-span-2 grid gap-2">
              {splitLines.map((line, i) => (
                <div key={i} className="flex flex-wrap gap-2">
                  <select className={inputClass} value={line.userId} onChange={(e) => {
                    const v = e.target.value;
                    setSplitLines((s) => s.map((x, j) => (j === i ? { ...x, userId: v } : x)));
                  }}>
                    <option value="">Usuario</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.email}
                      </option>
                    ))}
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Monto"
                    value={line.amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSplitLines((s) => s.map((x, j) => (j === i ? { ...x, amount: v } : x)));
                    }}
                  />
                </div>
              ))}
              <button type="button" onClick={addSplitRow} className="text-xs font-medium text-[#db2777]">
                + línea
              </button>
            </div>
          )}
          <select className={inputClass} value={relatedInvoiceId} onChange={(e) => setRelatedInvoiceId(e.target.value)}>
            <option value="">Factura relacionada (opc.)</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {String(inv.periodLabel ?? inv.id)}
              </option>
            ))}
          </select>
          <input className={`${inputClass} md:col-span-2`} placeholder="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="button" onClick={() => void submit()} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900">
          Registrar pago
        </button>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Total</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100">
                <td className="p-3">{String(r.receivedAt ?? "").slice(0, 10)}</td>
                <td className="p-3">
                  {String(r.currency ?? "")} {String(r.totalAmount ?? "")}
                </td>
                <td className="p-3">{String(r.paymentType ?? "")}</td>
                <td className="p-3 text-xs text-zinc-600">
                  {String(r.paymentType) === "full_to_one_person"
                    ? userName(String(r.receivedByUserId ?? ""))
                    : JSON.stringify(r.splits ?? [])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotesTab({
  clientId,
  rows,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  rows: Array<Record<string, unknown> & { id: string }>;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [saving, setSaving] = useState(false);
  const inFlightRef = useRef(false);

  const add = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || saving || inFlightRef.current) return;
    inFlightRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed, type }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "Error" });
        return;
      }
      setContent("");
      onFlash({ type: "ok", text: "Nota agregada." });
      onRefresh();
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-4">
      <form
        className="rounded-2xl border border-zinc-200 bg-white p-4"
        onSubmit={(e) => void add(e)}
      >
        <textarea
          className={`${inputClass} min-h-[100px]`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí la nota…"
          aria-label="Contenido de la nota"
        />
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className={`${inputClass} sm:max-w-[200px]`}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Tipo de nota"
          >
            <option value="general">general</option>
            <option value="meeting">meeting</option>
            <option value="billing">billing</option>
            <option value="onboarding">onboarding</option>
            <option value="warning">warning</option>
          </select>
          <button
            type="submit"
            disabled={saving || !content.trim()}
            className="rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-semibold text-zinc-900 disabled:opacity-50 sm:ml-auto"
          >
            {saving ? "Guardando…" : "Agregar nota"}
          </button>
        </div>
      </form>
      <div className="grid gap-2">
        {rows.map((r) => (
          <article key={r.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
            <p className="text-xs text-zinc-500">
              {String(r.type ?? "")} · {String(r.createdAt ?? "").slice(0, 16)}
            </p>
            <p className="mt-1 text-zinc-800">{String(r.content ?? "")}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({
  rows,
  userName,
}: {
  rows: Array<Record<string, unknown> & { id: string }>;
  userName: (uid: string) => string;
}) {
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
          <AdminActionBadge action={String(r.action ?? "")} />
          <p className="mt-2 text-xs text-zinc-500">
            {String(r.createdAt ?? "").slice(0, 16)} · {userName(String(r.createdByUserId ?? ""))}
          </p>
          {r.message ? <p className="mt-1 text-zinc-700">{String(r.message)}</p> : null}
        </div>
      ))}
    </div>
  );
}
