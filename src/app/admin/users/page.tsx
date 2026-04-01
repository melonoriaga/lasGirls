import { adminDb } from "@/lib/firebase/admin";

type UserRow = {
  id: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  contactPhone?: string;
  workingHours?: string;
  usefulLinks?: string;
  internalNotes?: string;
};

export default async function AdminUsersPage() {
  const snapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  const users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as UserRow[];

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Usuarios</h1>
      <div className="mt-6 grid gap-3">
        {users.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
            No hay usuarios cargados todavía. Podés invitar nuevos perfiles desde &quot;Invitaciones&quot;.
          </article>
        ) : (
          users.map((user) => (
            <article key={user.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100">
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.photoURL} alt={user.fullName || "Usuario"} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-xs font-semibold uppercase text-zinc-600">
                      {(user.fullName || user.email || "U").slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-900">{user.fullName || "Sin nombre"}</p>
                  <p className="truncate text-sm text-zinc-600">{user.email || "Sin email"}</p>
                  {user.username && <p className="text-xs text-zinc-500">@{user.username}</p>}
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{user.role || "admin"}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-zinc-700">
                <p>
                  <strong>Tel:</strong> {user.contactPhone || "—"}
                </p>
                <p>
                  <strong>Horario:</strong> {user.workingHours || "—"}
                </p>
                <p>
                  <strong>Links:</strong> {user.usefulLinks || "—"}
                </p>
                <p>
                  <strong>Notas:</strong> {user.internalNotes || "—"}
                </p>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
