import { redirect } from "next/navigation";
import { PartnerLogosAdminPanel } from "@/components/admin/partner-logos-admin-panel";
import { getSessionActor } from "@/lib/api/admin-session";

export default async function AdminPartnerLogosPage() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    redirect("/admin/login");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Logos partners</h1>
      </div>
      <PartnerLogosAdminPanel />
    </section>
  );
}
