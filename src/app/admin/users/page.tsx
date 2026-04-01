import { adminDb } from "@/lib/firebase/admin";

export default async function AdminUsersPage() {
  const snapshot = await adminDb.collection("users").orderBy("createdAt", "desc").get();
  const users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<
    Record<string, string>
  >;

  return (
    <section>
      <h1 className="font-display text-5xl uppercase">Usuarios</h1>
      <div className="mt-6 grid gap-3">
        {users.map((user) => (
          <article key={user.id} className="border border-black bg-white p-4">
            <p className="font-semibold">{user.fullName}</p>
            <p className="text-sm text-zinc-600">{user.email}</p>
            <p className="text-xs uppercase tracking-wider">{user.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
