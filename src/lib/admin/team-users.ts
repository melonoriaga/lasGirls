import type { UserRecord } from "firebase-admin/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export type TeamUserFirestore = {
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  photoURL?: string;
  contactPhone?: string;
  workingHours?: string;
  usefulLinks?: string;
  internalNotes?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isActive?: boolean;
};

export type MergedTeamUser = TeamUserFirestore & {
  id: string;
  /** Tiene cuenta en Firebase Auth (puede iniciar sesión) */
  hasAuthAccount: boolean;
  /** Existe documento users/{uid} */
  hasFirestoreProfile: boolean;
  /** Documento en users/ sin usuario correspondiente en Auth */
  orphanedProfile?: boolean;
  /** Email según Auth (prioridad sobre copia en Firestore) */
  authEmail?: string | null;
  /** Usuario deshabilitado en Firebase Auth */
  authDisabled?: boolean;
};

async function listAllAuthUsers(): Promise<UserRecord[]> {
  const all: UserRecord[] = [];
  let pageToken: string | undefined;
  do {
    const page = await adminAuth.listUsers(1000, pageToken);
    all.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);
  return all;
}

/**
 * Lista del equipo: usuarios de Firebase Auth (fuente de verdad para login)
 * enriquecidos con `users/{uid}` en Firestore. Incluye perfiles huérfanos
 * (doc en Firestore sin cuenta Auth) para poder detectarlos.
 */
export async function listMergedTeamUsers(): Promise<MergedTeamUser[]> {
  const [authUsers, fsSnap] = await Promise.all([
    listAllAuthUsers(),
    adminDb.collection("users").get(),
  ]);

  const fsById = new Map<string, TeamUserFirestore & Record<string, unknown>>();
  for (const doc of fsSnap.docs) {
    fsById.set(doc.id, doc.data() as TeamUserFirestore & Record<string, unknown>);
  }

  const authIds = new Set(authUsers.map((u) => u.uid));

  const fromAuth: MergedTeamUser[] = authUsers.map((u) => {
    const fs = fsById.get(u.uid);
    const hasFirestoreProfile = fsById.has(u.uid);
    return {
      id: u.uid,
      hasAuthAccount: true,
      hasFirestoreProfile,
      authEmail: u.email ?? null,
      email: u.email ?? fs?.email ?? "",
      fullName: fs?.fullName ?? u.displayName ?? "",
      username: fs?.username,
      role: fs?.role,
      photoURL: fs?.photoURL || u.photoURL || undefined,
      contactPhone: fs?.contactPhone,
      workingHours: fs?.workingHours,
      usefulLinks: fs?.usefulLinks,
      internalNotes: fs?.internalNotes,
      createdAt: fs?.createdAt ?? u.metadata.creationTime,
      lastLoginAt: fs?.lastLoginAt,
      isActive: fs?.isActive ?? !u.disabled,
      authDisabled: u.disabled,
    };
  });

  const orphans: MergedTeamUser[] = [];
  for (const doc of fsSnap.docs) {
    if (authIds.has(doc.id)) continue;
    const fs = fsById.get(doc.id)!;
    orphans.push({
      id: doc.id,
      hasAuthAccount: false,
      hasFirestoreProfile: true,
      orphanedProfile: true,
      authEmail: null,
      ...fs,
      email: fs.email ?? "",
      fullName: fs.fullName ?? "",
    });
  }

  const merged = [...fromAuth, ...orphans];
  merged.sort((a, b) => {
    const ea = (a.email || a.authEmail || "").toLowerCase();
    const eb = (b.email || b.authEmail || "").toLowerCase();
    return ea.localeCompare(eb);
  });

  return merged;
}
