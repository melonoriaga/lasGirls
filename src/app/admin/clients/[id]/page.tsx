import { ClientDetailShell } from "@/components/admin/client-detail-shell";
import { getSessionActor } from "@/lib/api/admin-session";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  const actor = await getSessionActor();
  return <ClientDetailShell clientId={id} actorUid={actor?.uid ?? ""} />;
}
