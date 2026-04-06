import Link from "next/link";
import { RiUserSettingsLine } from "@remixicon/react";
import { adminDb } from "@/lib/firebase/admin";
import { getServerSession } from "@/lib/auth/session";

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
  const session = await getServerSession();
  const myUid = session?.uid ?? "";

  const snapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  const users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as UserRow[];

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Equipo del admin</h1>


      <div className="mt-8 grid gap-3">
        {users.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
            No hay usuarios cargados todavía. Podés invitar nuevos perfiles desde Invitaciones.
          </article>
        ) : (
          users.map((user) => {
            const isSelf = Boolean(myUid && user.id === myUid);
            return (
              <article
                key={user.id}
                className={`rounded-2xl border bg-white p-4 ${isSelf ? "border-rose-200 ring-1 ring-rose-100" : "border-zinc-200"
                  }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-zinc-300 bg-zinc-100">
                    {user.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.photoURL} alt={user.fullName || "Usuario"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xs font-semibold uppercase text-zinc-600">
                        {(user.fullName || user.email || "U").slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900">{user.fullName || "Sin nombre"}</p>
                      {isSelf ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900">
                          Vos
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-zinc-600">{user.email || "Sin email"}</p>
                    {user.username ? <p className="text-xs text-zinc-500">@{user.username}</p> : null}
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                      Rol: {user.role || "admin"}
                    </p>
                    {isSelf ? (
                      <Link
                        href="/admin/profile"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#db2777] hover:underline"
                      >
                        <RiUserSettingsLine className="size-3.5" aria-hidden />
                        Editar mi perfil
                      </Link>
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 grid gap-1 border-t border-zinc-100 pt-3 text-xs text-zinc-700">
                  <p>
                    <strong className="text-zinc-500">Tel:</strong> {user.contactPhone || "—"}
                  </p>
                  <p>
                    <strong className="text-zinc-500">Horario:</strong> {user.workingHours || "—"}
                  </p>
                  <p>
                    <strong className="text-zinc-500">Links:</strong> {user.usefulLinks || "—"}
                  </p>
                  <p>
                    <strong className="text-zinc-500">Notas internas (visibles para el equipo):</strong>{" "}
                    {user.internalNotes || "—"}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
