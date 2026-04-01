import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
const projectIdFromFirebaseConfig = (() => {
  try {
    const raw = process.env.FIREBASE_CONFIG;
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { projectId?: string };
    return parsed.projectId ?? "";
  } catch {
    return "";
  }
})();
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  projectIdFromFirebaseConfig ??
  "";

const shouldUseServiceAccount = Boolean(privateKey && clientEmail && projectId);

const adminApp =
  getApps()[0] ??
  initializeApp({
    credential: shouldUseServiceAccount
      ? cert({
          projectId,
          clientEmail,
          privateKey,
        })
      : applicationDefault(),
    ...(projectId ? { projectId } : {}),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
