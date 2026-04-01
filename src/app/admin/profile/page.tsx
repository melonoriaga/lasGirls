"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail, signOut, updatePassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";

const inputClassName =
  "block w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-300 focus:ring-rose-300";

type Profile = {
  fullName?: string;
  username?: string;
  email?: string;
  photoURL?: string;
  contactPhone?: string;
  workingHours?: string;
  usefulLinks?: string;
  internalNotes?: string;
};

export default function AdminProfilePage() {
  const router = useRouter();
  const steps = [
    { id: "profile", label: "Perfil" },
    { id: "contact", label: "Contacto y notas" },
    { id: "security", label: "Seguridad" },
  ] as const;
  const [activeStep, setActiveStep] = useState<(typeof steps)[number]["id"]>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [usefulLinks, setUsefulLinks] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/admin/profile");
      const json = (await response.json()) as { ok: boolean; profile?: Profile; error?: string };
      if (!json.ok) {
        setError(json.error ?? "No pudimos cargar el perfil.");
        return;
      }
      const next = json.profile ?? {};
      setProfile(next);
      setFullName(next.fullName ?? "");
      setUsername(next.username ?? "");
      setPhotoURL(next.photoURL ?? "");
      setContactPhone(next.contactPhone ?? "");
      setWorkingHours(next.workingHours ?? "");
      setUsefulLinks(next.usefulLinks ?? "");
      setInternalNotes(next.internalNotes ?? "");
    };
    void load();
  }, []);

  const uploadPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo podés subir imágenes.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("La foto supera el máximo de 1MB.");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/profile/photo", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as { ok: boolean; photoURL?: string; error?: string };
      if (!json.ok || !json.photoURL) {
        setError(json.error ?? "No se pudo subir la foto.");
        return;
      }
      const url = json.photoURL;
      setPhotoURL(url);
      setProfile((prev) => ({ ...(prev ?? {}), photoURL: url }));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          username,
          photoURL,
          contactPhone,
          workingHours,
          usefulLinks,
          internalNotes,
        }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        setError(json.error ?? "No pudimos guardar cambios.");
        return;
      }
      setMessage("Perfil actualizado.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!firebaseAuth.currentUser) {
      setError("No hay sesión activa para cambiar contraseña.");
      return;
    }

    try {
      setChangingPassword(true);
      setError("");
      setMessage("");
      await updatePassword(firebaseAuth.currentUser, newPassword);
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Contraseña actualizada.");
    } catch (changeError) {
      const messageFromFirebase =
        changeError instanceof Error ? changeError.message : "No se pudo actualizar la contraseña.";
      setError(
        messageFromFirebase.includes("requires-recent-login")
          ? "Por seguridad, cerrá sesión y volvé a ingresar antes de cambiar la contraseña."
          : messageFromFirebase,
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const sendReset = async () => {
    const targetEmail = profile?.email || firebaseAuth.currentUser?.email;
    if (!targetEmail) {
      setError("No encontramos un email para enviar el reseteo.");
      return;
    }
    try {
      setError("");
      setMessage("");
      await sendPasswordResetEmail(firebaseAuth, targetEmail);
      setMessage("Enviamos un email para cambiar tu contraseña.");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "No pudimos enviar el email de reseteo.");
    }
  };

  const logout = async () => {
    try {
      setLoggingOut(true);
      await signOut(firebaseAuth);
      await fetch("/api/admin/session", { method: "DELETE" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Mi perfil</h1>
      <p className="mt-2 max-w-3xl text-sm text-zinc-600">
        Definí cómo te ven dentro del admin: username, foto, teléfono, horarios, links útiles y notas internas.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">Configuración</p>
          <div className="mt-3 grid gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeStep === step.id
                    ? "bg-rose-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span className="grid h-5 w-5 place-items-center rounded-full border border-zinc-300 text-[11px] font-semibold">
                  {index + 1}
                </span>
                <span className="font-medium">{step.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid gap-4">
          {activeStep === "profile" && (
            <>
              <article className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Foto de perfil</p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-3 relative block h-44 w-44 overflow-hidden rounded-xl border-2 border-zinc-200 bg-zinc-100 transition hover:border-fuchsia-300"
                >
                  {photoURL ? (
                    <Image src={photoURL} alt="Foto de perfil" fill className="object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs uppercase text-zinc-500">Sin foto</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    {uploading ? "Subiendo..." : "Tocar para cambiar"}
                  </div>
                </button>
                <input
                  ref={photoInputRef}
                  className="mt-3 w-full text-xs text-zinc-600"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => void uploadPhoto(event.target.files?.[0])}
                />
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50/60"
                  >
                    {uploading ? "Subiendo foto..." : "Adjuntar imagen"}
                  </button>
                  <p className="text-[11px] text-zinc-500">Máximo 1MB</p>
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Datos visibles</p>
                <div className="mt-3 grid gap-3">
                  <label className="grid gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Email</span>
                    <input className={`${inputClassName} bg-zinc-100`} value={profile?.email ?? ""} disabled />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Nombre</span>
                    <input className={inputClassName} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Username</span>
                    <input
                      className={inputClassName}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ej: lasgirls.mel"
                    />
                  </label>
                  <p className="text-[11px] text-zinc-500">Formato: 3-30 caracteres (a-z, 0-9, . _ -).</p>
                </div>
              </article>
            </>
          )}

          {activeStep === "contact" && (
            <article className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Contacto y notas</p>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Teléfono</span>
                  <input
                    className={inputClassName}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+54 ..."
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Horario habitual</span>
                  <input
                    className={inputClassName}
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Lun-Vie 9 a 18"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Links útiles</span>
                  <textarea
                    className={`${inputClassName} min-h-24`}
                    value={usefulLinks}
                    onChange={(e) => setUsefulLinks(e.target.value)}
                    placeholder={"Un link por línea:\nhttps://figma.com/...\nhttps://notion.so/..."}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Notas</span>
                  <textarea
                    className={`${inputClassName} min-h-24`}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Info útil para que el equipo te contacte o coordine."
                  />
                </label>
              </div>
            </article>
          )}

          {activeStep === "security" && (
            <article className="rounded-2xl border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Seguridad y sesión</p>
              <div className="mt-3 grid gap-3">
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Nueva contraseña</span>
                  <input
                    type="password"
                    className={inputClassName}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs uppercase tracking-[0.12em] text-zinc-500">Confirmar contraseña</span>
                  <input
                    type="password"
                    className={inputClassName}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void changePassword()}
                    disabled={changingPassword}
                    className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-60"
                  >
                    {changingPassword ? "Actualizando..." : "Cambiar contraseña"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendReset()}
                    className="inline-flex rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    Enviar email de reseteo
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    disabled={loggingOut}
                    className="inline-flex rounded-xl bg-rose-300 px-3 py-2 text-xs font-semibold text-zinc-900 disabled:opacity-60"
                  >
                    {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                  </button>
                </div>
              </div>
            </article>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}
          {message && <p className="text-sm text-emerald-700">{message}</p>}

          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || uploading}
            className="inline-flex w-fit rounded-xl bg-rose-300 px-4 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-rose-400 disabled:opacity-60"
          >
            {saving ? "Guardando..." : uploading ? "Subiendo foto..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  );
}
