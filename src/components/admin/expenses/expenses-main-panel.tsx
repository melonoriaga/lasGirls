"use client";

import Link from "next/link";
import { RiAddLine, RiArrowRightSLine, RiRefreshLine } from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { MovementStatusBadge, MovementTypeBadge, PeriodStatusBadge } from "@/components/admin/expenses/expense-badges";
import {
  CreateExpenseModal,
  EditExpenseModal,
  RecurrenceOnlyModal,
  SettlementModal,
} from "@/components/admin/expenses/expenses-modals";
import type { ExpenseMember, ExpenseMovement, ExpenseRecurrence, PeriodBalanceSummary } from "@/types/expenses";
import type { PeriodHistoryRow } from "@/lib/expenses/history-summary";
import { formatMemberPaidAcrossCurrencies, memberShortLabel } from "@/lib/expenses/history-summary";
import { memberNameMap } from "@/lib/expenses/member-display";
import { ExpensePayerSplitCell, SettlementFlowCell } from "@/components/admin/expenses/expense-movement-people";
import { ExpensesHelpTrigger } from "@/components/admin/expenses/expenses-help-modal";
import { SectionHelpTrigger } from "@/components/admin/section-help-trigger";

const cell = "whitespace-nowrap px-3 py-2.5 text-xs text-zinc-700";
const cellPeople = "min-w-[220px] max-w-[280px] px-3 py-2.5 align-top text-xs text-zinc-700";
const th = "px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-zinc-500";

type CurrentResponse = {
  ok?: boolean;
  periodId?: string;
  period?: { label?: string };
  members?: ExpenseMember[];
  movements?: Array<ExpenseMovement & { id: string }>;
  balance?: PeriodBalanceSummary;
  error?: string;
};

type PeriodsResponse = {
  ok?: boolean;
  items?: PeriodHistoryRow[];
  nextCursor?: string | null;
  hasMore?: boolean;
  error?: string;
};

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function totalsLine(row: PeriodHistoryRow) {
  const parts = Object.keys(row.totalExpensesByCurrency)
    .sort()
    .map((c) => `${c} ${row.totalExpensesByCurrency[c]!.toFixed(2)}`);
  return parts.length ? parts.join(" · ") : "—";
}

