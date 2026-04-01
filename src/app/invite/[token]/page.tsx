"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");

  const acceptInvitation = async () => {
    try {
      setError("");
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: params.token, fullName, idToken }),
      });
      if (!response.ok) throw new Error("No se pudo aceptar invitación.");
      router.push("/admin/login");
    } catch {
      setError("No pudimos completar tu alta. Revisá el link o pedí una nueva invitación.");
    }
  };

  return (
    <section className="mx-auto grid min-h-screen max-w-lg content-center gap-3 px-4">
      <h1 className="font-display text-5xl uppercase">Activar acceso</h1>
      <p className="text-sm text-zinc-700">
        Completá tus datos para activar tu cuenta de admin privada.
      </p>
      <input className="field" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <input className="field" placeholder="Email de invitación" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="field" placeholder="Nueva contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <Button type="button" onClick={acceptInvitation}>
        Confirmar invitación
      </Button>
    </section>
  );
}
