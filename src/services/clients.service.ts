import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { Client } from "@/types/client";
import type { Lead } from "@/types/lead";

export const listClients = async () => {
  const ref = query(collection(firebaseDb, "clients"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(ref);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Client[];
};

export const createClient = async (
  payload: Omit<Client, "id" | "createdAt" | "updatedAt">,
) => {
  return addDoc(collection(firebaseDb, "clients"), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const convertLeadToClient = async (lead: Lead) => {
  const clientRef = await createClient({
    originLeadId: lead.id,
    displayName: lead.fullName,
    legalName: "",
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    brandName: lead.company ?? lead.fullName,
    country: "",
    industry: "",
    status: "active",
    assignedTeam: lead.assignedTo ? [lead.assignedTo] : [],
    servicesContracted: lead.serviceInterest,
    projectSummary: lead.message,
    billingModel: "hybrid",
    contractSigned: false,
    invoicingRequired: false,
    paymentStatus: "pending",
    pricing: {
      currency: "USD",
      amount: 0,
      notes: "Definir en diagnóstico comercial",
    },
    startDate: "",
    endDate: "",
    nextBillingDate: "",
    documents: [],
  });

  await updateDoc(doc(firebaseDb, "leads", lead.id), {
    status: "converted",
    convertedToClientId: clientRef.id,
    updatedAt: serverTimestamp(),
  });

  return clientRef.id;
};
