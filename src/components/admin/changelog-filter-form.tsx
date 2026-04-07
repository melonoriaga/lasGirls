import Link from "next/link";
import { RiFilter3Line, RiCloseLine } from "@remixicon/react";
import { ADMIN_ACTION_CONFIG, adminActionLabel } from "@/lib/admin/admin-actions";
import type { ChangelogFiltersInput } from "@/lib/admin/changelog-filters";

export type ChangelogUserOption = { id: string; fullName: string; email: string };

type Props = {
  users: ChangelogUserOption[];
  current: ChangelogFiltersInput;
};

const inputClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200";

export function ChangelogFilterForm({ users, current }: Props) {
  const actionKeys = Object.keys(ADMIN_ACTION_CONFIG).sort((a, b) =>
    adminActionLabel(a).localeCompare(adminActionLabel(b), "es"),
  );
  const hasFilters = Boolean(current.action?.trim() || current.actorUid?.trim() || current.from?.trim() || current.to?.trim());
  const clearHref = "/admin/changelog";

  return (
    <form
      method="get"
      action="/admin/changelog"
      className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="page" value="1" />
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Acción
          <select name="action" defaultValue={current.action ?? ""} className={`${inputClass} min-w-[200px]`}>
            <option value="">Todas</option>
            {actionKeys.map((key) => (
              <option key={key} value={key}>
                {adminActionLabel(key)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Usuario
          <select name="actor" defaultValue={current.actorUid ?? ""} className={`${inputClass} min-w-[220px]`}>
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName || u.email || u.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Desde
          <input type="date" name="from" defaultValue={current.from ?? ""} className={inputClass} />
        </label>
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Hasta
          <input type="date" name="to" defaultValue={current.to ?? ""} className={inputClass} />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-rose-400"
        >
          <RiFilter3Line className="size-4 shrink-0" aria-hidden />
          Aplicar filtros
        </button>
        {hasFilters ? (
          <Link
            href={clearHref}
            className="inline-flex items-center gap-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            <RiCloseLine className="size-4 shrink-0" aria-hidden />
            Limpiar
          </Link>
        ) : null}
      </div>

    </form>
  );
}
