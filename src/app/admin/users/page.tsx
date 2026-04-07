import { AdminUsersBoard } from "@/components/admin/admin-users-board";
import { listMergedTeamUsers } from "@/lib/admin/team-users";
import { getServerSession } from "@/lib/auth/session";

export default async function AdminUsersPage() {
  const session = await getServerSession();
  const myUid = session?.uid ?? "";

  const users = await listMergedTeamUsers();

  return (
    <section className="mx-auto max-w-7xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Team las girls</h1>


      <div className="mt-8">
        {users.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
            No hay usuarios en Firebase Auth para este proyecto.
          </article>
        ) : (
          <AdminUsersBoard users={users} myUid={myUid} />
        )}
      </div>
    </section>
  );
}
