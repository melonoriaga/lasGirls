"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
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
            <h1 className="text-2xl font-semibold text-zinc-900">{name}</h1>
            <p className="mt-1 text-sm text-zinc-600">{String(client.email ?? "")}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Estado: <strong className="text-zinc-800">{String(client.status ?? "—")}</strong> · Alta{" "}
              {String(client.createdAt ?? "").slice(0, 10)}
            </p>
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
            <InvoicesTab clientId={clientId} rows={invoices} onRefresh={() => void loadTabData()} onFlash={onFlash} />
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

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">Datos generales</h2>
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
  const add = async () => {
    const res = await fetch(`/api/admin/clients/${clientId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, category, description }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !j.ok) {
      onFlash({ type: "err", text: j.error ?? "Error" });
      return;
    }
    setTitle("");
    setUrl("");
    setDescription("");
    onFlash({ type: "ok", text: "Link agregado." });
    onRefresh();
  };
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-600">Nuevo link</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input className={inputClass} placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className={inputClass} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
            {["drive", "slides", "sheets", "figma", "invoice", "brief", "assets", "other"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input className={inputClass} placeholder="Nota" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="button" onClick={() => void add()} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900">
          Agregar
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3">Título</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">URL</th>
              <th className="p-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100">
                <td className="p-3">{String(r.title ?? "")}</td>
                <td className="p-3">{String(r.category ?? "")}</td>
                <td className="p-3">
                  <a href={String(r.url ?? "#")} className="text-[#db2777] hover:underline" target="_blank" rel="noreferrer">
                    abrir
                  </a>
                </td>
                <td className="p-3 text-zinc-500">{String(r.createdAt ?? "").slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoicesTab({
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
  const [periodLabel, setPeriodLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [status, setStatus] = useState("draft");
  const [invoiceLink, setInvoiceLink] = useState("");
  const add = async () => {
    const res = await fetch(`/api/admin/clients/${clientId}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodLabel,
        amount: Number(amount) || 0,
        currency,
        status,
        invoiceLink: invoiceLink || undefined,
      }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !j.ok) {
      onFlash({ type: "err", text: j.error ?? "Error" });
      return;
    }
    setPeriodLabel("");
    setAmount("");
    setInvoiceLink("");
    onFlash({ type: "ok", text: "Factura registrada." });
    onRefresh();
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
        </div>
        <button type="button" onClick={() => void add()} className="mt-3 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900">
          Guardar
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3">Período</th>
              <th className="p-3">Monto</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Enviada</th>
              <th className="p-3">Link</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-zinc-100">
                <td className="p-3">{String(r.periodLabel ?? "")}</td>
                <td className="p-3">
                  {String(r.currency ?? "")} {String(r.amount ?? "")}
                </td>
                <td className="p-3">{String(r.status ?? "")}</td>
                <td className="p-3 text-zinc-500">{String(r.sentAt ?? "").slice(0, 10)}</td>
                <td className="p-3">
                  {r.invoiceLink ? (
                    <a href={String(r.invoiceLink)} className="text-[#db2777] hover:underline" target="_blank" rel="noreferrer">
                      ver
                    </a>
                  ) : (
                    "—"
                  )}
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
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[800px] text-left text-sm">
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
