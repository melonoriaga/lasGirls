"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { MovementStatusBadge, MovementTypeBadge } from "@/components/admin/expenses/expense-badges";
import { EditExpenseModal } from "@/components/admin/expenses/expenses-modals";
import type { ExpenseMember, ExpenseMovement, PeriodBalanceSummary } from "@/types/expenses";
import { memberNameMap } from "@/lib/expenses/member-display";
import { memberShortLabel } from "@/lib/expenses/history-summary";
import { ExpensePayerSplitCell, SettlementFlowCell } from "@/components/admin/expenses/expense-movement-people";
import { ExpensesHelpTrigger } from "@/components/admin/expenses/expenses-help-modal";
import { SectionHelpTrigger } from "@/components/admin/section-help-trigger";

const cell = "whitespace-nowrap px-3 py-2.5 text-xs text-zinc-700";
const cellPeople = "min-w-[220px] max-w-[280px] px-3 py-2.5 align-top text-xs text-zinc-700";
const th = "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500";

type DetailResponse = {
  ok?: boolean;
  periodId?: string;
  period?: Record<string, unknown> | null;
  members?: ExpenseMember[];
  movements?: Array<ExpenseMovement & { id: string }>;
  expenses?: Array<ExpenseMovement & { id: string }>;
  settlements?: Array<ExpenseMovement & { id: string }>;
  balance?: PeriodBalanceSummary;
  error?: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export function ExpensesPeriodDetailPanel({ periodId, actorUid }: { periodId: string; actorUid: string }) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [label, setLabel] = useState(periodId);
  const [members, setMembers] = useState<ExpenseMember[]>([]);
  const [movements, setMovements] = useState<Array<ExpenseMovement & { id: string }>>([]);
  const [settlements, setSettlements] = useState<Array<ExpenseMovement & { id: string }>>([]);
  const [balance, setBalance] = useState<PeriodBalanceSummary | null>(null);
  const [editMovement, setEditMovement] = useState<(ExpenseMovement & { id: string }) | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const names = memberNameMap(members);
  const memberById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, ExpenseMember>,
    [members],
  );
  const expensesInPeriod = useMemo(() => movements.filter((m) => m.type === "expense"), [movements]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/expenses/periods/${periodId}`, { cache: "no-store", credentials: "include" });
      const json = (await res.json()) as DetailResponse;
      if (!json.ok) throw new Error(json.error ?? "No se pudo cargar el período.");
      setMembers(json.members ?? []);
      setMovements(json.movements ?? []);
      setSettlements(json.settlements ?? []);
      setBalance(json.balance ?? null);
      const pl = json.period?.label;
      if (typeof pl === "string" && pl) setLabel(pl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [periodId]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    try {
      const res = await fetch(`/api/admin/expenses/movements/${periodId}/${cancelTarget.id}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "No se pudo anular.");
      toast.success("Movimiento anulado.");
      setCancelTarget(null);
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  };

  const confirmDeleteMovement = async () => {
    if (!deleteTarget) return;
    const toDeleteId = deleteTarget.id;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/expenses/movements/${periodId}/${toDeleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error ?? "No se pudo eliminar.");
      setMovements((prev) => prev.filter((m) => m.id !== toDeleteId));
      setSettlements((prev) => prev.filter((m) => m.id !== toDeleteId));
      toast.success("Movimiento eliminado.");
      setDeleteTarget(null);
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/expenses"
          className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 hover:text-rose-900"
        >
          <RiArrowLeftLine className="h-4 w-4" />
          Volver
        </Link>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={() => void load()}
          disabled={loading}
        >
          <RiRefreshLine className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{label}</h1>
          <ExpensesHelpTrigger className="shrink-0" />
          <SectionHelpTrigger
            dialogTitle="Qué muestra esta pantalla"
            tooltip={`Todo lo registrado en ${label} (${periodId}). Clic para ampliar.`}
          >
            <p className="text-sm leading-relaxed text-zinc-700">
              Acá ves <strong>todos los gastos y pagos</strong> del período <strong>{label}</strong> ({periodId}), igual que
              en el resumen del mes vigente pero para un mes que elegiste del historial.
            </p>
          </SectionHelpTrigger>
        </div>
      </header>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {loading && !balance ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(balance?.byCurrency ?? []).map((c) => (
              <div key={c.currency} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase text-zinc-500">{c.currency}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Gastos: <span className="font-semibold text-zinc-900">{c.totalExpenses.toFixed(2)}</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                  {c.members.map((m) => {
                    const prof = memberById[m.memberId];
                    const label = prof?.name ?? memberShortLabel(m.memberId, names);
                    const at = prof?.username ? ` @${prof.username}` : "";
                    return (
                      <li key={m.memberId}>
                        {label}
                        {at} — neto {m.net >= 0 ? "+" : ""}
                        {m.net.toFixed(2)}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 text-xs font-medium text-zinc-800">
                  {c.narrativeLines.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">Gastos del mes</h2>
              <SectionHelpTrigger
                dialogTitle="Gastos de este período"
                tooltip={`Listado completo de gastos (${expensesInPeriod.length}). Clic para detalle.`}
              >
                <p className="text-sm leading-relaxed text-zinc-700">
                  Tabla con <strong>todos los movimientos tipo gasto</strong> de este período (activos y anulados figuran con
                  su estado). Ahora hay {expensesInPeriod.length}{" "}
                  {expensesInPeriod.length === 1 ? "registro" : "registros"}.
                </p>
              </SectionHelpTrigger>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className={th}>Fecha</th>
                    <th className={th}>Tipo</th>
                    <th className={th}>Concepto</th>
                    <th className={th}>Pagó · reparto</th>
                    <th className={th}>Monto</th>
                    <th className={th}>Estado</th>
                    <th className={`${th} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesInPeriod.map((m) => (
                      <tr key={m.id} className="divide-y divide-zinc-100 bg-white hover:bg-zinc-50/80">
                        <td className={cell}>{fmtDate(m.date)}</td>
                        <td className={cell}>
                          <MovementTypeBadge row={m} />
                        </td>
                        <td className={`${cell} font-medium text-zinc-900`}>{m.title}</td>
                        <td className={cellPeople}>
                          <ExpensePayerSplitCell movement={m} byId={memberById} nameFallback={names} />
                        </td>
                        <td className={`${cell} font-mono`}>
                          {m.amount.toFixed(2)} {m.currency}
                        </td>
                        <td className={cell}>
                          <MovementStatusBadge status={m.status} />
                        </td>
                        <td className={`${cell} text-right`}>
                          {(() => {
                            const canDeleteOwnExpense = Boolean(actorUid) && m.createdBy === actorUid;
                            const items: { label: string; onClick: () => void; danger?: boolean }[] = [];
                            if (m.status === "active") {
                              items.push({ label: "Editar", onClick: () => setEditMovement(m) });
                              items.push({
                                label: "Anular",
                                danger: true,
                                onClick: () => setCancelTarget({ id: m.id, label: m.title }),
                              });
                            }
                            if (canDeleteOwnExpense) {
                              items.push({
                                label: "Eliminar",
                                danger: true,
                                onClick: () => setDeleteTarget({ id: m.id, label: m.title }),
                              });
                            }
                            return items.length > 0 ? <RowActionsMenu items={items} /> : "—";
                          })()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-zinc-900">Pagos registrados</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-zinc-200">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className={th}>Fecha</th>
                    <th className={th}>Concepto</th>
                    <th className={th}>Flujo</th>
                    <th className={th}>Monto</th>
                    <th className={th}>Estado</th>
                    <th className={`${th} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((m) => (
                    <tr key={m.id} className="divide-y divide-zinc-100 bg-white hover:bg-zinc-50/80">
                      <td className={cell}>{fmtDate(m.date)}</td>
                      <td className={`${cell} font-medium text-zinc-900`}>{m.title}</td>
                      <td className={cellPeople}>
                        <SettlementFlowCell movement={m} byId={memberById} nameFallback={names} />
                      </td>
                      <td className={`${cell} font-mono`}>
                        {m.amount.toFixed(2)} {m.currency}
                      </td>
                      <td className={cell}>
                        <MovementStatusBadge status={m.status} />
                      </td>
                      <td className={`${cell} text-right`}>
                        {(() => {
                          const canDeleteOwnSettlement = Boolean(actorUid) && m.createdBy === actorUid;
                          const items: { label: string; onClick: () => void; danger?: boolean }[] = [];
                          if (m.status === "active") {
                            items.push({
                              label: "Anular",
                              danger: true,
                              onClick: () => setCancelTarget({ id: m.id, label: m.title }),
                            });
                          }
                          if (canDeleteOwnSettlement) {
                            items.push({
                              label: "Eliminar",
                              danger: true,
                              onClick: () => setDeleteTarget({ id: m.id, label: m.title }),
                            });
                          }
                          return items.length > 0 ? <RowActionsMenu items={items} /> : "—";
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {settlements.length === 0 ? <p className="p-4 text-sm text-zinc-500">No hay pagos en este mes.</p> : null}
            </div>
          </section>
        </>
      )}

      <EditExpenseModal
        open={Boolean(editMovement)}
        onClose={() => setEditMovement(null)}
        movement={editMovement}
        periodId={periodId}
        members={members}
        onSaved={() => void load()}
      />
      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title="Anular movimiento"
        description={
          cancelTarget
            ? `Se marcará como anulado “${cancelTarget.label}” y dejará de afectar saldos.`
            : undefined
        }
        confirmLabel="Anular"
        cancelLabel="Volver"
        danger
        loading={cancelBusy}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar movimiento"
        description={
          deleteTarget
            ? `Se borrará definitivamente “${deleteTarget.label}”. Solo vos podés hacerlo porque lo registraste. Esta acción no se puede deshacer.`
            : undefined
        }
        confirmLabel="Eliminar"
        cancelLabel="Volver"
        danger
        loading={deleteBusy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteMovement()}
      />
    </div>
  );
}
