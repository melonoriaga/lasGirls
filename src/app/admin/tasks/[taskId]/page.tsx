import { notFound } from "next/navigation";
import { TaskDetailPage } from "@/components/admin/task-detail-page";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { listMergedTeamUsers } from "@/lib/admin/team-users";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type AdminClientRow = Record<string, unknown> & { id: string };

export default async function AdminTaskDetailRoute({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const decodedId = decodeURIComponent(taskId);

  const actor = await getSessionActor();
  const actorUid = actor?.uid ?? "";

  const [taskSnap, clientsSnap, users] = await Promise.all([
    adminDb.collection("tasks").doc(decodedId).get(),
    adminDb.collection("clients").orderBy("createdAt", "desc").limit(400).get(),
    listMergedTeamUsers(),
  ]);

  if (!taskSnap.exists) notFound();
  const taskRow = { id: taskSnap.id, ...(taskSnap.data() as Record<string, unknown>) };
  if (!actorUid || !canAccessRecord(taskRow, actorUid)) notFound();

  const clients = clientsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }) as AdminClientRow)
    .filter((row) => canAccessRecord(row, actorUid))
    .map((row) => ({
      id: row.id,
      fullName: String(row.fullName ?? ""),
      displayName: String(row.displayName ?? ""),
      logoURL: String(row.logoURL ?? ""),
    }));

  const teamUsers = users.map((u) => ({ id: u.id, fullName: u.fullName ?? "", email: u.email ?? "", photoURL: u.photoURL ?? "" }));

  return (
    <section className="mx-auto max-w-[1100px]">
      <TaskDetailPage initialTask={taskRow} clients={clients} users={teamUsers} actorUid={actorUid} />
    </section>
  );
}
