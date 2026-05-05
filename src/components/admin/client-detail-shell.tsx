"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { ClientDetailTasksTab } from "@/components/admin/client-detail-tasks-tab";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { getClientDisplayName } from "@/types/client";

type ClientDoc = Record<string, unknown> & { id: string };

type TabId = "summary" | "links" | "billing" | "tasks" | "activity";

const inputClass =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 focus:border-rose-300 focus:ring-rose-300";

const accountCopyBtnClass =
  "shrink-0 rounded border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 hover:bg-zinc-100 disabled:opacity-50";

async function readAdminFetchJson(res: Response): Promise<Record<string, unknown> & { ok?: boolean; error?: string }> {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, error: `Sin respuesta del servidor (${res.status}).` };
  }
  if (trimmed.startsWith("<")) {
    return {
      ok: false,
      error:
        res.status >= 500
          ? `Error del servidor (${res.status}). Revisá la terminal donde corre Next.js.`
          : `Respuesta no JSON (${res.status}).`,
    };
  }
  try {
    return JSON.parse(trimmed) as Record<string, unknown> & { ok?: boolean; error?: string };
  } catch {
    return { ok: false, error: `Respuesta inválida (${res.status}).` };
  }
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

type AdminUser = { id: string; fullName: string; email: string; photoURL?: string };

type Props = { clientId: string; actorUid: string };

