import Image from "next/image";
import { ChangelogFilterForm } from "@/components/admin/changelog-filter-form";
import { AdminActionBadge } from "@/components/admin/admin-action-badge";
import { ChangelogPagination } from "@/components/admin/changelog-pagination";
import type { ChangelogFiltersInput } from "@/lib/admin/changelog-filters";
import { buildActivityLogsQuery } from "@/lib/admin/changelog-query";
import { adminDb } from "@/lib/firebase/admin";

type LogRow = {
  id: string;
  actorUid?: string;
  actorName?: string;
  actorEmail?: string;
  action?: string;
  location?: string;
  createdAt?: string;
};

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const DEFAULT_PAGE_SIZE = 10;

function singleParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s : undefined;
}

export default async function AdminChangelogPage({ searchParams }: Props) {
  const raw = (await searchParams) ?? {};
  const page = Math.max(1, Number(singleParam(raw.page) ?? "1") || 1);
  const pageSize = Math.min(Math.max(Number(singleParam(raw.pageSize) ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE, 1), 50);
  const filters: ChangelogFiltersInput = {
    action: singleParam(raw.action),
    actorUid: singleParam(raw.actor),
    from: singleParam(raw.from),
    to: singleParam(raw.to),
  };

  const usersSnap = await adminDb.collection("users").limit(200).get();
  const usersForForm = usersSnap.docs
    .map((doc) => {
      const d = doc.data() as { fullName?: string; email?: string };
      return {
        id: doc.id,
        fullName: String(d.fullName ?? "").trim(),
        email: String(d.email ?? "").trim(),
      };
    })
    .sort((a, b) => {
      const na = (a.fullName || a.email).toLowerCase();
      const nb = (b.fullName || b.email).toLowerCase();
      return na.localeCompare(nb, "es");
    });

  let logs: LogRow[] = [];
  let total = 0;
  let totalPages = 1;
  let queryError: string | null = null;

  try {
    const baseQuery = buildActivityLogsQuery(filters);
    const countSnap = await baseQuery.count().get();
    total = countSnap.data().count;
    totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    const snapshot = await baseQuery.offset(offset).limit(pageSize).get();
    logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LogRow[];
  } catch (error) {
    queryError = error instanceof Error ? error.message : "Error al consultar el changelog.";
    logs = [];
    total = 0;
    totalPages = 1;
  }

  const displayPage = Math.min(page, totalPages);

  const actorUids = Array.from(
    new Set(
      logs.map((row) => row.actorUid).filter((uid): uid is string => Boolean(uid)),
    ),
  );
  const userSnapshots = await Promise.all(actorUids.map((uid) => adminDb.collection("users").doc(uid).get()));
  const photoByUid = new Map<string, string>();
  for (const userDoc of userSnapshots) {
    if (!userDoc.exists) continue;
    const user = userDoc.data() as { photoURL?: string };
    if (user.photoURL) photoByUid.set(userDoc.id, user.photoURL);
  }

  return (
    <section className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Changelog</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Registro de actividad del panel por usuario, fecha, ubicación y acción. Podés filtrar por tipo de acción,
        persona y fechas.
      </p>

      <ChangelogFilterForm users={usersForForm} current={filters} />

      {queryError ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">No se pudo aplicar el filtro</p>
          <p className="mt-1 text-xs text-amber-900/90">{queryError}</p>
          <p className="mt-2 text-xs text-amber-900/80">
            Si el error menciona un índice, desplegá los índices:{" "}
            <code className="rounded bg-white/80 px-1">firebase deploy --only firestore:indexes</code>
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3 font-medium text-zinc-600">Usuario</th>
              <th className="p-3 font-medium text-zinc-600">Fecha</th>
              <th className="p-3 font-medium text-zinc-600">Ubicación</th>
              <th className="p-3 font-medium text-zinc-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {!queryError && logs.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={4}>
                  No hay movimientos con estos filtros.
                </td>
              </tr>
            ) : queryError ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={4}>
                  Corregí los filtros o los índices para ver resultados.
                </td>
              </tr>
            ) : (
              logs.map((row) => (
                <tr key={row.id} className="border-b border-zinc-100 last:border-b-0">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="relative h-8 w-8 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                        {row.actorUid && photoByUid.get(row.actorUid) ? (
                          <Image
                            src={photoByUid.get(row.actorUid)!}
                            alt={row.actorName || "Usuario"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-[10px] font-semibold uppercase text-zinc-500">
                            {(row.actorName || row.actorEmail || "U").slice(0, 1)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-900">{row.actorName || "Sin nombre"}</p>
                        <p className="truncate text-xs text-zinc-600">{row.actorEmail || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{formatDate(row.createdAt)}</td>
                  <td className="p-3">{row.location || "Unknown"}</td>
                  <td className="p-3">
                    <AdminActionBadge action={row.action} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Página {displayPage} de {totalPages} · {total} movimiento{total === 1 ? "" : "s"}
        </p>
        <ChangelogPagination page={displayPage} totalPages={totalPages} filters={filters} pageSize={pageSize} />
      </div>
    </section>
  );
}
