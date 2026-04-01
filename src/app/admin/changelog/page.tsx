import Image from "next/image";
import Link from "next/link";
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
  searchParams?: Promise<{ page?: string }>;
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

const PAGE_SIZE = 10;

const ACTION_TONES = [
  "border-[#f9a8d4] bg-[#fdf2f8] text-[#9d174d]",
  "border-[#f472b6] bg-[#fce7f3] text-[#be185d]",
  "border-[#ec4899] bg-[#fdf2f8] text-[#831843]",
  "border-[#fbcfe8] bg-[#fff1f7] text-[#a21caf]",
  "border-[#f5a9d0] bg-[#fff5fb] text-[#9d174d]",
  "border-[#fda4cf] bg-[#fff0f6] text-[#be123c]",
  "border-[#f9a8d4] bg-[#fff3f8] text-[#86198f]",
  "border-[#f472b6] bg-[#fff4fa] text-[#9f1239]",
  "border-[#ec4899] bg-[#fff2f7] text-[#7e22ce]",
  "border-[#fbcfe8] bg-[#fff7fb] text-[#a21caf]",
];

export default async function AdminChangelogPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const totalSnapshot = await adminDb.collection("activityLogs").count().get();
  const total = totalSnapshot.data().count;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const snapshot = await adminDb
    .collection("activityLogs")
    .orderBy("createdAt", "desc")
    .offset(offset)
    .limit(PAGE_SIZE)
    .get();
  const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as LogRow[];
  const uniqueActions = Array.from(new Set(logs.map((row) => row.action || "sin acción")));
  const actionToneByName = new Map(
    uniqueActions.map((action, index) => [action, ACTION_TONES[index % ACTION_TONES.length]]),
  );

  const actorUids = Array.from(
    new Set(
      logs
        .map((row) => row.actorUid)
        .filter((uid): uid is string => Boolean(uid)),
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
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Changelog</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Registro de actividad del panel por usuario, fecha, ubicación y acción.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="p-3 font-medium text-zinc-600">Usuario</th>
              <th className="p-3 font-medium text-zinc-600">Fecha</th>
              <th className="p-3 font-medium text-zinc-600">Ubicación</th>
              <th className="p-3 font-medium text-zinc-600">Acción</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-zinc-600" colSpan={4}>
                  Todavía no hay actividad registrada.
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
                    <span
                      className={`inline-block rounded-full border px-2 py-1 text-xs uppercase tracking-[0.08em] ${
                        actionToneByName.get(row.action || "sin acción") || ACTION_TONES[0]
                      }`}
                    >
                      {row.action || "sin acción"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          Página {page} de {totalPages} · {total} movimientos
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/changelog?page=${Math.max(1, page - 1)}`}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              page <= 1
                ? "pointer-events-none border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Anterior
          </Link>
          <Link
            href={`/admin/changelog?page=${Math.min(totalPages, page + 1)}`}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              page >= totalPages
                ? "pointer-events-none border-zinc-200 bg-zinc-100 text-zinc-400"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Siguiente
          </Link>
        </div>
      </div>
    </section>
  );
}
