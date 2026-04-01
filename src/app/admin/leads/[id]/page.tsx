"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { firebaseDb } from "@/lib/firebase/client";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<Record<string, string> | null>(null);
  const [status, setStatus] = useState("new");
  const leadId = params.id;

  useEffect(() => {
    const load = async () => {
      const snapshot = await getDoc(doc(firebaseDb, "leads", leadId));
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Record<string, string>;
      setLead(data);
      setStatus(data.status ?? "new");
    };
    void load();
  }, [leadId]);

  const updateStatus = async () => {
    await fetch(`/api/admin/leads/${leadId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const convertLead = async () => {
    await fetch(`/api/admin/leads/${leadId}/convert`, { method: "POST" });
    const snapshot = await getDoc(doc(firebaseDb, "leads", leadId));
    if (snapshot.exists()) setLead(snapshot.data() as Record<string, string>);
  };

  if (!lead) return <p>Cargando lead...</p>;

  return (
    <section className="grid gap-5">
      <h1 className="font-display text-5xl uppercase">{lead.fullName}</h1>
      <p className="text-sm text-zinc-700">{lead.message}</p>
      <div className="grid gap-2 md:max-w-sm">
        <select className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="new">new</option>
          <option value="contacted">contacted</option>
          <option value="in_followup">in_followup</option>
          <option value="qualified">qualified</option>
          <option value="archived">archived</option>
          <option value="converted">converted</option>
        </select>
        <div className="flex gap-2">
          <Button onClick={updateStatus}>Guardar estado</Button>
          <Button onClick={convertLead} variant="outline">
            Convertir a cliente
          </Button>
        </div>
      </div>
    </section>
  );
}
