"use client";

import { RiCloseLine } from "@remixicon/react";
import { useEffect, useMemo, useState } from "react";
import type { ExpenseCategory, ExpenseMember, ExpenseMovement } from "@/types/expenses";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-800 focus:border-rose-300 focus:ring-rose-300";

const labelClass = "mb-1 block text-[11px] font-medium text-zinc-600";

function todayInputDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type ModalFrameProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
};

function ModalFrame({ title, onClose, children, footer }: ModalFrameProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex cursor-pointer items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-lg cursor-default overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exp-modal-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white px-4 py-3">
          <h2 id="exp-modal-title" className="text-sm font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <RiCloseLine className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">{children}</div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/90 px-4 py-3 backdrop-blur">
          {footer}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "dominio", label: "Dominio" },
  { value: "hosting", label: "Hosting" },
  { value: "suscripcion", label: "Suscripción" },
  { value: "diseno", label: "Diseño" },
  { value: "publicidad", label: "Publicidad" },
  { value: "otros", label: "Otros" },
];

type CreateExpenseProps = {
  open: boolean;
  onClose: () => void;
  periodId: string;
  members: ExpenseMember[];
  onSaved: () => void | Promise<void>;
  /** Si true (ej. CTA “Nueva recurrencia”), abre con recurrencia activada. */
  defaultRecurrent?: boolean;
};

export function CreateExpenseModal({
  open,
  onClose,
  periodId,
  members,
  onSaved,
  defaultRecurrent = false,
}: CreateExpenseProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  const [date, setDate] = useState(todayInputDate());
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [pctByMember, setPctByMember] = useState<Record<string, string>>({});
  const [recurrent, setRecurrent] = useState(defaultRecurrent);
  const [startMonth, setStartMonth] = useState(currentYYYYMM());
  const [endMonth, setEndMonth] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    setRecurrent(defaultRecurrent);
    if (members[0]?.id) setPaidBy((p) => p || members[0]!.id);
    const initPct: Record<string, string> = {};
    for (const m of members) initPct[m.id] = members.length ? String(Math.round((100 / members.length) * 100) / 100) : "0";
    setPctByMember(initPct);
    setStartMonth(periodId || currentYYYYMM());
  }, [open, members, defaultRecurrent, periodId]);

  const participantsEqual = useMemo(
    () =>
      members.map((m) => ({
        memberId: m.id,
        shareType: "percentage" as const,
        shareValue: 0,
      })),
    [members],
  );

  const participantsCustom = useMemo(() => {
    return members.map((m) => ({
      memberId: m.id,
      shareType: "percentage" as const,
      shareValue: Number(pctByMember[m.id] ?? 0),
    }));
  }, [members, pctByMember]);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const amt = Number(amount.replace(",", "."));
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido.");

      if (recurrent) {
        const body = {
          title: title.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          amount: amt,
          currency: currency.toUpperCase(),
          paidByMemberId: paidBy,
          splitMode,
          participants: splitMode === "equal" ? participantsEqual : participantsCustom,
          frequency: "monthly" as const,
          startMonth: startMonth.trim() || currentYYYYMM(),
          endMonth: endMonth.trim() ? endMonth.trim() : null,
          dayOfMonth: dayOfMonth.trim() ? Math.min(31, Math.max(1, parseInt(dayOfMonth, 10))) : null,
        };
        const res = await fetch("/api/admin/expenses/recurrences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "include",
        });
        const json = (await res.json()) as { ok?: boolean; error?: unknown };
        if (!json.ok) throw new Error(typeof json.error === "string" ? json.error : "No se pudo crear la recurrencia.");
      } else {
        const res = await fetch("/api/admin/expenses/movements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "expense",
            periodId,
            title: title.trim(),
            description: description.trim() || undefined,
            category: category || undefined,
            amount: amt,
            currency: currency.toUpperCase(),
            date,
            paidByMemberId: paidBy,
            splitMode,
            participants: splitMode === "equal" ? participantsEqual : participantsCustom,
          }),
          credentials: "include",
        });
        const json = (await res.json()) as { ok?: boolean; error?: unknown };
        if (!json.ok) throw new Error(typeof json.error === "string" ? json.error : "No se pudo registrar el gasto.");
      }

      await onSaved();
      onClose();
      setTitle("");
      setDescription("");
      setAmount("");
      setRecurrent(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title={recurrent ? "Nueva recurrencia mensual" : "Nuevo gasto"}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}

      <label className={labelClass}>
        <input type="checkbox" checked={recurrent} onChange={(e) => setRecurrent(e.target.checked)} className="mr-2 align-middle" />
        Recurrencia mensual (sólo plantea el gasto automático; no duplica un gasto puntual este mes si ya se genera por la recurrencia)
      </label>

      <div>
        <span className={labelClass}>Título</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Dominio web" />
      </div>
      <div>
        <span className={labelClass}>Descripción (opcional)</span>
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Monto</span>
          <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <span className={labelClass}>Moneda</span>
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["ARS", "USD", "EUR", "BRL"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Pagó</span>
          <select className={inputClass} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        {!recurrent ? (
          <div>
            <span className={labelClass}>Fecha</span>
            <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        ) : (
          <div>
            <span className={labelClass}>Día del mes (opcional)</span>
            <input className={inputClass} value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} placeholder="15" />
          </div>
        )}
      </div>
      <div>
        <span className={labelClass}>Categoría (opcional)</span>
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory((e.target.value || "") as ExpenseCategory | "")}
        >
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className={labelClass}>Reparto</span>
        <div className="flex gap-3 text-xs text-zinc-700">
          <label>
            <input type="radio" checked={splitMode === "equal"} onChange={() => setSplitMode("equal")} className="mr-1" />
            Igual
          </label>
          <label>
            <input type="radio" checked={splitMode === "custom"} onChange={() => setSplitMode("custom")} className="mr-1" />
            Personalizado (%)
          </label>
        </div>
      </div>
      {splitMode === "custom" ? (
        <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <span className="w-24 text-xs text-zinc-600">{m.name}</span>
              <input
                className={inputClass}
                value={pctByMember[m.id] ?? ""}
                onChange={(e) => setPctByMember((s) => ({ ...s, [m.id]: e.target.value }))}
                inputMode="decimal"
              />
              <span className="text-xs text-zinc-500">%</span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-500">Los porcentajes deben sumar 100%.</p>
        </div>
      ) : null}

      {recurrent ? (
        <div className="grid grid-cols-2 gap-2 border-t border-dashed border-zinc-200 pt-3">
          <div>
            <span className={labelClass}>Mes inicio (YYYY-MM)</span>
            <input className={inputClass} value={startMonth} onChange={(e) => setStartMonth(e.target.value)} placeholder="2026-04" />
          </div>
          <div>
            <span className={labelClass}>Mes fin (opcional)</span>
            <input className={inputClass} value={endMonth} onChange={(e) => setEndMonth(e.target.value)} placeholder="2026-12" />
          </div>
        </div>
      ) : null}
    </ModalFrame>
  );
}

