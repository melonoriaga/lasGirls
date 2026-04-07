import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

type LogClientActivityInput = {
  clientId: string;
  action: string;
  createdByUserId: string;
  message?: string;
  metadata?: Record<string, unknown>;
};

export async function logClientActivity({
  clientId,
  action,
  createdByUserId,
  message = "",
  metadata = {},
}: LogClientActivityInput) {
  const now = new Date().toISOString();
  await adminDb
    .collection("clients")
    .doc(clientId)
    .collection("activity")
    .add({
      action,
      message,
      metadata,
      createdByUserId,
      createdAt: now,
    });
}

export async function incrementClientCounter(
  clientId: string,
  field: "usefulLinksCount" | "notesCount" | "invoicesCount" | "paymentsCount",
  delta: number,
) {
  await adminDb
    .collection("clients")
    .doc(clientId)
    .update({
      [field]: FieldValue.increment(delta),
      updatedAt: new Date().toISOString(),
    });
}
