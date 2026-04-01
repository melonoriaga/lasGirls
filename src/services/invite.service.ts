import crypto from "node:crypto";
import { adminDb } from "@/lib/firebase/admin";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants/roles";
import type { AdminRole } from "@/types/auth";

export const createInvitation = async (email: string, role: AdminRole, invitedBy: string) => {
  const token = crypto.randomBytes(24).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);

  const payload = {
    email,
    role,
    permissions: DEFAULT_ROLE_PERMISSIONS[role],
    token,
    invitedBy,
    status: "pending",
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const ref = await adminDb.collection("invitations").add(payload);
  return { id: ref.id, token };
};

export const getInvitationByToken = async (token: string) => {
  const snapshot = await adminDb
    .collection("invitations")
    .where("token", "==", token)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};