export function ClientDetailShell({ clientId, actorUid }: Props) {
  const toast = useAdminToast();
  const [tab, setTab] = useState<TabId>("summary");
  const [client, setClient] = useState<ClientDoc | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadError, setLoadError] = useState("");
  const [links, setLinks] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [accounts, setAccounts] = useState<Array<Record<string, unknown> & { id: string }>>([]);
  const [invoices, setInvoices] = useState<Array<Record<string, unknown> & { id: string }>>([]);
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
    const json = (await readAdminFetchJson(res)) as { ok?: boolean; client?: ClientDoc; error?: string };
    if (!res.ok || !json.ok || !json.client) {
      setLoadError(json.error ?? "No pudimos cargar el cliente.");
      return;
    }
    setClient(json.client);
  }, [clientId]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/admin/users", { cache: "no-store" });
    const json = (await readAdminFetchJson(res)) as { ok?: boolean; users?: AdminUser[] };
    if (json.ok && json.users) setUsers(json.users);
  }, []);

  useEffect(() => {
    void loadClient();
    void loadUsers();
  }, [loadClient, loadUsers]);

  const loadTabData = useCallback(async () => {
    if (tab === "summary") return;
    if (tab === "billing") {
      const invRes = await fetch(`/api/admin/clients/${clientId}/invoices`, {
        cache: "no-store",
        credentials: "include",
      });
      const invJson = (await readAdminFetchJson(invRes)) as Record<string, unknown>;
      if (invJson.ok) setInvoices((invJson.items as typeof invoices) ?? []);
      return;
    }
    if (tab === "links") {
      const [linksRes, accountsRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}/links`, { cache: "no-store" }),
        fetch(`/api/admin/clients/${clientId}/accounts`, { cache: "no-store" }),
      ]);
      const linksJson = (await readAdminFetchJson(linksRes)) as Record<string, unknown>;
      const accountsJson = (await readAdminFetchJson(accountsRes)) as Record<string, unknown>;
      if (linksJson.ok) setLinks((linksJson.items as typeof links) ?? []);
      if (accountsJson.ok) setAccounts((accountsJson.items as typeof accounts) ?? []);
      return;
    }
    const path = tab === "activity" ? "activity" : tab;
    const res = await fetch(`/api/admin/clients/${clientId}/${path}`, { cache: "no-store" });
    const json = (await readAdminFetchJson(res)) as Record<string, unknown>;
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
              invoices={invoices}
              onRefresh={() => void loadTabData()}
              onFlash={onFlash}
            />
          ) : null}

          {tab === "tasks" ? (
            <ClientDetailTasksTab
              clientId={clientId}
              actorUid={actorUid}
              rows={tasks}
              users={users}
              clientLogoURL={String(client.logoURL ?? "")}
              clientDisplayName={name}
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
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
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
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
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
  const [linkModalOpen, setLinkModalOpen] = useState(false);
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
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [showAccountPassword, setShowAccountPassword] = useState(true);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState<{
    id: string;
    platform: string;
    username: string;
  } | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [passwordCopyBusyId, setPasswordCopyBusyId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const resetAccountForm = () => {
    setEditingAccountId(null);
    setAccountPlatform("");
    setAccountUsername("");
    setAccountPassword("");
    setAccountUrl("");
    setAccountNotes("");
    setShowAccountPassword(true);
  };

  const openAccountModal = () => {
    resetAccountForm();
    setAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    if (accountSaving) return;
    setAccountModalOpen(false);
    resetAccountForm();
  };

  const startEditAccount = (acc: Record<string, unknown> & { id: string }) => {
    setEditingAccountId(acc.id);
    setAccountPlatform(String(acc.platform ?? ""));
    setAccountUsername(String(acc.username ?? ""));
    setAccountPassword("");
    setAccountUrl(String(acc.url ?? ""));
    setAccountNotes(String(acc.notes ?? ""));
    setShowAccountPassword(true);
    setAccountModalOpen(true);
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setEditingLinkId(null);
  };

  const openLinkModal = () => {
    resetForm();
    setLinkModalOpen(true);
  };

  const closeLinkModal = () => {
    if (saving) return;
    setLinkModalOpen(false);
    resetForm();
  };

  const startEdit = (r: Record<string, unknown> & { id: string }) => {
    setEditingLinkId(r.id);
    setTitle(String(r.title ?? ""));
    setUrl(String(r.url ?? ""));
    setLinkModalOpen(true);
  };

  const saveLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
      const isEdit = Boolean(editingLinkId);
      const payload = isEdit
        ? { title: trimmedTitle, url: href }
        : { title: trimmedTitle, url: href, category: "other", description: "" };
      const endpoint = isEdit
        ? `/api/admin/clients/${clientId}/links/${editingLinkId}`
        : `/api/admin/clients/${clientId}/links`;
      const res = await fetch(endpoint, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo guardar el link." });
        return;
      }
      resetForm();
      setLinkModalOpen(false);
      onFlash({
        type: "ok",
        text: isEdit ? "Link actualizado." : "Link agregado.",
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
        credentials: "include",
        body: JSON.stringify({ active: nextActive }),
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
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
      const res = await fetch(`/api/admin/clients/${clientId}/links/${lid}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar." });
        return;
      }
      onFlash({ type: "ok", text: "Link eliminado." });
      if (editingLinkId === lid) {
        setLinkModalOpen(false);
        resetForm();
      }
      setDeleteConfirm(null);
      onRefresh();
    } finally {
      setDeletingLinkId(null);
    }
  };

  const saveAccount = async () => {
    if (!accountPlatform.trim() || !accountUsername.trim()) {
      onFlash({ type: "err", text: "Completá plataforma y usuario." });
      return;
    }
    setAccountSaving(true);
    try {
      const editingId = editingAccountId;

      if (editingId) {
        const payload: Record<string, unknown> = {
          platform: accountPlatform.trim(),
          username: accountUsername.trim(),
          url: accountUrl.trim(),
          notes: accountNotes.trim(),
        };
        if (accountPassword.trim()) {
          payload.password = accountPassword.trim();
        }
        const res = await fetch(`/api/admin/clients/${clientId}/accounts/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const raw = await res.text();
        const trimmedRaw = raw.replace(/^\uFEFF/, "").trim();
        let j: { ok?: boolean; error?: string; message?: string } = {};
        if (trimmedRaw) {
          try {
            j = JSON.parse(trimmedRaw) as typeof j;
          } catch {
            onFlash({ type: "err", text: "Respuesta inválida del servidor." });
            return;
          }
        }
        const patchErr =
          (typeof j.error === "string" && j.error.trim()) ||
          (typeof j.message === "string" && j.message.trim()) ||
          "";
        if (!res.ok || j.ok !== true) {
          onFlash({
            type: "err",
            text: patchErr || `No se pudo actualizar la cuenta (HTTP ${res.status}).`,
          });
          return;
        }
        resetAccountForm();
        setAccountModalOpen(false);
        onFlash({ type: "ok", text: "Cuenta actualizada." });
        onRefresh();
        return;
      }

      const res = await fetch(`/api/admin/clients/${clientId}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          platform: accountPlatform.trim(),
          username: accountUsername.trim(),
          password: accountPassword,
          url: accountUrl.trim(),
          notes: accountNotes.trim(),
        }),
      });
      const raw = await res.text();
      const trimmedRaw = raw.replace(/^\uFEFF/, "").trim();
      let j: {
        ok?: boolean | string;
        error?: string;
        message?: string;
        id?: string;
      } = {};
      if (trimmedRaw) {
        try {
          j = JSON.parse(trimmedRaw) as typeof j;
        } catch {
          const snippet = trimmedRaw.slice(0, 280);
          console.warn("[saveAccount POST] respuesta no JSON", res.status, snippet);
          onFlash({
            type: "err",
            text: snippet
              ? `El servidor devolvió un error (${res.status}). ${snippet}`
              : `Respuesta inválida del servidor (HTTP ${res.status}).`,
          });
          return;
        }
      }

      const serverSays =
        (typeof j.error === "string" && j.error.trim()) ||
        (typeof j.message === "string" && j.message.trim()) ||
        "";

      const okTruthy = j.ok === true || j.ok === "true";
      const hasNewId = typeof j.id === "string" && j.id.length > 0;
      const okResponse = res.ok && !serverSays && (okTruthy || hasNewId);

      if (!okResponse) {
        const fallback =
          serverSays ||
          (!trimmedRaw ? `Sin cuerpo en la respuesta (HTTP ${res.status}).` : undefined) ||
          `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`;
        console.warn(
          "[saveAccount POST] fallo",
          JSON.stringify({
            status: res.status,
            statusText: res.statusText,
            ok: j.ok,
            id: j.id,
            error: j.error,
            bodyPreview: trimmedRaw.slice(0, 500),
          }),
        );
        onFlash({
          type: "err",
          text: serverSays
            ? serverSays
            : `No se pudo guardar la cuenta. ${fallback} Si ves HTTP 500 sin detalle, revisá la terminal donde corre Next (servidor).`,
        });
        return;
      }
      resetAccountForm();
      setAccountModalOpen(false);
      onFlash({ type: "ok", text: "Cuenta agregada." });
      onRefresh();
    } catch (err) {
      console.warn("[saveAccount] fetch", err);
      onFlash({
        type: "err",
        text:
          err instanceof Error && err.message
            ? `No se pudo guardar la cuenta: ${err.message}`
            : "No se pudo guardar la cuenta (falló la conexión o el servidor no respondió).",
      });
    } finally {
      setAccountSaving(false);
    }
  };

  const runDeleteAccount = async () => {
    if (!deleteAccountConfirm) return;
    const aid = deleteAccountConfirm.id;
    setDeletingAccountId(aid);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/accounts/${aid}`, {
        method: "DELETE",
        credentials: "include",
      });
      const raw = await res.text();
      const trimmedRaw = raw.replace(/^\uFEFF/, "").trim();
      let j: { ok?: boolean; error?: string } = {};
      if (trimmedRaw) {
        try {
          j = JSON.parse(trimmedRaw) as typeof j;
        } catch {
          onFlash({ type: "err", text: "Respuesta inválida del servidor." });
          return;
        }
      }
      const errMsg = typeof j.error === "string" && j.error.trim() ? j.error.trim() : "";
      if (!res.ok || j.ok !== true) {
        onFlash({
          type: "err",
          text: errMsg || `No se pudo eliminar la cuenta (HTTP ${res.status}).`,
        });
        return;
      }
      setDeleteAccountConfirm(null);
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[aid];
        return next;
      });
      if (editingAccountId === aid) {
        setAccountModalOpen(false);
        resetAccountForm();
      }
      onFlash({ type: "ok", text: "Cuenta eliminada." });
      onRefresh();
    } finally {
      setDeletingAccountId(null);
    }
  };

  const copyAccountUsername = async (acc: Record<string, unknown> & { id: string }) => {
    const u = String(acc.username ?? "");
    if (!u.trim()) {
      onFlash({ type: "err", text: "No hay usuario para copiar." });
      return;
    }
    const ok = await writeClipboard(u);
    onFlash({
      type: ok ? "ok" : "err",
      text: ok ? "Usuario copiado." : "No se pudo copiar al portapapeles.",
    });
  };

  const copyAccountPassword = async (accountId: string) => {
    setPasswordCopyBusyId(accountId);
    try {
      let plain = revealedPasswords[accountId];
      if (plain === undefined) {
        const res = await fetch(`/api/admin/clients/${clientId}/accounts/${accountId}`, {
          method: "GET",
          credentials: "include",
        });
        const json = (await readAdminFetchJson(res)) as { ok?: boolean; password?: string; error?: string };
        if (!res.ok || !json.ok) {
          onFlash({ type: "err", text: json.error ?? "No se pudo obtener la contraseña." });
          return;
        }
        plain = String(json.password ?? "");
        setRevealedPasswords((prev) => ({ ...prev, [accountId]: plain }));
      }
      const ok = await writeClipboard(plain);
      if (!ok) {
        onFlash({ type: "err", text: "No se pudo copiar al portapapeles." });
        return;
      }
      onFlash({
        type: "ok",
        text: plain.trim() ? "Contraseña copiada." : "Copiado (no hay contraseña guardada).",
      });
    } finally {
      setPasswordCopyBusyId(null);
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
    const json = (await readAdminFetchJson(res)) as { ok?: boolean; password?: string; error?: string };
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

      <ConfirmDialog
        open={Boolean(deleteAccountConfirm)}
        title="¿Eliminar esta cuenta?"
        description={
          deleteAccountConfirm
            ? `Se borrará «${deleteAccountConfirm.platform}» (${deleteAccountConfirm.username}).`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={Boolean(deletingAccountId)}
        onCancel={() => !deletingAccountId && setDeleteAccountConfirm(null)}
        onConfirm={() => void runDeleteAccount()}
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Links útiles</p>
          <button
            type="button"
            onClick={openLinkModal}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            Agregar link
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
              <p className="max-w-sm text-sm text-zinc-600">Todavía no hay links cargados para este cliente.</p>
              <button
                type="button"
                onClick={openLinkModal}
                className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
              >
                Agregar primer link
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3">Título</th>
                  <th className="p-3">Link</th>
                  <th className="w-12 p-3"> </th>
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
          )}
        </div>
      </div>

      {linkModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-zinc-100 p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-modal-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="link-modal-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                {editingLinkId ? "Editar link" : "Nuevo link"}
              </h3>
              <button
                type="button"
                onClick={closeLinkModal}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <form className="grid gap-3" onSubmit={(e) => void saveLink(e)}>
              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                Título
                <input
                  className={inputClass}
                  placeholder="Ej. Drive del proyecto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={saving}
                  autoComplete="off"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                Link
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={saving}
                  autoComplete="off"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="mt-1 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
              >
                {saving ? "Guardando..." : editingLinkId ? "Guardar cambios" : "Agregar link"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Cuentas del cliente</p>
          <button
            type="button"
            onClick={openAccountModal}
            className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900"
          >
            Agregar cuenta
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Plataforma</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Contraseña</th>
                <th className="p-3">Link</th>
                <th className="p-3">Notas</th>
                <th className="p-3 w-12"> </th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className={`border-b border-zinc-100 last:border-b-0 ${editingAccountId === acc.id ? "bg-rose-50/80" : ""}`}
                >
                  <td className="p-3">{String(acc.platform ?? "")}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-[13px] text-zinc-900">{String(acc.username ?? "")}</span>
                      <button
                        type="button"
                        className={accountCopyBtnClass}
                        onClick={() => void copyAccountUsername(acc)}
                        aria-label="Copiar usuario"
                      >
                        Copiar
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleRevealPassword(acc.id)}
                        className="rounded border border-zinc-300 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
                      >
                        {revealedPasswords[acc.id] !== undefined ? revealedPasswords[acc.id] || "(vacía)" : "********"}
                      </button>
                      <button
                        type="button"
                        className={accountCopyBtnClass}
                        disabled={passwordCopyBusyId === acc.id}
                        onClick={() => void copyAccountPassword(acc.id)}
                        aria-label="Copiar contraseña"
                      >
                        {passwordCopyBusyId === acc.id ? "…" : "Copiar"}
                      </button>
                    </div>
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
                  <td className="p-3">
                    <RowActionsMenu
                      items={[
                        {
                          label: "Editar",
                          onClick: () => startEditAccount(acc),
                        },
                        {
                          label: "Eliminar",
                          danger: true,
                          onClick: () =>
                            setDeleteAccountConfirm({
                              id: acc.id,
                              platform: String(acc.platform ?? "Cuenta"),
                              username: String(acc.username ?? ""),
                            }),
                        },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {accountModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg rounded-2xl bg-zinc-100 p-5 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 id="account-modal-title" className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
                {editingAccountId ? "Editar cuenta" : "Nueva cuenta"}
              </h3>
              <button
                type="button"
                onClick={closeAccountModal}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <form
              className="grid gap-2 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void saveAccount();
              }}
            >
              <input
                className={inputClass}
                placeholder="Plataforma"
                value={accountPlatform}
                onChange={(e) => setAccountPlatform(e.target.value)}
                disabled={accountSaving}
                autoComplete="off"
              />
              <input
                className={inputClass}
                placeholder="Usuario"
                value={accountUsername}
                onChange={(e) => setAccountUsername(e.target.value)}
                disabled={accountSaving}
                autoComplete="off"
              />
              <div className="relative md:col-span-1">
                <input
                  className={`${inputClass} pr-19`}
                  placeholder={editingAccountId ? "Nueva contraseña (opcional)" : "Contraseña"}
                  type={showAccountPassword ? "text" : "password"}
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  disabled={accountSaving}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-200/80 disabled:opacity-50"
                  onClick={() => setShowAccountPassword((v) => !v)}
                  disabled={accountSaving}
                  aria-pressed={showAccountPassword}
                  aria-label={showAccountPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showAccountPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {editingAccountId ? (
                <p className="text-[11px] leading-snug text-zinc-500 md:col-span-2">
                  Si no completás la contraseña, se mantiene la que ya está guardada (si existe).
                </p>
              ) : null}
              <input
                className={inputClass}
                placeholder="URL"
                value={accountUrl}
                onChange={(e) => setAccountUrl(e.target.value)}
                disabled={accountSaving}
                autoComplete="off"
              />
              <textarea
                className={`${inputClass} md:col-span-2 min-h-[72px]`}
                placeholder="Notas"
                value={accountNotes}
                onChange={(e) => setAccountNotes(e.target.value)}
                disabled={accountSaving}
              />
              <button
                type="submit"
                disabled={accountSaving}
                className="md:col-span-2 mt-1 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
              >
                {accountSaving ? "Guardando..." : editingAccountId ? "Guardar cambios" : "Guardar cuenta"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type InvoiceRow = Record<string, unknown> & { id: string };

function parseInvoiceHistory(inv: InvoiceRow): Array<{ id: string; paidAt: string; amount: number; kind: string; note?: string }> {
  const h = inv.paymentHistory;
  if (!Array.isArray(h)) return [];
  return h.filter(Boolean) as Array<{ id: string; paidAt: string; amount: number; kind: string; note?: string }>;
}

function invoiceTotal(inv: InvoiceRow): number | null {
  const raw = inv.amount;
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

function formatInvoiceMoney(amount: unknown, currency: unknown): string {
  const n = amount != null && amount !== "" ? Number(amount) : NaN;
  if (!Number.isFinite(n) || n <= 0) return "—";
  const cur = String(currency ?? "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: cur }).format(n);
  } catch {
    return `${cur} ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

function paymentStatusLabel(status: string): string {
  if (status === "paid") return "Pagado";
  if (status === "partially_paid") return "Pago parcial";
  return "Pendiente";
}

function invoicePaymentBadgeClass(status: string): string {
  if (status === "paid") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "partially_paid") return "border-orange-200 bg-orange-50 text-orange-900";
  return "border-amber-100 bg-amber-50/80 text-amber-900";
}

