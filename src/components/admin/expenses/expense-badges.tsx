import clsx from "clsx";

const base = "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

export function MovementTypeBadge({ row }: { row: { type: string; generatedByRecurrence?: boolean } }) {
  if (row.type === "settlement") {
    return <span className={clsx(base, "bg-indigo-100 text-indigo-800")}>Pago</span>;
  }
  if (row.generatedByRecurrence) {
    return <span className={clsx(base, "bg-amber-100 text-amber-900")}>Gasto recurrente</span>;
  }
  return <span className={clsx(base, "bg-zinc-100 text-zinc-700")}>Gasto puntual</span>;
}

export function MovementStatusBadge({ status }: { status: string }) {
  if (status === "canceled") {
    return <span className={clsx(base, "bg-rose-100 text-rose-800")}>Anulado</span>;
  }
  return <span className={clsx(base, "bg-emerald-100 text-emerald-800")}>Activo</span>;
}

export function PeriodStatusBadge({ status }: { status: "saldado" | "pendiente" | "mixto" }) {
  if (status === "saldado") return <span className={clsx(base, "bg-emerald-100 text-emerald-800")}>Saldado</span>;
  if (status === "pendiente") return <span className={clsx(base, "bg-amber-100 text-amber-900")}>Pendiente</span>;
  return <span className={clsx(base, "bg-violet-100 text-violet-900")}>Mixto</span>;
}
