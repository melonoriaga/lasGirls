export type VipCodeFirestore = {
  code: string;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdByUid?: string;
};

export function isVipCodeUsable(data: Pick<VipCodeFirestore, "active" | "maxUses" | "usedCount" | "expiresAt">, now = new Date()): boolean {
  if (!data.active) return false;
  if (typeof data.usedCount !== "number" || typeof data.maxUses !== "number") return false;
  if (data.usedCount >= data.maxUses) return false;
  const expMs = new Date(data.expiresAt).getTime();
  if (Number.isNaN(expMs)) return false;
  return now.getTime() <= expMs;
}
