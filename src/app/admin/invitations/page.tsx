"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function InvitationsPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("editor");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  const invite = async () => {
    setError("");
    const response = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const json = (await response.json()) as { ok: boolean; inviteUrl?: string; error?: string };
    if (!json.ok) {
      setError(json.error ?? "No pudimos generar la invitación.");
      return;
    }
    setLink(json.inviteUrl ?? "");
  };

  return (
    <section className="grid max-w-xl gap-3">
      <h1 className="font-display text-5xl uppercase">Invitaciones</h1>
      <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email del invitado" />
      <select className="field" value={role} onChange={(e) => setRole(e.target.value)}>
        <option value="admin">admin</option>
        <option value="editor">editor</option>
        <option value="viewer">viewer</option>
      </select>
      <Button type="button" onClick={invite}>
        Generar invitación
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {link && (
        <p className="text-sm">
          Link generado:{" "}
          <a className="underline" href={link}>
            {link}
          </a>
        </p>
      )}
    </section>
  );
}
