/**
 * Nombres legibles y clases Tailwind para acciones registradas en activityLogs / actividad de clientes.
 * Las claves técnicas se mantienen en Firestore; la UI usa label + badgeClass.
 */
export const ADMIN_ACTION_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  login: {
    label: "Inicio de sesión",
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  logout: {
    label: "Cierre de sesión",
    badgeClass: "border-zinc-300 bg-zinc-100 text-zinc-800",
  },
  lead_created_manual: {
    label: "Lead creado a mano",
    badgeClass: "border-sky-200 bg-sky-50 text-sky-900",
  },
  lead_status_updated: {
    label: "Estado del lead cambiado",
    badgeClass: "border-amber-200 bg-amber-50 text-amber-900",
  },
  lead_updated: {
    label: "Lead actualizado",
    badgeClass: "border-blue-200 bg-blue-50 text-blue-900",
  },
  lead_deleted: {
    label: "Lead eliminado",
    badgeClass: "border-red-200 bg-red-50 text-red-900",
  },
  lead_converted: {
    label: "Lead pasado a cliente",
    badgeClass: "border-rose-300 bg-rose-50 text-rose-900",
  },
  client_created: {
    label: "Cliente nuevo (desde lead)",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-950",
  },
  lead_budget_added: {
    label: "Presupuesto agregado al lead",
    badgeClass: "border-violet-200 bg-violet-50 text-violet-900",
  },
  lead_note_added: {
    label: "Nota en el lead",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-900",
  },
  note_added: {
    label: "Nota en el cliente",
    badgeClass: "border-yellow-200 bg-yellow-50 text-yellow-900",
  },
  client_updated: {
    label: "Datos del cliente actualizados",
    badgeClass: "border-indigo-200 bg-indigo-50 text-indigo-900",
  },
  client_deactivated: {
    label: "Cliente desactivado",
    badgeClass: "border-orange-200 bg-orange-50 text-orange-900",
  },
  client_reactivated: {
    label: "Cliente reactivado",
    badgeClass: "border-lime-200 bg-lime-50 text-lime-900",
  },
  client_deleted: {
    label: "Cliente eliminado",
    badgeClass: "border-red-200 bg-red-50 text-red-900",
  },
  link_added: {
    label: "Enlace útil agregado",
    badgeClass: "border-cyan-200 bg-cyan-50 text-cyan-900",
  },
  invoice_created: {
    label: "Factura cargada",
    badgeClass: "border-teal-200 bg-teal-50 text-teal-900",
  },
  invoice_updated: {
    label: "Factura actualizada",
    badgeClass: "border-teal-300 bg-teal-50 text-teal-950",
  },
  payment_recorded: {
    label: "Pago registrado",
    badgeClass: "border-green-200 bg-green-50 text-green-900",
  },
  blog_post_updated: {
    label: "Post del blog editado",
    badgeClass: "border-purple-200 bg-purple-50 text-purple-900",
  },
  blog_post_deleted: {
    label: "Post del blog eliminado",
    badgeClass: "border-red-200 bg-red-50 text-red-900",
  },
  blog_status_updated: {
    label: "Estado de publicación cambiado",
    badgeClass: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  invite_created: {
    label: "Invitación nueva enviada",
    badgeClass: "border-pink-200 bg-pink-50 text-pink-900",
  },
  profile_updated: {
    label: "Perfil actualizado",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-900",
  },
  profile_photo_uploaded: {
    label: "Foto de perfil cambiada",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-900",
  },
};

export function adminActionLabel(raw: string | undefined | null): string {
  const key = String(raw ?? "").trim();
  if (!key) return "Actividad sin detalle";
  const cfg = ADMIN_ACTION_CONFIG[key];
  if (cfg) return cfg.label;
  return key
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function adminActionBadgeClass(raw: string | undefined | null): string {
  const key = String(raw ?? "").trim();
  const cfg = ADMIN_ACTION_CONFIG[key];
  if (cfg) return cfg.badgeClass;
  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}
