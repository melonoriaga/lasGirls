"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { firebaseAuth } from "@/lib/firebase/client";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#ff5faf] focus:ring-2 focus:ring-[#ff5faf]/25";

export default function AdminLoginPage() {
  const router = useRouter();
  const [postLoginPath, setPostLoginPath] = useState("/admin/leads");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next");
    if (next && next.startsWith("/admin") && !next.startsWith("/admin/login")) {
      setPostLoginPath(next);
    }
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      await setPersistence(firebaseAuth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const token = await credential.user.getIdToken();

      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: token, remember: rememberMe }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "No se pudo crear la sesión.");
      }
      router.push(postLoginPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar sesión. Revisá tus datos o la invitación.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto grid min-h-screen max-w-md content-center px-4">
      {loading && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-zinc-100/85 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-5 shadow-lg">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-[3px] border-black border-t-transparent" />
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-700">Cargando dashboard...</p>
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <Image
            src="/brand/logos/las-girls-vertical-rosa.png"
            alt="Las Girls+"
            width={56}
            height={56}
            priority
            className="h-14 w-14 object-contain"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Las Girls+</p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Admin login</h1>
          </div>
        </div>
        <p className="text-sm text-zinc-600">Acceso privado por invitación. No existe registro público.</p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
        <input
          className={inputClassName}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <div className="relative">
          <input
            className={`${inputClassName} pr-24`}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-zinc-300 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-zinc-700"
          >
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        </div>
        <label className="mt-1 inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] text-zinc-700">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="h-3.5 w-3.5 accent-black"
          />
          Recordarme
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
        </form>
      </div>
    </section>
  );
}
