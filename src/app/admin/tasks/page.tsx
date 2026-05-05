import { Suspense } from "react";
import { TasksBoard } from "@/components/admin/tasks-board";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { listMergedTeamUsers } from "@/lib/admin/team-users";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type AdminClientRow = Record<string, unknown> & { id: string };

function TasksBoardFallback() {
  return (
    <div className="grid gap-6 rounded-2xl border border-zinc-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-100" />
      <div className="flex gap-2">
        <div className="h-9 w-28 animate-pulse rounded-full bg-zinc-100" />
        <div className="h-9 w-28 animate-pulse rounded-full bg-zinc-100" />
      </div>
      <div className="h-24 animate-pulse rounded-xl bg-zinc-50" />
      <p className="text-center text-sm text-zinc-500">Cargando tareas…</p>
    </div>
  );
}

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
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as AdminClientRow)
    .filter((row) => (actorUid ? canAccessRecord(row, actorUid) : false))
    .map((row) => {
      const shortFromDoc =
        typeof row.shortCode === "string"
          ? row.shortCode.trim()
          : typeof row.taskPrefix === "string"
            ? row.taskPrefix.trim()
            : typeof row.clientCode === "string"
              ? row.clientCode.trim()
              : "";
      return {
        id: row.id,
        fullName: String(row.fullName ?? ""),
        displayName: String(row.displayName ?? ""),
        brandName: String(row.brandName ?? ""),
        shortCode: shortFromDoc,
        logoURL: String(row.logoURL ?? ""),
      };
    });
  const teamUsers = users.map((u) => ({ id: u.id, fullName: u.fullName ?? "", email: u.email ?? "", photoURL: u.photoURL ?? "" }));

  return (
    <section className="mx-auto max-w-[1200px]">
      <Suspense fallback={<TasksBoardFallback />}>
        <TasksBoard initialTasks={tasks} clients={clients} users={teamUsers} actorUid={actorUid} />
      </Suspense>
    </section>
  );
}