function historyActivitySummary(row: PeriodHistoryRow): string {
  const e = row.activeExpenseCount;
  const s = row.activeSettlementCount;
  const parts: string[] = [];
  if (e) parts.push(`${e} gasto${e === 1 ? "" : "s"}`);
  if (s) parts.push(`${s} pago${s === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "—";
}

function HistoryAportesCell({ row, members }: { row: PeriodHistoryRow; members: ExpenseMember[] }) {
  type Line = { key: string; label: string; amounts: string };
  const lines: Line[] = [];
  for (const m of [...members].sort((a, b) => a.name.localeCompare(b.name, "es"))) {
    const amounts = formatMemberPaidAcrossCurrencies(row.memberPaidByCurrency, m.id);
    if (amounts !== "—") lines.push({ key: m.id, label: m.name, amounts });
  }
  const known = new Set(members.map((m) => m.id));
  for (const id of Object.keys(row.memberPaidByCurrency).sort()) {
    if (known.has(id)) continue;
    const amounts = formatMemberPaidAcrossCurrencies(row.memberPaidByCurrency, id);
    if (amounts !== "—") lines.push({ key: id, label: id, amounts });
  }
  if (!lines.length) return <span className="text-zinc-400">—</span>;
  return (
    <ul className="m-0 max-w-[280px] list-none space-y-1 p-0 text-[11px] leading-snug text-zinc-700">
      {lines.map((l) => (
        <li key={l.key}>
          <span className="font-medium text-zinc-800">{l.label}:</span> {l.amounts}
        </li>
      ))}
    </ul>
  );
}

export function ExpensesMainPanel({ actorUid }: { actorUid: string }) {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [periodLabel, setPeriodLabel] = useState("");
  const [members, setMembers] = useState<ExpenseMember[]>([]);
  const [movements, setMovements] = useState<Array<ExpenseMovement & { id: string }>>([]);
  const [balance, setBalance] = useState<PeriodBalanceSummary | null>(null);

  const [histItems, setHistItems] = useState<PeriodHistoryRow[]>([]);
  const [histCursor, setHistCursor] = useState<string | null>(null);
  const [histLoading, setHistLoading] = useState(false);
  const [histHasMore, setHistHasMore] = useState(false);

  const [recurrences, setRecurrences] = useState<ExpenseRecurrence[]>([]);

  const [openExpense, setOpenExpense] = useState(false);
  const [openSettlement, setOpenSettlement] = useState(false);
  const [openRecurrence, setOpenRecurrence] = useState(false);
  const [editMovement, setEditMovement] = useState<(ExpenseMovement & { id: string }) | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadRecurrences = useCallback(async () => {
    const res = await fetch("/api/admin/expenses/recurrences", { cache: "no-store", credentials: "include" });
    const json = (await res.json()) as { ok?: boolean; items?: ExpenseRecurrence[] };
    if (json.ok && json.items) setRecurrences(json.items);
  }, []);

  const loadCurrent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/expenses/current", { cache: "no-store", credentials: "include" });
      const json = (await res.json()) as CurrentResponse;
      if (!json.ok) throw new Error(json.error ?? "No se pudo cargar el mes actual.");
      setPeriodId(json.periodId ?? "");
      setPeriodLabel(json.period?.label ?? json.periodId ?? "");
      setMembers(json.members ?? []);
      setMovements(json.movements ?? []);
      setBalance(json.balance ?? null);
      void loadRecurrences();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loadRecurrences]);

  const loadHistoryFirst = useCallback(
    async (before: string) => {
      setHistLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "8");
        params.set("before", before);
        const res = await fetch(`/api/admin/expenses/periods?${params}`, { cache: "no-store", credentials: "include" });
        const json = (await res.json()) as PeriodsResponse;
        if (!json.ok) throw new Error(json.error ?? "Historial inválido.");
        setHistItems(json.items ?? []);
        setHistCursor(json.nextCursor ?? null);
        setHistHasMore(Boolean(json.hasMore));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setHistLoading(false);
      }
    },
    [toast],
  );

  const loadHistoryMore = useCallback(async () => {
    if (!histCursor || !periodId) return;
    setHistLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "8");
      params.set("before", periodId);
      params.set("cursor", histCursor);
      const res = await fetch(`/api/admin/expenses/periods?${params}`, { cache: "no-store", credentials: "include" });
      const json = (await res.json()) as PeriodsResponse;
      if (!json.ok) throw new Error(json.error ?? "Historial inválido.");
      setHistItems((prev) => [...prev, ...(json.items ?? [])]);
      setHistCursor(json.nextCursor ?? null);
      setHistHasMore(Boolean(json.hasMore));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setHistLoading(false);
    }
  }, [histCursor, periodId, toast]);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  useEffect(() => {
    if (periodId) void loadHistoryFirst(periodId);
  }, [periodId, loadHistoryFirst]);

  const names = memberNameMap(members);
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])) as Record<string, ExpenseMember>, [members]);

  const confirmCancel = async () => {
    if (!cancelTarget || !periodId) return;
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
      await loadCurrent();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelBusy(false);
    }
  };

  const confirmDeleteMovement = async () => {
    if (!deleteTarget || !periodId) return;
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
      toast.success("Movimiento eliminado.");
      setDeleteTarget(null);
      void loadCurrent();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const deactivateRecurrence = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/expenses/recurrences/${id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "No se pudo desactivar.");
      toast.success("Recurrencia cortada a futuro.");
      await loadCurrent();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Gastos compartidos</h1>
          <ExpensesHelpTrigger className="shrink-0" />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
          onClick={() => void loadCurrent()}
          disabled={loading}
        >
          <RiRefreshLine className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}

      {!loading && members.length < 2 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          Para repartir gastos hace falta al menos <strong>dos cuentas</strong> con login en el proyecto (Firebase Auth).
          Los nombres que ves en los selectores son el equipo real invitado al admin — no hay participantes ficticios como
          «Shin».
        </p>
      ) : null}

      {loading && !periodId ? (
        <p className="text-sm text-zinc-500">Cargando…</p>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/80 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Mes vigente</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900">
                  {periodLabel || periodId}
                  <span className="text-base font-normal text-zinc-500"> ({periodId})</span>
                </p>
                {balance?.byCurrency.length === 0 ? (
                  <p className="mt-1 text-xs text-zinc-500">Sin movimientos activos aún este mes.</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                  onClick={() => setOpenExpense(true)}
                >
                  <RiAddLine className="h-4 w-4" />
                  Nuevo gasto
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  onClick={() => setOpenSettlement(true)}
                >
                  <RiAddLine className="h-4 w-4" />
                  Nuevo pago
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 hover:bg-amber-100"
                  onClick={() => setOpenRecurrence(true)}
                >
                  <RiAddLine className="h-4 w-4" />
                  Nueva recurrencia
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(balance?.byCurrency ?? []).map((c) => (
                <div key={c.currency} className="rounded-xl border border-zinc-200 bg-white/90 p-4">
                  <p className="text-[11px] font-semibold uppercase text-zinc-500">{c.currency}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Total gastos: <span className="font-semibold text-zinc-900">{c.totalExpenses.toFixed(2)}</span>
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-600">
                    {c.members.map((m) => {
                      const prof = memberById[m.memberId];
                      const label =
                        prof?.name ?? memberShortLabel(m.memberId, names);
                      const at = prof?.username ? ` @${prof.username}` : "";
                      return (
                        <li key={m.memberId}>
                          {label}
                          {at} — pagó {m.paid.toFixed(2)}, le tocaba {m.owedShare.toFixed(2)}, neto {m.net >= 0 ? "+" : ""}
                          {m.net.toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-3 border-t border-zinc-100 pt-2 text-xs font-medium text-zinc-800">
                    {c.narrativeLines.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                  {c.isSaldado ? (
                    <p className="mt-2 text-[11px] font-semibold text-emerald-700">Saldado en esta moneda</p>
                  ) : (
                    <p className="mt-2 text-[11px] font-semibold text-amber-800">Pendiente de saldar</p>
                  )}
                </div>
              ))}
              {(balance?.byCurrency ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no hay movimientos activos este mes.</p>
              ) : null}
            </div>
          </section>

          {recurrences.filter((r) => r.active).length > 0 ? (
            <section className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
              <h2 className="text-sm font-semibold text-amber-950">Recurrencias activas</h2>
              <ul className="mt-2 divide-y divide-amber-100">
                {recurrences
                  .filter((r) => r.active)
                  .map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-xs text-amber-950">
                      <span>
                        <span className="font-medium">{r.title}</span> · {r.currency} {r.amount.toFixed(2)} · desde{" "}
                        {r.startMonth}
                        {r.endMonth ? ` hasta ${r.endMonth}` : ""}
                      </span>
                      <button
                        type="button"
                        className="rounded-md border border-amber-300 bg-white px-2 py-1 text-[11px] font-medium hover:bg-amber-50"
                        onClick={() => {
                          if (typeof window !== "undefined" && window.confirm("¿Cortar esta recurrencia? No se borran meses pasados.")) {
                            void deactivateRecurrence(r.id);
                          }
                        }}
                      >
                        Cortar a futuro
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-900">
                Movimientos en {periodLabel || periodId}
              </h2>
              <SectionHelpTrigger
                dialogTitle="Movimientos del período vigente"
                tooltip="Sólo este mes. Clic para más detalle sobre gastos puntuales y recurrencias."
              >
                <p className="text-sm leading-relaxed text-zinc-700">
                  Son sólo los registros de <strong>este período</strong>. Un gasto puntual no se copia al mes siguiente;
                  lo que se repite cada mes es una <strong>recurrencia</strong> (apartado <em>Recurrencias activas</em> más
                  arriba).
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
                    <th className={th}>Recurrencia</th>
                    <th className={`${th} text-right`}>Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {movements.map((m) => (
                    <tr key={m.id} className="bg-white hover:bg-zinc-50/80">
                      <td className={cell}>{fmtDate(m.date)}</td>
                      <td className={cell}>
                        <MovementTypeBadge row={m} />
                      </td>
                      <td className={`${cell} max-w-[200px] truncate font-medium text-zinc-900`}>{m.title}</td>
                      <td className={cellPeople}>
                        {m.type === "expense" ? (
                          <ExpensePayerSplitCell movement={m} byId={memberById} nameFallback={names} />
                        ) : (
                          <SettlementFlowCell movement={m} byId={memberById} nameFallback={names} />
                        )}
                      </td>
                      <td className={`${cell} font-mono`}>
                        {m.amount.toFixed(2)} {m.currency}
                      </td>
                      <td className={cell}>
                        <MovementStatusBadge status={m.status} />
                      </td>
                      <td className={cell}>{m.recurrenceId ? <span className="font-mono text-[10px] text-zinc-500">Sí</span> : "—"}</td>
                      <td className={`${cell} text-right`}>
                        {(() => {
                          const canDeleteOwnMovement = Boolean(actorUid) && m.createdBy === actorUid;
                          const items: { label: string; onClick: () => void; danger?: boolean }[] = [];
                          if (m.status === "active") {
                            if (m.type === "expense") {
                              items.push({ label: "Editar", onClick: () => setEditMovement(m) });
                            }
                            items.push({
                              label: "Anular",
                              onClick: () => setCancelTarget({ id: m.id, label: m.title }),
                              danger: true,
                            });
                          }
                          if (canDeleteOwnMovement) {
                            items.push({
                              label: "Eliminar",
                              onClick: () => setDeleteTarget({ id: m.id, label: m.title }),
                              danger: true,
                            });
                          }
                          return items.length > 0 ? <RowActionsMenu items={items} /> : "—";
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 ? <p className="p-6 text-center text-sm text-zinc-500">No hay movimientos registrados.</p> : null}
            </div>
          </section>
        </>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-900">Meses anteriores</h2>
          <SectionHelpTrigger
            dialogTitle="Meses anteriores"
            tooltip="Resumen por mes cerrado. Clic para ver cómo se relaciona con la tabla de arriba y el detalle."
          >
            <p className="text-sm leading-relaxed text-zinc-700">
              Es el mismo tipo de resumen que la tabla del mes vigente, pero <strong>por cada mes ya cerrado</strong>:
              movimientos activos, totales y quién aportó. La columna <strong>Ver</strong> abre el detalle con{" "}
              <strong>todos</strong> los gastos y pagos registrados en ese mes.
            </p>
          </SectionHelpTrigger>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className={th}>Mes</th>
                <th className={th}>Movimientos</th>
                <th className={th}>Total gastado</th>
                <th className={th}>Monedas</th>
                <th className={th}>Aportes (quién pagó)</th>
                <th className={th}>Balance</th>
                <th className={th}>Estado</th>
                <th className={`${th} text-right`}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {histItems.map((row) => (
                <tr key={row.periodId} className="bg-white hover:bg-zinc-50/80">
                  <td className={`${cell} font-medium text-zinc-900`}>{row.label}</td>
                  <td className={cell}>{historyActivitySummary(row)}</td>
                  <td className={cell}>{totalsLine(row)}</td>
                  <td className={cell}>{row.currencies.length ? row.currencies.join(", ") : "—"}</td>
                  <td className={`${cellPeople} align-top`}>
                    <HistoryAportesCell row={row} members={members} />
                  </td>
                  <td className={`${cell} max-w-[240px] text-[11px] leading-snug text-zinc-600`}>{row.balanceText}</td>
                  <td className={cell}>
                    <PeriodStatusBadge status={row.balanceSummary.overallStatus} />
                  </td>
                  <td className={`${cell} text-right`}>
                    <Link
                      href={`/admin/expenses/${row.periodId}`}
                      className="inline-flex items-center gap-0.5 text-xs font-medium text-rose-700 hover:text-rose-900"
                    >
                      Ver <RiArrowRightSLine className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {histItems.length === 0 && !histLoading ? (
            <p className="p-6 text-center text-sm text-zinc-500">No hay meses anteriores registrados.</p>
          ) : null}
        </div>
        {histHasMore ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              disabled={histLoading}
              onClick={() => void loadHistoryMore()}
            >
              {histLoading ? "Cargando…" : "Cargar más"}
            </button>
          </div>
        ) : null}
      </section>

      <CreateExpenseModal
        open={openExpense}
        onClose={() => setOpenExpense(false)}
        periodId={periodId}
        members={members}
        onSaved={async () => {
          await loadCurrent();
          toast.success("Gasto registrado.");
        }}
      />
      <SettlementModal
        open={openSettlement}
        onClose={() => setOpenSettlement(false)}
        periodId={periodId}
        members={members}
        onSaved={async () => {
          await loadCurrent();
          toast.success("Pago registrado.");
        }}
      />
      <RecurrenceOnlyModal
        open={openRecurrence}
        onClose={() => setOpenRecurrence(false)}
        members={members}
        onSaved={async () => {
          await loadCurrent();
          toast.success("Recurrencia creada.");
        }}
      />
      <EditExpenseModal
        open={Boolean(editMovement)}
        onClose={() => setEditMovement(null)}
        movement={editMovement}
        periodId={periodId}
        members={members}
        onSaved={async () => {
          await loadCurrent();
          toast.success("Gasto actualizado.");
        }}
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