function mailCobroBadgeClass(sent: boolean): string {
  return sent ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-100 text-zinc-600";
}

function formatIsoDateShort(iso: string): string {
  if (!iso || iso.length < 10) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("es-AR");
}

function BillingTab({
  clientId,
  invoices,
  onRefresh,
  onFlash,
}: {
  clientId: string;
  invoices: InvoiceRow[];
  onRefresh: () => void;
  onFlash: (f: { type: "ok" | "err"; text: string } | null) => void;
}) {
  const [createTitle, setCreateTitle] = useState("");
  const [createLink, setCreateLink] = useState("");
  const [createMailSent, setCreateMailSent] = useState(false);
  const [createAmount, setCreateAmount] = useState("");
  const [createCurrency, setCreateCurrency] = useState("USD");
  const [createSaving, setCreateSaving] = useState(false);

  const [detailInvoice, setDetailInvoice] = useState<InvoiceRow | null>(null);
  const [editInvoice, setEditInvoice] = useState<InvoiceRow | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editMailSent, setEditMailSent] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");
  const [editSaving, setEditSaving] = useState(false);

  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceRow | null>(null);
  const [payKind, setPayKind] = useState<"full" | "partial">("full");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payAmount, setPayAmount] = useState("");
  const [payCurrency, setPayCurrency] = useState("USD");
  const [payNote, setPayNote] = useState("");
  const [paySaving, setPaySaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);

  const summary = useMemo(() => {
    let totalFacturado = 0;
    let totalCobrado = 0;
    let pendiente = 0;
    let facturasPendientes = 0;
    for (const inv of invoices) {
      const t = invoiceTotal(inv);
      if (t != null) totalFacturado += t;
      const paid = Number(inv.paidAmount ?? 0);
      if (Number.isFinite(paid)) totalCobrado += paid;
      const remRaw = inv.remainingAmount;
      if (remRaw != null && Number.isFinite(Number(remRaw))) {
        pendiente += Math.max(0, Number(remRaw));
      } else if (t != null) {
        pendiente += Math.max(0, t - paid);
      }
      const st = String(inv.status ?? "");
      if (st !== "paid") facturasPendientes += 1;
    }
    return { totalFacturado, totalCobrado, pendiente, facturasPendientes };
  }, [invoices]);

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateLink("");
    setCreateMailSent(false);
    setCreateAmount("");
    setCreateCurrency("USD");
  };

  const openEdit = (inv: InvoiceRow) => {
    setEditInvoice(inv);
    setEditTitle(String(inv.periodLabel ?? ""));
    setEditLink(String(inv.invoiceLink ?? ""));
    setEditMailSent(Boolean(inv.collectionEmailSent));
    const t = invoiceTotal(inv);
    setEditAmount(t != null ? String(t) : "");
    setEditCurrency(String(inv.currency ?? "USD") || "USD");
  };

  const closeEdit = () => {
    if (editSaving) return;
    setEditInvoice(null);
  };

  const submitCreate = async () => {
    const title = createTitle.trim();
    if (!title) {
      onFlash({ type: "err", text: "Completá el título de la factura." });
      return;
    }
    setCreateSaving(true);
    try {
      const payload: Record<string, unknown> = {
        periodLabel: title,
        collectionEmailSent: createMailSent,
      };
      const link = createLink.trim();
      if (link) payload.invoiceLink = link;
      const rawAmt = createAmount.replace(",", ".").trim();
      if (rawAmt) {
        const n = Number(rawAmt);
        if (!Number.isFinite(n) || n <= 0) {
          onFlash({ type: "err", text: "El monto debe ser un número mayor a 0." });
          return;
        }
        payload.amount = n;
        payload.currency = createCurrency;
      }
      const res = await fetch(`/api/admin/clients/${clientId}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo guardar la factura." });
        return;
      }
      resetCreateForm();
      onFlash({ type: "ok", text: "Factura registrada." });
      onRefresh();
    } finally {
      setCreateSaving(false);
    }
  };

  const submitEdit = async () => {
    if (!editInvoice) return;
    const title = editTitle.trim();
    if (!title) {
      onFlash({ type: "err", text: "El título es obligatorio." });
      return;
    }
    setEditSaving(true);
    try {
      const payload: Record<string, unknown> = {
        periodLabel: title,
        collectionEmailSent: editMailSent,
        invoiceLink: editLink.trim(),
      };
      const rawAmt = editAmount.replace(",", ".").trim();
      if (rawAmt) {
        const n = Number(rawAmt);
        if (!Number.isFinite(n) || n <= 0) {
          onFlash({ type: "err", text: "El monto debe ser un número mayor a 0." });
          return;
        }
        payload.amount = n;
        payload.currency = editCurrency;
      } else {
        payload.amount = undefined;
        payload.currency = undefined;
      }
      const res = await fetch(`/api/admin/clients/${clientId}/invoices/${editInvoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo actualizar." });
        return;
      }
      setEditInvoice(null);
      onFlash({ type: "ok", text: "Factura actualizada." });
      onRefresh();
    } finally {
      setEditSaving(false);
    }
  };

  const openPaymentModal = (inv: InvoiceRow) => {
    setPaymentInvoice(inv);
    setPayKind("full");
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayAmount("");
    setPayCurrency(String(inv.currency ?? "USD") || "USD");
    setPayNote("");
  };

  const submitPayment = async () => {
    if (!paymentInvoice) return;
    const paidAtIso = new Date(`${payDate}T12:00:00`).toISOString();
    const totalKnown = invoiceTotal(paymentInvoice);
    const body: Record<string, unknown> = {
      kind: payKind,
      paidAt: paidAtIso,
      note: payNote.trim(),
    };
    if (payKind === "partial") {
      const n = Number(payAmount.replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) {
        onFlash({ type: "err", text: "Indicá el monto del pago parcial." });
        return;
      }
      body.amount = n;
    } else if (totalKnown == null) {
      const n = Number(payAmount.replace(",", "."));
      if (!Number.isFinite(n) || n <= 0) {
        onFlash({ type: "err", text: "Indicá el monto total cobrado." });
        return;
      }
      body.amount = n;
      body.currency = payCurrency;
    }

    setPaySaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/invoices/${paymentInvoice.id}/record-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo registrar el pago." });
        return;
      }
      setPaymentInvoice(null);
      setDetailInvoice(null);
      onFlash({ type: "ok", text: "Pago registrado." });
      onRefresh();
    } finally {
      setPaySaving(false);
    }
  };

  const runDelete = async () => {
    if (!deleteConfirm) return;
    setDeletingInvoiceId(deleteConfirm.id);
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/invoices/${deleteConfirm.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const j = (await readAdminFetchJson(res)) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        onFlash({ type: "err", text: j.error ?? "No se pudo eliminar." });
        return;
      }
      setDeleteConfirm(null);
      setDetailInvoice(null);
      onFlash({ type: "ok", text: "Factura eliminada." });
      onRefresh();
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const pendingAfterPartialPreview = () => {
    if (!paymentInvoice || payKind !== "partial") return null;
    const total = invoiceTotal(paymentInvoice);
    const paidBefore = Number(paymentInvoice.paidAmount ?? 0);
    const partial = Number(payAmount.replace(",", "."));
    if (total == null || !Number.isFinite(partial) || partial <= 0) return null;
    return Math.max(0, Math.round((total - paidBefore - partial) * 100) / 100);
  };

  const previewPending = pendingAfterPartialPreview();

  return (
    <div className="grid gap-6">
      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="¿Eliminar esta factura?"
        description={
          deleteConfirm ? `Se borrará «${deleteConfirm.title}» y el historial asociado.` : undefined
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={Boolean(deletingInvoiceId)}
        onCancel={() => !deletingInvoiceId && setDeleteConfirm(null)}
        onConfirm={() => void runDelete()}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Facturación y pagos</h3>
          <p className="mt-1 max-w-xl text-xs text-zinc-500">
            Referencias de factura y cobros vinculados a cada una. Los pagos se registran desde la tabla o el detalle.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            { label: "Total facturado", value: summary.totalFacturado.toLocaleString("es-AR", { minimumFractionDigits: 2 }) },
            { label: "Total cobrado", value: summary.totalCobrado.toLocaleString("es-AR", { minimumFractionDigits: 2 }) },
            { label: "Pendiente de cobro", value: summary.pendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 }) },
            { label: "Facturas pendientes", value: String(summary.facturasPendientes) },
          ] as const
        ).map((card) => (
          <div key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-2 text-xl font-semibold tabular-nums text-zinc-900">{card.value}</p>
            {card.label !== "Facturas pendientes" ? (
              <p className="mt-1 text-[10px] text-zinc-400">Suma nominal (si mezclás monedas, usalo como referencia)</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Nueva factura</p>
        <p className="mt-1 text-[11px] text-zinc-500">Siempre inicia como pendiente de pago; el cobro se registra después.</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          <input
            className={`${inputClass} lg:col-span-2`}
            placeholder="Título · ej. Abono mayo 2026"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Link de la factura (URL)"
            value={createLink}
            onChange={(e) => setCreateLink(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-zinc-700 md:col-span-2">
            <input type="checkbox" checked={createMailSent} onChange={(e) => setCreateMailSent(e.target.checked)} />
            Mail de cobro enviado
          </label>
          <input className={inputClass} placeholder="Monto (opcional)" value={createAmount} onChange={(e) => setCreateAmount(e.target.value)} />
          <select className={inputClass} value={createCurrency} onChange={(e) => setCreateCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
        <button
          type="button"
          disabled={createSaving || !createTitle.trim()}
          onClick={() => void submitCreate()}
          className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
        >
          {createSaving ? "Guardando..." : "Guardar factura"}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="p-3">Factura</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Mail cobro</th>
                <th className="p-3">Estado de pago</th>
                <th className="p-3">Cobrado</th>
                <th className="p-3">Pendiente</th>
                <th className="p-3">Fecha pago</th>
                <th className="p-3">Link</th>
                <th className="w-12 p-3"> </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-zinc-600">
                    No hay facturas cargadas.
                  </td>
                </tr>
              ) : (
                invoices.map((r) => {
                  const st = String(r.status ?? "pending_payment");
                  const mailSent = Boolean(r.collectionEmailSent);
                  const paidAt = String(r.paidAt ?? "").slice(0, 10);
                  return (
                    <tr key={r.id} className={`border-b border-zinc-100 last:border-b-0 ${detailInvoice?.id === r.id ? "bg-rose-50/60" : ""}`}>
                      <td className="p-3 font-medium text-zinc-900">{String(r.periodLabel ?? "")}</td>
                      <td className="p-3 tabular-nums">{formatInvoiceMoney(r.amount, r.currency)}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${mailCobroBadgeClass(mailSent)}`}>
                          {mailSent ? "Enviado" : "No enviado"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${invoicePaymentBadgeClass(st)}`}>
                          {paymentStatusLabel(st)}
                        </span>
                      </td>
                      <td className="p-3 tabular-nums text-zinc-800">{formatInvoiceMoney(r.paidAmount ?? 0, r.currency)}</td>
                      <td className="p-3 tabular-nums text-zinc-700">
                        {r.remainingAmount != null && r.remainingAmount !== ""
                          ? formatInvoiceMoney(r.remainingAmount, r.currency)
                          : invoiceTotal(r) != null
                            ? formatInvoiceMoney(Math.max(0, invoiceTotal(r)! - Number(r.paidAmount ?? 0)), r.currency)
                            : "—"}
                      </td>
                      <td className="p-3 text-zinc-600">{paidAt || "—"}</td>
                      <td className="p-3">
                        {r.invoiceLink ? (
                          <a
                            href={String(r.invoiceLink)}
                            className="font-medium text-[#db2777] underline-offset-2 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="p-3">
                        <RowActionsMenu
                          items={[
                            { label: "Ver detalle", onClick: () => setDetailInvoice(r) },
                            { label: "Editar", onClick: () => openEdit(r) },
                            ...(st !== "paid"
                              ? [{ label: "Registrar pago", onClick: () => openPaymentModal(r) }]
                              : []),
                            {
                              label: "Eliminar",
                              danger: true,
                              onClick: () => setDeleteConfirm({ id: r.id, title: String(r.periodLabel ?? "Factura") }),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailInvoice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-zinc-100 shadow-lg">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-zinc-900">{String(detailInvoice.periodLabel ?? "")}</h4>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${invoicePaymentBadgeClass(String(detailInvoice.status ?? ""))}`}>
                  {paymentStatusLabel(String(detailInvoice.status ?? ""))}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailInvoice(null)}
                className="shrink-0 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 text-sm">
              <dl className="grid gap-2 text-zinc-700">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Link</dt>
                  <dd className="text-right font-medium">
                    {detailInvoice.invoiceLink ? (
                      <a href={String(detailInvoice.invoiceLink)} className="text-[#db2777] hover:underline" target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Mail cobro enviado</dt>
                  <dd>{Boolean(detailInvoice.collectionEmailSent) ? "Sí" : "No"}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Monto</dt>
                  <dd className="tabular-nums">{formatInvoiceMoney(detailInvoice.amount, detailInvoice.currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Cobrado</dt>
                  <dd className="tabular-nums">{formatInvoiceMoney(detailInvoice.paidAmount ?? 0, detailInvoice.currency)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Pendiente</dt>
                  <dd className="tabular-nums font-medium text-orange-800">
                    {detailInvoice.remainingAmount != null && detailInvoice.remainingAmount !== ""
                      ? formatInvoiceMoney(detailInvoice.remainingAmount, detailInvoice.currency)
                      : invoiceTotal(detailInvoice) != null
                        ? formatInvoiceMoney(
                            Math.max(0, invoiceTotal(detailInvoice)! - Number(detailInvoice.paidAmount ?? 0)),
                            detailInvoice.currency,
                          )
                        : "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Último pago</dt>
                  <dd>{detailInvoice.paidAt ? formatIsoDateShort(String(detailInvoice.paidAt)) : "—"}</dd>
                </div>
              </dl>

              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-600">Historial de pagos</p>
                <ul className="mt-2 space-y-2">
                  {parseInvoiceHistory(detailInvoice).length === 0 ? (
                    <li className="text-xs text-zinc-500">Sin movimientos.</li>
                  ) : (
                    [...parseInvoiceHistory(detailInvoice)]
                      .reverse()
                      .map((e) => (
                        <li key={e.id} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs">
                          <span className="font-medium text-zinc-900">{formatIsoDateShort(e.paidAt)}</span>
                          <span className="mx-2 text-zinc-400">—</span>
                          <span className="tabular-nums">{formatInvoiceMoney(e.amount, detailInvoice.currency)}</span>
                          <span className="ml-2 text-zinc-600">{e.kind === "full" ? "Pago total" : "Pago parcial"}</span>
                          {e.note ? <p className="mt-1 text-zinc-500">{e.note}</p> : null}
                        </li>
                      ))
                  )}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    openEdit(detailInvoice);
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
                >
                  Editar factura
                </button>
                {String(detailInvoice.status ?? "") !== "paid" ? (
                  <button
                    type="button"
                    onClick={() => {
                      openPaymentModal(detailInvoice);
                    }}
                    className="rounded-xl bg-rose-300 px-3 py-2 text-xs font-semibold text-zinc-900"
                  >
                    Registrar pago
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() =>
                    setDeleteConfirm({
                      id: detailInvoice.id,
                      title: String(detailInvoice.periodLabel ?? "Factura"),
                    })
                  }
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editInvoice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-100 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Editar factura</h4>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <div className="grid gap-2">
              <input className={inputClass} placeholder="Título" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
              <input className={inputClass} placeholder="Link" value={editLink} onChange={(e) => setEditLink(e.target.value)} />
              <label className="flex items-center gap-2 text-xs text-zinc-700">
                <input type="checkbox" checked={editMailSent} onChange={(e) => setEditMailSent(e.target.checked)} />
                Mail de cobro enviado
              </label>
              <input className={inputClass} placeholder="Monto (opcional)" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
              <select className={inputClass} value={editCurrency} onChange={(e) => setEditCurrency(e.target.value)}>
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
              <p className="text-[11px] text-zinc-500">
                Si cambiás el monto, el pendiente se recalcula según los pagos ya registrados.
              </p>
              <button
                type="button"
                disabled={editSaving}
                onClick={() => void submitEdit()}
                className="mt-2 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
              >
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {paymentInvoice ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-zinc-100 p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Registrar pago</h4>
              <button
                type="button"
                onClick={() => !paySaving && setPaymentInvoice(null)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs text-zinc-600">{String(paymentInvoice.periodLabel ?? "")}</p>
            <div className="mt-4 grid gap-3">
              <div className="flex gap-4 text-xs font-medium text-zinc-800">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="pay-kind" checked={payKind === "full"} onChange={() => setPayKind("full")} />
                  Pago total
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="radio" name="pay-kind" checked={payKind === "partial"} onChange={() => setPayKind("partial")} />
                  Pago parcial
                </label>
              </div>
              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                Fecha de pago
                <input className={inputClass} type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </label>
              {payKind === "partial" ? (
                <label className="grid gap-1 text-xs font-medium text-zinc-600">
                  Monto pagado
                  <input className={inputClass} placeholder="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </label>
              ) : invoiceTotal(paymentInvoice) == null ? (
                <>
                  <label className="grid gap-1 text-xs font-medium text-zinc-600">
                    Monto total cobrado
                    <input className={inputClass} placeholder="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                  </label>
                  <select className={inputClass} value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </>
              ) : null}
              <label className="grid gap-1 text-xs font-medium text-zinc-600">
                Nota (opcional)
                <input className={inputClass} value={payNote} onChange={(e) => setPayNote(e.target.value)} />
              </label>
              {payKind === "partial" && previewPending != null ? (
                <p className="text-xs text-orange-800">
                  Pendiente después de este pago:{" "}
                  <span className="font-semibold tabular-nums">
                    {formatInvoiceMoney(previewPending, paymentInvoice.currency)}
                  </span>
                </p>
              ) : null}
              <button
                type="button"
                disabled={paySaving}
                onClick={() => void submitPayment()}
                className="rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
              >
                {paySaving ? "Guardando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
