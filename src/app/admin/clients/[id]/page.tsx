import { ClientDetailShell } from "@/components/admin/client-detail-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  return <ClientDetailShell clientId={id} />;
}
