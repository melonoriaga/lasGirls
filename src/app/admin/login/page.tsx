"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { firebaseAuth } from "@/lib/firebase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });

      if (!response.ok) throw new Error("No se pudo crear la sesión.");
      router.push("/admin");
      router.refresh();
    } catch {
      setError("No pudimos iniciar sesión. Revisá tus datos o la invitación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-screen max-w-md content-center px-4">
      <h1 className="font-display text-5xl uppercase">Admin Login</h1>
      <p className="mt-3 text-sm text-zinc-700">
        Acceso privado con invitación. No hay registro público habilitado.
      </p>
      <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <input
          className="field"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="field"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Contraseña"
          required
        />
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </form>
    </section>
  );
}
