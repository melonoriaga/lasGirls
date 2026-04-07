export type ChangelogFiltersInput = {
  action?: string;
  actorUid?: string;
  from?: string;
  to?: string;
};

/** Fragmento para URLs de paginación (empieza con & si hay params). */
export function changelogQueryString(filters: ChangelogFiltersInput): string {
  const sp = new URLSearchParams();
  const action = filters.action?.trim();
  const actorUid = filters.actorUid?.trim();
  const from = filters.from?.trim();
  const to = filters.to?.trim();
  if (action) sp.set("action", action);
  if (actorUid) sp.set("actor", actorUid);
  if (from) sp.set("from", from);
  if (to) sp.set("to", to);
  const s = sp.toString();
  return s ? `&${s}` : "";
}
