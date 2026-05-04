import { TasksBoard } from "@/components/admin/tasks-board";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { listMergedTeamUsers } from "@/lib/admin/team-users";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

export default async function AdminTasksPage() {
  const actor = await getSessionActor();
  const actorUid = actor?.uid ?? "";

  const [tasksSnap, clientsSnap, users] = await Promise.all([
    adminDb.collection("tasks").orderBy("createdAt", "desc").limit(300).get(),
    adminDb.collection("clients").orderBy("createdAt", "desc").limit(400).get(),
    listMergedTeamUsers(),
  ]);

  const tasks = tasksSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((row) => (actorUid ? canAccessRecord(row, actorUid) : false));
  const clients = clientsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((row) => (actorUid ? canAccessRecord(row, actorUid) : false))
    .map((row) => ({
      id: row.id,
      fullName: String(row.fullName ?? ""),
      displayName: String(row.displayName ?? ""),
      logoURL: String(row.logoURL ?? ""),
    }));
  const teamUsers = users.map((u) => ({ id: u.id, fullName: u.fullName ?? "", email: u.email ?? "", photoURL: u.photoURL ?? "" }));

  return (
    <section>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 uppercase">Tareas</h1>

      <div className="mt-4">
        <TasksBoard initialTasks={tasks} clients={clients} users={teamUsers} actorUid={actorUid} />
      </div>
    </section>
  );
}
