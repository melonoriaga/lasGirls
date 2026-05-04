"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { getClientDisplayName } from "@/types/client";

type ClientDoc = Record<string, unknown> & { id: string };

type TabId = "summary" | "links" | "billing" | "tasks" | "activity";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

type AdminUser = { id: string; fullName: string; email: string; photoURL?: string };

type Props = { clientId: string };

export function ClientDetailShell({ clientId }: Props) {
  const toast = useAdminToast();
  const [tab, setTab] = useState<TabId>("summary");
  const [client, setClient] = useState<ClientDoc | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [accounts, setAccounts] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [payTotals, setPayTotals] = useState<{ totalsByUser: Record<string, number>; totalPaid: number } | null>(
    null,
  );
  const [tasks, setTasks] = useState<Array<Record<string, unknown> & { id: string }>>([]);
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
    if (tab === "billing") {
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
    if (tab === "links") {
      const [linksRes, accountsRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}/links`, { cache: "no-store" }),
        fetch(`/api/admin/clients/${clientId}/accounts`, { cache: "no-store" }),
      ]);
      const linksJson = (await linksRes.json()) as Record<string, unknown>;
      const accountsJson = (await accountsRes.json()) as Record<string, unknown>;
      if (linksJson.ok) setLinks((linksJson.items as typeof links) ?? []);
      if (accountsJson.ok) setAccounts((accountsJson.items as typeof accounts) ?? []);
      return;
    }
    const path = tab === "activity" ? "activity" : tab;
    const res = await fetch(`/api/admin/clients/${clientId}/${path}`, { cache: "no-store" });
    const json = (await res.json()) as Record<string, unknown>;
    if (!json.ok) return;
    if (tab === "tasks") setTasks((json.items as typeof tasks) ?? []);
    if (tab === "activity") setActivity((json.items as typeof activity) ?? []);
  }, [clientId, tab]);

  useEffect(() => {
    void loadTabData();
  }, [loadTabData]);

  const name = client ? getClientDisplayName(client) : "Cliente";

  const userName = (uid: string) => users.find((u) => u.id === uid)?.fullName || uid.slice(0, 8);
  const responsibleUser = users.find((u) => u.id === String(client?.accountManagerUserId ?? ""));
  const responsibleLabel = responsibleUser?.fullName || responsibleUser?.email || "Sin asignar";
  const initials = responsibleLabel
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

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
                {Array.isArray(client.contacts) && client.contacts.length ? (
                  <p className="text-xs text-zinc-500">
                    Contacto principal: <strong className="text-zinc-800">{String((client.contacts[0] as Record<string, unknown>).name ?? "—")}</strong>
                  </p>
                ) : null}
                <h1 className="text-2xl font-semibold text-zinc-900">{name}</h1>
                <p className="mt-1 text-sm text-zinc-600">
                  {String(
                    (Array.isArray(client.emails) && client.emails[0] && (client.emails[0] as Record<string, unknown>).email) ||
                      client.email ||
                      "",
                  )}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Tel:{" "}
                  <strong className="text-zinc-800">
                    {String(
                      (Array.isArray(client.phones) && client.phones[0] && (client.phones[0] as Record<string, unknown>).number) ||
                        client.phone ||
                        "—",
                    )}
                  </strong>
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                  <span>Responsable:</span>
                  {responsibleUser?.photoURL ? (
                    <img
                      src={responsibleUser.photoURL}
                      alt={responsibleLabel}
                      className="h-5 w-5 rounded-full border border-zinc-200 object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[10px] font-semibold text-zinc-700">
                      {initials || "?"}
                    </span>
                  )}
                  <strong className="text-zinc-800">{responsibleLabel}</strong>
                  <span>· Alta {String(client.createdAt ?? "").slice(0, 10)}</span>
                </div>
              </div>
            </div>
          </header>

          <nav className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
            {(
              [
                ["summary", "Resumen"],
                ["links", "Links"],
                ["billing", "Facturación y pagos"],
                ["tasks", "Tareas"],
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
              accounts={accounts}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
            />
          ) : null}

          {tab === "billing" ? (
            <BillingTab
              clientId={clientId}
              users={users}
              invoices={invoices}
              payments={payments}
              payTotals={payTotals}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
              userName={userName}
            />
          ) : null}

          {tab === "tasks" ? (
            <TasksTab
              clientId={clientId}
              rows={tasks}
              users={users}
              clientLogoURL={String(client.logoURL ?? "")}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
            />
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
    company: String(client.company ?? ""),
    accountManagerUserId: String(client.accountManagerUserId ?? ""),
    tags: Array.isArray(client.tags) ? (client.tags as string[]).join(", ") : "",
    internalNotes: String(client.internalNotes ?? ""),
  });
  const [emails, setEmails] = useState<Array<{ email: string; reference: string; type: string; isPrimary: boolean }>>(
    Array.isArray(client.emails) && client.emails.length
      ? (client.emails as Array<Record<string, unknown>>).map((item, index) => ({
          email: String(item.email ?? ""),
          reference: String(item.reference ?? ""),
          type: String(item.type ?? "general"),
          isPrimary: Boolean(item.isPrimary) || index === 0,
        }))
      : [{ email: String(client.email ?? ""), reference: "Principal", type: "general", isPrimary: true }],
  );
  const [phones, setPhones] = useState<Array<{ number: string; reference: string; type: string; isPrimary: boolean }>>(
    Array.isArray(client.phones) && client.phones.length
      ? (client.phones as Array<Record<string, unknown>>).map((item, index) => ({
          number: String(item.number ?? ""),
          reference: String(item.reference ?? ""),
          type: String(item.type ?? "whatsapp"),
          isPrimary: Boolean(item.isPrimary) || index === 0,
        }))
      : [{ number: String(client.phone ?? ""), reference: "Principal", type: "whatsapp", isPrimary: true }],
  );
  const [contacts, setContacts] = useState<
    Array<{ name: string; role: string; email: string; phone: string; notes: string }>
  >(
    Array.isArray(client.contacts) && client.contacts.length
      ? (client.contacts as Array<Record<string, unknown>>).map((item) => ({
          name: String(item.name ?? ""),
          role: String(item.role ?? ""),
          email: String(item.email ?? ""),
          phone: String(item.phone ?? ""),
          notes: String(item.notes ?? ""),
        }))
      : [{ name: "", role: "", email: "", phone: "", notes: "" }],
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          company: form.company,
          accountManagerUserId: form.accountManagerUserId,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          emails: emails.filter((entry) => entry.email.trim()).map((entry) => ({ ...entry, email: entry.email.trim() })),
          phones: phones.filter((entry) => entry.number.trim()).map((entry) => ({ ...entry, number: entry.number.trim() })),
          contacts: contacts.filter((entry) => entry.name.trim()),
          internalNotes: form.internalNotes,
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
          Empresa
          <input className={inputClass} value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} />
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
        <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
          Tags (coma)
          <input className={inputClass} value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600 md:col-span-2">
          Notas internas generales
          <textarea className={`${inputClass} min-h-[84px]`} value={form.internalNotes} onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))} />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Emails</p>
          {emails.map((row, index) => (
            <div key={`email-${index}`} className="mt-2 grid gap-2">
              <input className={inputClass} placeholder="Email" value={row.email} onChange={(e) => setEmails((prev) => prev.map((item, i) => (i === index ? { ...item, email: e.target.value } : item)))} />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Telefonos</p>
          {phones.map((row, index) => (
            <div key={`phone-${index}`} className="mt-2 grid gap-2">
              <input className={inputClass} placeholder="Telefono" value={row.number} onChange={(e) => setPhones((prev) => prev.map((item, i) => (i === index ? { ...item, number: e.target.value } : item)))} />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Personas de contacto</p>
        {contacts.map((row, index) => (
          <div key={`contact-${index}`} className="mt-2 grid gap-2 md:grid-cols-2">
            <input className={inputClass} placeholder="Nombre" value={row.name} onChange={(e) => setContacts((prev) => prev.map((item, i) => (i === index ? { ...item, name: e.target.value } : item)))} />
            <input className={inputClass} placeholder="Rol" value={row.role} onChange={(e) => setContacts((prev) => prev.map((item, i) => (i === index ? { ...item, role: e.target.value } : item)))} />
            <input className={inputClass} placeholder="Email" value={row.email} onChange={(e) => setContacts((prev) => prev.map((item, i) => (i === index ? { ...item, email: e.target.value } : item)))} />
            <input className={inputClass} placeholder="Telefono" value={row.phone} onChange={(e) => setContacts((prev) => prev.map((item, i) => (i === index ? { ...item, phone: e.target.value } : item)))} />
          </div>
        ))}
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
  accounts,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  rows: Array<Record<string, unknown> & { id: string }>;
  accounts: Array<Record<string, unknown> & { id: string }>;
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
  const [accountPlatform, setAccountPlatform] = useState("");
  const [accountUsername, setAccountUsername] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountUrl, setAccountUrl] = useState("");
  const [accountNotes, setAccountNotes] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

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

  const addAccount = async () => {
    if (!accountPlatform.trim() || !accountUsername.trim()) {
      onFlash({ type: "err", text: "Completá plataforma y usuario." });
      return;
    }
    setAccountSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: accountPlatform.trim(),
          username: accountUsername.trim(),
          password: accountPassword,
          url: accountUrl.trim(),
          notes: accountNotes.trim(),
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo guardar la cuenta." });
        return;
      }
      setAccountPlatform("");
      setAccountUsername("");
      setAccountPassword("");
      setAccountUrl("");
      setAccountNotes("");
      onFlash({ type: "ok", text: "Cuenta agregada." });
      onRefresh();
    } finally {
      setAccountSaving(false);
    }
  };

  const toggleRevealPassword = async (accountId: string) => {
    if (revealedPasswords[accountId] !== undefined) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[accountId];
        return next;
      });
      return;
    }
    const res = await fetch(`/api/admin/clients/${clientId}/accounts/${accountId}`, {
      method: "GET",
      credentials: "include",
    });
    const json = (await res.json()) as { ok?: boolean; password?: string; error?: string };
    if (!res.ok || !json.ok) {
      onFlash({ type: "err", text: json.error ?? "No se pudo revelar la contrasena." });
      return;
    }
    setRevealedPasswords((prev) => ({ ...prev, [accountId]: String(json.password ?? "") }));
  };

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

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Cuentas del cliente</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input className={inputClass} placeholder="Plataforma" value={accountPlatform} onChange={(e) => setAccountPlatform(e.target.value)} />
          <input className={inputClass} placeholder="Usuario" value={accountUsername} onChange={(e) => setAccountUsername(e.target.value)} />
          <input className={inputClass} placeholder="Contrasena" value={accountPassword} onChange={(e) => setAccountPassword(e.target.value)} />
          <input className={inputClass} placeholder="URL" value={accountUrl} onChange={(e) => setAccountUrl(e.target.value)} />
          <input className={`${inputClass} md:col-span-2`} placeholder="Notas" value={accountNotes} onChange={(e) => setAccountNotes(e.target.value)} />
        </div>
        <button type="button" onClick={() => void addAccount()} disabled={accountSaving} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60">
          {accountSaving ? "Guardando..." : "Agregar cuenta"}
        </button>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Plataforma</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Contrasena</th>
                <th className="p-3">Link</th>
                <th className="p-3">Notas</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="p-3">{String(acc.platform ?? "")}</td>
                  <td className="p-3">{String(acc.username ?? "")}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void toggleRevealPassword(acc.id)}
                      className="rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
                    >
                      {revealedPasswords[acc.id] !== undefined ? revealedPasswords[acc.id] || "(vacia)" : "********"}
                    </button>
                  </td>
                  <td className="p-3">
                    {acc.url ? (
                      <a href={String(acc.url)} target="_blank" rel="noreferrer" className="text-[#db2777] hover:underline">
                        abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-zinc-600">{String(acc.notes ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BillingTab({
  clientId,
  users,
  invoices,
  payments,
  payTotals,
  onRefresh,
  onFlash,
  userName,
}: {
  clientId: string;
  users: AdminUser[];
  invoices: Array<Record<string, unknown> & { id: string }>;
  payments: Array<Record<string, unknown> & { id: string }>;
  payTotals: { totalsByUser: Record<string, number>; totalPaid: number } | null;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
  userName: (uid: string) => string;
}) {
  return (
    <div className="grid gap-6">
      <InvoicesTab clientId={clientId} rows={invoices} users={users} onRefresh={onRefresh} onFlash={onFlash} />
      <PaymentsTab
        clientId={clientId}
        users={users}
        rows={payments}
        payTotals={payTotals}
        invoices={invoices}
        onRefresh={onRefresh}
        onFlash={onFlash}
        userName={userName}
      />
    </div>
  );
}

function invoiceStatusBadgeClass(status: string) {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "partially_paid") return "border-amber-200 bg-amber-50 text-amber-800";
  if (status === "pending_payment" || status === "sent") return "border-blue-200 bg-blue-50 text-blue-800";
  if (status === "overdue") return "border-red-200 bg-red-50 text-red-800";
  if (status === "cancelled") return "border-zinc-300 bg-zinc-100 text-zinc-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
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
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="pending_payment">Pendiente de pago</option>
            <option value="partially_paid">Parcialmente pagada</option>
            <option value="paid">Pagada</option>
            <option value="overdue">Vencida</option>
            <option value="cancelled">Cancelada</option>
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
              <th className="p-3">Cobrado</th>
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
                <td className="p-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${invoiceStatusBadgeClass(String(r.status ?? ""))}`}>
                    {String(r.status ?? "")}
                  </span>
                </td>
                <td className="p-3 text-zinc-700">
                  {String(r.currency ?? "")} {String(r.paidAmount ?? 0)} / {String(r.amount ?? 0)}
                </td>
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
              <th className="p-3">Factura</th>
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
                <td className="p-3 text-xs text-zinc-600">{String(r.relatedInvoiceId ?? "—")}</td>
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

function TasksTab({
  clientId,
  rows,
  users,
  clientLogoURL,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  rows: Array<Record<string, unknown> & { id: string }>;
  users: AdminUser[];
  clientLogoURL?: string;
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<(Record<string, unknown> & { id: string }) | null>(null);
  const [threadTab, setThreadTab] = useState<"comments" | "activity">("comments");
  const [threadComments, setThreadComments] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [threadActivity, setThreadActivity] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [filter, setFilter] = useState<"pending" | "done" | "all">("pending");
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    assignedMonth: "",
    priority: "medium",
    status: "pending",
    tags: "",
  });
  const inFlightRef = useRef(false);
  const insertInDescription = (token: string) => {
    setForm((prev) => ({ ...prev, description: `${prev.description}${prev.description ? "\n" : ""}${token}` }));
  };

  const loadTaskThread = async (taskId: string) => {
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/admin/tasks/${taskId}/thread`, { cache: "no-store", credentials: "include" });
      const j = (await res.json()) as {
        ok?: boolean;
        comments?: Array<Record<string, unknown> & { id: string }>;
        activity?: Array<Record<string, unknown> & { id: string }>;
        error?: string;
      };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo cargar el historial." });
        return;
      }
      setThreadComments(j.comments ?? []);
      setThreadActivity(j.activity ?? []);
    } finally {
      setThreadLoading(false);
    }
  };

  const openTaskDetail = (task: Record<string, unknown> & { id: string }) => {
    setExpandedTask(task);
    setThreadTab("comments");
    setCommentDraft("");
    void loadTaskThread(task.id);
  };

  const submitComment = async () => {
    if (!expandedTask?.id || !commentDraft.trim() || commentSaving) return;
    setCommentSaving(true);
    try {
      const res = await fetch(`/api/admin/tasks/${expandedTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentDraft.trim() }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo guardar comentario." });
        return;
      }
      setCommentDraft("");
      await loadTaskThread(expandedTask.id);
      onRefresh();
    } finally {
      setCommentSaving(false);
    }
  };

  const openCreateModal = () => {
    setEditingTaskId(null);
    setForm({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      assignedMonth: "",
      priority: "medium",
      status: "pending",
      tags: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Record<string, unknown> & { id: string }) => {
    setEditingTaskId(task.id);
    setForm({
      title: String(task.title ?? ""),
      description: String(task.description ?? ""),
      assignedTo: String(task.assignedTo ?? ""),
      dueDate: String(task.dueDate ?? "").slice(0, 10),
      assignedMonth: String(task.assignedMonth ?? ""),
      priority: String(task.priority ?? "medium"),
      status: String(task.status ?? "pending"),
      tags: Array.isArray(task.tags) ? (task.tags as string[]).join(", ") : "",
    });
    setIsModalOpen(true);
  };

  const saveTask = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = form.title.trim();
    if (!trimmed || saving || inFlightRef.current) return;
    inFlightRef.current = true;
    setSaving(true);
    try {
      const endpoint = editingTaskId
        ? `/api/admin/clients/${clientId}/tasks/${editingTaskId}`
        : `/api/admin/clients/${clientId}/tasks`;
      const method = editingTaskId ? "PATCH" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: trimmed,
          description: form.description,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate,
          assignedMonth:
            form.assignedMonth || (form.dueDate ? form.dueDate.slice(0, 7) : new Date().toISOString().slice(0, 7)),
          priority: form.priority,
          status: form.status,
          tags: form.tags
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "Error" });
        return;
      }
      onFlash({ type: "ok", text: editingTaskId ? "Tarea actualizada." : "Tarea creada." });
      setIsModalOpen(false);
      onRefresh();
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  };

  const updateTask = async (taskId: string, nextStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo actualizar la tarea." });
        return;
      }
      onFlash({ type: "ok", text: "Tarea actualizada." });
      onRefresh();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const removeTask = async (taskId: string) => {
    setDeletingTaskId(taskId);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar la tarea." });
        return;
      }
      onFlash({ type: "ok", text: "Tarea eliminada." });
      onRefresh();
    } finally {
      setDeletingTaskId(null);
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    const aDue = String(a.dueDate ?? "");
    const bDue = String(b.dueDate ?? "");
    if (aDue && bDue && aDue !== bDue) return aDue.localeCompare(bDue);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return String(a.createdAt ?? "").localeCompare(String(b.createdAt ?? ""));
  });
  const visibleRows = sortedRows.filter((row) => {
    const status = String(row.status ?? "pending");
    if (filter === "done") return status === "done";
    if (filter === "pending") return status !== "done";
    return true;
  });
  const groupedRows = (() => {
    const map = new Map<string, Array<Record<string, unknown> & { id: string }>>();
    for (const row of visibleRows) {
      const assignedMonth = String(row.assignedMonth ?? "");
      const fallbackDue = String(row.dueDate ?? "");
      const month = /^\d{4}-\d{2}$/.test(assignedMonth)
        ? assignedMonth
        : /^\d{4}-\d{2}/.test(fallbackDue)
          ? fallbackDue.slice(0, 7)
          : new Date().toISOString().slice(0, 7);
      const list = map.get(month) ?? [];
      list.push(row);
      map.set(month, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  })();
  const monthLabel = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    const date = new Date(y, (m || 1) - 1, 1);
    return date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  };
  const userById = new Map(users.map((u) => [u.id, u]));
  const personMeta = (userId: string) => {
    const u = userById.get(userId);
    const label = u?.fullName || u?.email || (userId ? userId.slice(0, 8) : "Sin asignar");
    const initials = label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
    return { label, initials, photoURL: u?.photoURL || "" };
  };
  const priorityClass = (value: string) =>
    value === "high"
      ? "border-red-200 bg-red-50 text-red-800"
      : value === "low"
        ? "border-zinc-300 bg-zinc-100 text-zinc-700"
        : "border-amber-200 bg-amber-50 text-amber-800";
  const statusClass = (value: string) =>
    value === "done"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : value === "blocked"
        ? "border-red-200 bg-red-50 text-red-800"
        : value === "in_progress"
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : value === "cancelled"
            ? "border-zinc-300 bg-zinc-100 text-zinc-600"
            : "border-violet-200 bg-violet-50 text-violet-800";
  const statusLabel = (value: string) =>
    value === "pending"
      ? "Pendiente"
      : value === "in_progress"
        ? "En proceso"
        : value === "blocked"
          ? "Bloqueada"
          : value === "done"
            ? "Terminada"
            : value === "cancelled"
              ? "Cancelada"
              : value;
  const priorityLabel = (value: string) =>
    value === "high" ? "Alta" : value === "medium" ? "Media" : value === "low" ? "Baja" : value;

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Tareas del cliente</h3>
            <p className="mt-1 text-xs text-zinc-500">Gestioná tareas por mes sin formulario fijo en pantalla.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            + Nueva tarea
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { id: "pending", label: "Pendientes" },
            { id: "done", label: "Finalizadas" },
            { id: "all", label: "Todas" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as typeof filter)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                filter === item.id
                  ? "border-rose-300 bg-rose-100 text-rose-900"
                  : "border-zinc-300 bg-zinc-50 text-zinc-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <form
            className="w-full max-w-3xl rounded-2xl bg-zinc-100 p-4"
            onSubmit={(e) => void saveTask(e)}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                {editingTaskId ? "Editar tarea" : "Crear tarea"}
              </h3>
              <button
                type="button"
                onClick={() => !saving && setIsModalOpen(false)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <input className={inputClass} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Titulo" />
              <select className={inputClass} value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Responsable</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2">
                <div className="mb-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => insertInDescription("**texto en negrita**")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Negrita</button>
                  <button type="button" onClick={() => insertInDescription("## Título")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Título</button>
                  <button type="button" onClick={() => insertInDescription("- Item")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Lista</button>
                  <button type="button" onClick={() => insertInDescription("Salto de línea\nSiguiente línea")} className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700">Salto línea</button>
                </div>
                <textarea className={`${inputClass} min-h-[180px]`} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descripción con formato Markdown (**negrita**, ## títulos, listas y saltos)" />
              </div>
              <input className={inputClass} type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              <input className={inputClass} type="month" value={form.assignedMonth} onChange={(e) => setForm((p) => ({ ...p, assignedMonth: e.target.value }))} />
              <select className={inputClass} value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
              <select className={inputClass} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="pending">Pendiente</option>
                <option value="in_progress">En proceso</option>
                <option value="blocked">Bloqueada</option>
                <option value="done">Terminada</option>
                <option value="cancelled">Cancelada</option>
              </select>
              <input className={`${inputClass} md:col-span-2`} value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Tags (coma)" />
            </div>
            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="mt-3 rounded-xl bg-rose-300 px-4 py-2.5 text-xs font-semibold text-zinc-900 disabled:opacity-50"
            >
              {saving ? "Guardando…" : editingTaskId ? "Guardar cambios" : "Crear tarea"}
            </button>
          </form>
        </div>
      ) : null}

      {expandedTask ? (
        <div className="fixed inset-0 z-50 bg-black/60 p-4">
          <div className="mx-auto h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-zinc-100">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{String(expandedTask.title ?? "Tarea")}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Vence: {String(expandedTask.dueDate ?? "").slice(0, 10) || "Sin fecha"} · Responsable: {personMeta(String(expandedTask.assignedTo ?? "")).label}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(expandedTask)}
                  className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void removeTask(expandedTask.id)}
                  className="rounded-lg border border-red-500/60 bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-200"
                >
                  Eliminar
                </button>
                <button type="button" onClick={() => setExpandedTask(null)} className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200">
                  Cerrar
                </button>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <div className="prose prose-invert max-w-none rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm leading-relaxed prose-headings:mb-2 prose-p:my-2">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(expandedTask.description ?? "Sin descripción")}
                </ReactMarkdown>
              </div>
              <aside className="rounded-xl border border-zinc-800 bg-zinc-900/50">
                <div className="flex border-b border-zinc-800 text-sm">
                  <button type="button" onClick={() => setThreadTab("comments")} className={`px-4 py-2.5 font-semibold ${threadTab === "comments" ? "text-white" : "text-zinc-400"}`}>Comentarios</button>
                  <button type="button" onClick={() => setThreadTab("activity")} className={`px-4 py-2.5 font-semibold ${threadTab === "activity" ? "text-white" : "text-zinc-400"}`}>Toda la actividad</button>
                </div>
                <div className="max-h-[55vh] overflow-y-auto p-4">
                  {threadLoading ? <p className="text-xs text-zinc-400">Cargando...</p> : null}
                  {!threadLoading && threadTab === "comments" ? (
                    <div className="grid gap-3">
                      {threadComments.length === 0 ? <p className="text-xs text-zinc-400">Sin comentarios todavía.</p> : null}
                      {threadComments.map((item) => (
                        <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                          <p className="text-xs font-semibold text-zinc-200">{personMeta(String(item.createdByUserId ?? "")).label} · {String(item.createdAt ?? "").slice(0, 16)}</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-100">{String(item.content ?? "")}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                  {!threadLoading && threadTab === "activity" ? (
                    <div className="grid gap-2">
                      {threadActivity.length === 0 ? <p className="text-xs text-zinc-400">Sin actividad registrada.</p> : null}
                      {threadActivity.map((item) => (
                        <article key={item.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                          <AdminActionBadge action={String(item.action ?? "")} />
                          <p className="mt-1 text-xs text-zinc-400">{String(item.createdAt ?? "").slice(0, 16)} · {personMeta(String(item.createdByUserId ?? "")).label}</p>
                          {item.message ? <p className="mt-1 text-sm text-zinc-100">{String(item.message)}</p> : null}
                          {Array.isArray((item.metadata as Record<string, unknown> | undefined)?.changes) ? (
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-zinc-300">
                              {((item.metadata as Record<string, unknown>).changes as Array<Record<string, unknown>>).slice(0, 6).map((change, idx) => (
                                <li key={`${item.id}-${idx}`}>
                                  {String(change.field ?? "campo")}: "{String(change.from ?? "—")}" {"->"} "{String(change.to ?? "—")}"
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="border-t border-zinc-800 p-3">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    className="min-h-[82px] w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                    placeholder="Agregar un comentario"
                  />
                  <button
                    type="button"
                    onClick={() => void submitComment()}
                    disabled={commentSaving || !commentDraft.trim()}
                    className="mt-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {commentSaving ? "Comentando..." : "Comentar"}
                  </button>
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">Todavía no hay tareas para este cliente</p>
          <p className="mt-1 text-xs text-zinc-500">Creá la primera tarea para empezar a ordenar el sprint mensual.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            Crear primera tarea
          </button>
        </div>
      ) : null}

      {rows.length > 0 && groupedRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-zinc-800">No hay resultados para este filtro</p>
          <p className="mt-1 text-xs text-zinc-500">Probá con otro filtro o creá una nueva tarea.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            + Nueva tarea
          </button>
        </div>
      ) : null}

      <div className="grid gap-4">
        {groupedRows.map(([month, monthRows], index) => (
          <details key={month} open={index === 0} className="rounded-2xl border border-zinc-200 bg-white">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-zinc-800">
              {monthLabel(month)} ({monthRows.length})
            </summary>
            <div className="grid gap-3 border-t border-zinc-100 p-4 md:grid-cols-2 xl:grid-cols-3">
        {monthRows.map((r) => {
          const dueDateIso = String(r.dueDate ?? "");
          const isOverdue = dueDateIso ? dueDateIso < new Date().toISOString() && String(r.status ?? "") !== "done" : false;
          const assignedToMeta = personMeta(String(r.assignedTo ?? ""));
          const createdByMeta = personMeta(String(r.createdBy ?? ""));
          return (
            <article
              key={r.id}
              onClick={() => openTaskDetail(r)}
              className="h-[270px] cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-sm shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{String(r.title ?? "Tarea")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityClass(String(r.priority ?? "medium"))}`}>
                    {priorityLabel(String(r.priority ?? "medium"))}
                  </span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass(String(r.status ?? "pending"))}`}>
                    {statusLabel(String(r.status ?? "pending"))}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  {assignedToMeta.photoURL ? (
                    <img src={assignedToMeta.photoURL} alt={assignedToMeta.label} className="h-7 w-7 rounded-full border border-zinc-200 object-cover" />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                      {assignedToMeta.initials || "?"}
                    </span>
                  )}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Responsable</p>
                    <p className="text-xs font-medium text-zinc-800">{assignedToMeta.label}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {createdByMeta.photoURL ? (
                    <img src={createdByMeta.photoURL} alt={createdByMeta.label} className="h-7 w-7 rounded-full border border-zinc-200 object-cover" />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-[11px] font-semibold text-zinc-700">
                      {createdByMeta.initials || "?"}
                    </span>
                  )}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Creador</p>
                    <p className="text-xs font-medium text-zinc-800">{createdByMeta.label}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Vencimiento</p>
                  <p className={`text-xs font-semibold ${isOverdue ? "text-red-700" : "text-zinc-800"}`}>
                    {dueDateIso ? dueDateIso.slice(0, 10) : "Sin fecha"}
                    {isOverdue ? " · Vencida" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Cliente</p>
                  <p className="inline-flex items-center gap-2 text-xs font-medium text-zinc-800">
                    {clientLogoURL ? <img src={clientLogoURL} alt="Logo cliente" className="h-5 w-5 rounded-full border border-zinc-200 object-cover" /> : null}
                    {String(r.clientName ?? "—")}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={String(r.status ?? "pending")}
                  disabled={updatingTaskId === r.id}
                  onChange={(e) => void updateTask(r.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300"
                  aria-label="Cambiar estado"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En proceso</option>
                  <option value="blocked">Bloqueada</option>
                  <option value="done">Terminada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <button
                  type="button"
                  disabled={updatingTaskId === r.id || String(r.status ?? "") === "done"}
                  onClick={(e) => {
                    e.stopPropagation();
                    void updateTask(r.id, "done");
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-emerald-700 disabled:opacity-60"
                  aria-label="Marcar como finalizada"
                  title="Marcar como finalizada"
                >
                  {updatingTaskId === r.id ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                      <path
                        d="M7.8 13.4 4.9 10.5 3.8 11.6l4 4 8-8-1.1-1.1-6.9 6.9z"
                        fill="currentColor"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </article>
          );
        })}
            </div>
          </details>
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