type SettlementProps = {
  open: boolean;
  onClose: () => void;
  periodId: string;
  members: ExpenseMember[];
  onSaved: () => void | Promise<void>;
};

export function SettlementModal({ open, onClose, periodId, members, onSaved }: SettlementProps) {
  const [from, setFrom] = useState(members[0]?.id ?? "");
  const [to, setTo] = useState(members[1]?.id ?? members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [date, setDate] = useState(todayInputDate());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (members[0]) setFrom((f) => f || members[0]!.id);
    if (members[1]) setTo((t) => t || members[1]!.id);
  }, [open, members]);

  if (!open) return null;

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const amt = Number(amount.replace(",", "."));
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido.");
      if (from === to) throw new Error("Origen y destino distintos.");
      const res = await fetch("/api/admin/expenses/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "settlement",
          periodId,
          fromMemberId: from,
          toMemberId: to,
          amount: amt,
          currency: currency.toUpperCase(),
          date,
          note: note.trim() || undefined,
        }),
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!json.ok) throw new Error(typeof json.error === "string" ? json.error : "No se pudo registrar el pago.");
      await onSaved();
      onClose();
      setAmount("");
      setNote("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title="Registrar pago / saldar"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? "Guardando…" : "Registrar pago"}
          </button>
        </>
      }
    >
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Quién paga</span>
          <select className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelClass}>Quién recibe</span>
          <select className={inputClass} value={to} onChange={(e) => setTo(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Monto</span>
          <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <span className={labelClass}>Moneda</span>
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["ARS", "USD", "EUR", "BRL"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <span className={labelClass}>Fecha</span>
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <span className={labelClass}>Nota (opcional)</span>
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </ModalFrame>
  );
}

type RecurrenceOnlyProps = {
  open: boolean;
  onClose: () => void;
  members: ExpenseMember[];
  onSaved: () => void | Promise<void>;
};

/** Atajo: misma UX que nuevo gasto con recurrencia activada. */
export function RecurrenceOnlyModal({ open, onClose, members, onSaved }: RecurrenceOnlyProps) {
  const pid = currentYYYYMM();
  return (
    <CreateExpenseModal
      open={open}
      onClose={onClose}
      periodId={pid}
      members={members}
      onSaved={onSaved}
      defaultRecurrent
    />
  );
}

type EditExpenseProps = {
  open: boolean;
  onClose: () => void;
  movement: (ExpenseMovement & { id: string }) | null;
  periodId: string;
  members: ExpenseMember[];
  onSaved: () => void | Promise<void>;
};

export function EditExpenseModal({ open, onClose, movement, periodId, members, onSaved }: EditExpenseProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paidBy, setPaidBy] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | "">("");
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [pctByMember, setPctByMember] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !movement) return;
    setTitle(movement.title);
    setDescription(movement.description ?? "");
    setAmount(String(movement.amount));
    setCurrency(movement.currency);
    setPaidBy(movement.paidByMemberId ?? members[0]?.id ?? "");
    const d = movement.date.slice(0, 10);
    setDate(d.includes("T") ? movement.date.split("T")[0]! : d);
    setCategory((movement.category as ExpenseCategory) ?? "");
    setSplitMode(movement.splitMode ?? "equal");
    const pct: Record<string, string> = {};
    for (const p of movement.participants ?? []) {
      pct[p.memberId] = String(p.shareValue);
    }
    for (const m of members) {
      if (pct[m.id] == null) pct[m.id] = "0";
    }
    setPctByMember(pct);
    setError("");
  }, [open, movement, members]);

  if (!open || !movement) return null;

  const participantsEqual = members.map((m) => ({
    memberId: m.id,
    shareType: "percentage" as const,
    shareValue: 0,
  }));

  const participantsCustom = members.map((m) => ({
    memberId: m.id,
    shareType: "percentage" as const,
    shareValue: Number(pctByMember[m.id] ?? 0),
  }));

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const amt = Number(amount.replace(",", "."));
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Monto inválido.");
      const res = await fetch(`/api/admin/expenses/movements/${periodId}/${movement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          amount: amt,
          currency: currency.toUpperCase(),
          date,
          paidByMemberId: paidBy,
          splitMode,
          participants: splitMode === "equal" ? participantsEqual : participantsCustom,
        }),
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: unknown };
      if (!json.ok) throw new Error(typeof json.error === "string" ? json.error : "No se pudo actualizar.");
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalFrame
      title="Editar gasto"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            onClick={() => void submit()}
            disabled={loading}
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </>
      }
    >
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <div>
        <span className={labelClass}>Título</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <span className={labelClass}>Descripción (opcional)</span>
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Monto</span>
          <input className={inputClass} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <span className={labelClass}>Moneda</span>
          <select className={inputClass} value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {["ARS", "USD", "EUR", "BRL"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className={labelClass}>Pagó</span>
          <select className={inputClass} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className={labelClass}>Fecha</span>
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>
      <div>
        <span className={labelClass}>Categoría (opcional)</span>
        <select
          className={inputClass}
          value={category}
          onChange={(e) => setCategory((e.target.value || "") as ExpenseCategory | "")}
        >
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <span className={labelClass}>Reparto</span>
        <div className="flex gap-3 text-xs text-zinc-700">
          <label>
            <input type="radio" checked={splitMode === "equal"} onChange={() => setSplitMode("equal")} className="mr-1" />
            Igual
          </label>
          <label>
            <input type="radio" checked={splitMode === "custom"} onChange={() => setSplitMode("custom")} className="mr-1" />
            Personalizado (%)
          </label>
        </div>
      </div>
      {splitMode === "custom" ? (
        <div className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50/80 p-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <span className="w-24 text-xs text-zinc-600">{m.name}</span>
              <input
                className={inputClass}
                value={pctByMember[m.id] ?? ""}
                onChange={(e) => setPctByMember((s) => ({ ...s, [m.id]: e.target.value }))}
              />
              <span className="text-xs text-zinc-500">%</span>
            </div>
          ))}
        </div>
      ) : null}
    </ModalFrame>
  );
}
