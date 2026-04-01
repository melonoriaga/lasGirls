import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { Lead, LeadNote, LeadStatus } from "@/types/lead";

export const createLead = async (payload: Omit<Lead, "id" | "createdAt" | "updatedAt">) => {
  return addDoc(collection(firebaseDb, "leads"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const listLeads = async () => {
  const ref = query(collection(firebaseDb, "leads"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Lead[];
};

export const getLead = async (leadId: string) => {
  const snapshot = await getDoc(doc(firebaseDb, "leads", leadId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Lead;
};

export const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
  await updateDoc(doc(firebaseDb, "leads", leadId), {
    status,
    updatedAt: serverTimestamp(),
  });
};

export const addLeadNote = async (leadId: string, note: Omit<LeadNote, "id" | "createdAt">) => {
  await addDoc(collection(firebaseDb, "leads", leadId, "notes"), {
    ...note,
    createdAt: serverTimestamp(),
  });
};
