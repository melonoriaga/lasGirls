"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiCloseLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiTimeLine,
  RiUserSettingsLine,
} from "@remixicon/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdminToast } from "@/components/admin/admin-toast-provider";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  isNowWithinWorkingHours,
  parseWorkingHoursField,
  type ParsedWorkingHours,
} from "@/lib/admin/working-hours";
import type { MergedTeamUser } from "@/lib/admin/team-users";

type Props = {
  users: MergedTeamUser[];
  myUid: string;
};

function splitLinkLines(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  if (lines[0].includes(",")) {
    return lines[0]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return lines;
}

function linkHref(line: string): string | null {
  const s = line.trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return null;
}

function WorkingHoursBlock({ text }: { text: string }) {
  const trimmed = text.trim();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const parsed: ParsedWorkingHours | null = useMemo(() => parseWorkingHoursField(trimmed), [trimmed]);

  const within = useMemo(() => {
    if (!parsed) return null;
    return isNowWithinWorkingHours(parsed, new Date());
  }, [parsed, tick]);

  if (!trimmed) return <p className="text-xs text-zinc-400">Sin horario cargado</p>;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3">
      <div className="flex items-start gap-2">
        <RiTimeLine className="mt-0.5 size-4 shrink-0 text-zinc-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Horario habitual</p>
          <p className="mt-1 text-sm text-zinc-800">{trimmed}</p>
          {within !== null ? (
            <p
              className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                within
                  ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80"
                  : "bg-zinc-200/80 text-zinc-600 ring-1 ring-zinc-300/60"
              }`}
            >
              <span
                className={`size-2 shrink-0 rounded-full ${within ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" : "bg-zinc-400"}`}
                aria-hidden
              />
              {within ? "En horario (hora local de tu navegador)" : "Fuera de horario"}
            </p>
          ) : (
            <p className="mt-2 text-[10px] leading-snug text-zinc-500">
              No pudimos interpretar el horario automáticamente; mostrá el texto de arriba como referencia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UsefulLinksBlock({ text }: { text: string }) {
  const lines = useMemo(() => splitLinkLines(text), [text]);
  if (lines.length === 0) {
    return <p className="text-xs text-zinc-400">Sin links</p>;
  }

  return (
    <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-800/80">Links útiles</p>
      <ul className="mt-2 space-y-1.5">
        {lines.map((line, i) => {
          const href = linkHref(line);
          if (href) {
            return (
              <li key={`${i}-${line.slice(0, 24)}`}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-sky-800 underline-offset-2 hover:text-sky-950 hover:underline"
                >
                  <RiExternalLinkLine className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100" aria-hidden />
                  <span>{line}</span>
                </a>
              </li>
            );
          }
          return (
            <li key={`${i}-${line.slice(0, 24)}`} className="text-sm text-zinc-600">
              {line}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NotesBlock({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return <p className="text-xs text-zinc-400">Sin notas</p>;
  }
  return (
    <div className="rounded-xl border border-amber-200/90 bg-gradient-to-b from-amber-50 to-amber-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-900/70">Notas internas</p>
      <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-amber-100/80 bg-white/70 px-3 py-2.5 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words text-amber-950 shadow-sm">
        {trimmed}
      </div>
    </div>
  );
}

function UserCard({
  user,
  isSelf,
  onPhotoClick,
  onRequestDelete,
}: {
  user: MergedTeamUser;
  isSelf: boolean;
  onPhotoClick: (url: string, alt: string) => void;
  onRequestDelete?: () => void;
}) {
  const photo = user.photoURL?.trim();
  const initial = (user.fullName || user.email || "U").slice(0, 1);

  const openPhoto = useCallback(() => {
    if (photo) onPhotoClick(photo, user.fullName || user.email || "Foto de perfil");
  }, [photo, user.fullName, user.email, onPhotoClick]);

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isSelf ? "border-rose-200 ring-1 ring-rose-100" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <button
          type="button"
          disabled={!photo}
          onClick={openPhoto}
          title={photo ? "Ver foto en grande" : undefined}
          aria-label={photo ? "Ver foto en grande" : undefined}
          className={`relative mx-auto h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 sm:mx-0 ${
            photo ? "cursor-pointer ring-offset-2 hover:ring-2 hover:ring-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-400" : "cursor-default opacity-95"
          }`}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" aria-hidden className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-lg font-semibold uppercase text-zinc-600">
              {initial}
            </span>
          )}
        </button>

        <div className="mt-3 min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
            <p className="font-semibold text-zinc-900">{user.fullName || "Sin nombre"}</p>
            {isSelf ? (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-900">
                Vos
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-1 sm:justify-start">
            {user.orphanedProfile ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                Sin cuenta Auth
              </span>
            ) : null}
            {user.hasAuthAccount && !user.hasFirestoreProfile ? (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">
                Sin perfil Firestore
              </span>
            ) : null}
            {user.authDisabled ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">
                Auth off
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm text-zinc-600" title={user.email}>
            {user.email || "Sin email"}
          </p>
          {user.username ? <p className="text-xs text-zinc-500">@{user.username}</p> : null}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
            Rol: {user.role || "—"}
          </p>
          {user.hasAuthAccount ? (
            <p className="mt-0.5 text-[10px] text-zinc-400">
              UID <code className="rounded bg-zinc-100 px-1">{user.id.slice(0, 10)}…</code>
            </p>
          ) : null}
          {isSelf ? (
            <Link
              href="/admin/profile"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#db2777] hover:underline"
            >
              <RiUserSettingsLine className="size-3.5" aria-hidden />
              Editar mi perfil
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-3 border-t border-zinc-100 pt-4">
        {!isSelf && onRequestDelete ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRequestDelete}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-semibold text-red-800 transition hover:bg-red-100"
            >
              <RiDeleteBinLine className="size-3.5 shrink-0" aria-hidden />
              Eliminar del equipo
            </button>
          </div>
        ) : null}
        <p className="text-xs text-zinc-700">
          <strong className="text-zinc-500">Tel:</strong> {user.contactPhone?.trim() || "—"}
        </p>
        <WorkingHoursBlock text={user.workingHours ?? ""} />
        <UsefulLinksBlock text={user.usefulLinks ?? ""} />
        <NotesBlock text={user.internalNotes ?? ""} />
      </div>
    </article>
  );
}

export function AdminUsersBoard({ users, myUid }: Props) {
  const router = useRouter();
  const toast = useAdminToast();
  const [lightbox, setLightbox] = useState<{ url: string; alt: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MergedTeamUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  const runDelete = useCallback(async () => {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, { method: "DELETE" });
      const j = (await res.json()) as {
        ok?: boolean;
        error?: string;
        deletedAuth?: boolean;
        deletedFirestore?: boolean;
      };
      if (!res.ok || !j.ok) {
        toast.error(j.error ?? "No se pudo eliminar.");
        return;
      }
      const parts: string[] = [];
      if (j.deletedAuth) parts.push("cuenta de acceso");
      if (j.deletedFirestore) parts.push("perfil en base");
      toast.success(parts.length ? `Eliminado: ${parts.join(" y ")}.` : "Eliminado.");
      setConfirmDelete(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }, [confirmDelete, router, toast]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, closeLightbox]);

  return (
    <>
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="¿Eliminar a esta persona del equipo?"
        description={
          confirmDelete
            ? confirmDelete.orphanedProfile
              ? `Se borrará solo el perfil en Firestore (${confirmDelete.email || confirmDelete.id}). No hay cuenta en Firebase Auth vinculada.`
              : `Se eliminará la cuenta de Firebase Authentication${confirmDelete.hasFirestoreProfile ? " y el perfil en Firestore" : ""} para ${confirmDelete.email || confirmDelete.fullName || confirmDelete.id}. No podrá volver a iniciar sesión salvo que la vuelvas a invitar o crear en la consola.`
            : undefined
        }
        confirmLabel="Sí, eliminar"
        danger
        loading={Boolean(deletingId)}
        onCancel={() => !deletingId && setConfirmDelete(null)}
        onConfirm={() => void runDelete()}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isSelf={Boolean(myUid && user.id === myUid)}
            onPhotoClick={(url, alt) => setLightbox({ url, alt })}
            onRequestDelete={() => setConfirmDelete(user)}
          />
        ))}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeLightbox}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={lightbox.alt}
            className="relative max-h-[min(90vh,880px)] max-w-[min(92vw,720px)] overflow-hidden rounded-2xl border border-white/20 bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeLightbox}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
              aria-label="Cerrar"
            >
              <RiCloseLine className="size-6" aria-hidden />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.url}
              alt={lightbox.alt}
              className="max-h-[min(90vh,880px)] w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
