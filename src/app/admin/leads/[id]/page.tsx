"use client";

import { useParams } from "next/navigation";
import { LeadDetailPanel } from "@/components/admin/lead-detail-panel";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  return <LeadDetailPanel leadId={params.id} />;
}
