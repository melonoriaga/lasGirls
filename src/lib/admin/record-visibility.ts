export type VisibilityScope = "team" | "private";

type VisibilityRecord = Record<string, unknown>;

export function readVisibilityScope(row: VisibilityRecord): VisibilityScope {
  return row.visibilityScope === "private" ? "private" : "team";
}

export function isOwner(row: VisibilityRecord, uid: string): boolean {
  if (typeof row.ownerUserId === "string" && row.ownerUserId === uid) return true;
  // Fallback for older records created before ownerUserId was persisted.
  if (typeof row.createdByUserId === "string" && row.createdByUserId === uid) return true;
  if (typeof row.createdBy === "string" && row.createdBy === uid) return true;
  return false;
}

export function canAccessRecord(row: VisibilityRecord, uid: string): boolean {
  const scope = readVisibilityScope(row);
  if (scope === "team") return true;
  return isOwner(row, uid);
}
