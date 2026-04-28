import { redirect } from "next/navigation";
import { VipCodesAdminPanel } from "@/components/admin/vip-codes-admin-panel";
import { getSessionActor } from "@/lib/api/admin-session";

export default async function AdminVipCodesPage() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    redirect("/admin/login");
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Códigos VIP</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
          Creá códigos tipo palabra (ej. JEAN20OFF), definí máximo de usos y fecha de expiración. Quien canjea un código válido
          genera un lead con el proyecto; quien pide «quiero mi VIP code» entra como lead de descuento.
        </p>
      </div>
      <VipCodesAdminPanel />
    </section>
  );
}
