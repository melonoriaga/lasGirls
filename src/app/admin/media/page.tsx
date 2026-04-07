"use client";

import { useCallback, useRef, useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { firebaseStorage } from "@/lib/firebase/client";

const MAX_BYTES = 1024 * 1024;

export default function AdminMediaPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validateAndUpload = useCallback(async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo aceptamos imágenes (JPG, PNG, WebP, GIF…).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La imagen supera el máximo de 1MB. Comprimila antes de subirla.");
      return;
    }

    setLoading(true);
    setError("");
    setFileName(file.name);
    try {
      const fileRef = ref(firebaseStorage, `media/${Date.now()}-${file.name.replace(/\s+/g, "-")}`);
      await uploadBytes(fileRef, file);
      const uploadedUrl = await getDownloadURL(fileRef);
      setUrl(uploadedUrl);
    } catch {
      setError("No pudimos subir el archivo. Revisá la sesión y las reglas de Storage.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    void validateAndUpload(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    void validateAndUpload(file);
  };

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Media</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Subí imágenes para el blog o recursos internos. Tamaño máximo: 1MB. Arrastrá un archivo o elegí uno desde
        tu dispositivo.
      </p>

      <div className="mt-6">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onInputChange}
          aria-hidden
        />

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={onDrop}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
            dragOver
              ? "border-rose-400 bg-rose-50"
              : "border-zinc-300 bg-white hover:border-rose-300 hover:bg-rose-50/40"
          }`}
        >
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <div className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-700">
              Zona de carga
            </div>
            <p className="text-sm text-zinc-700">
              <button
                type="button"
                className="font-semibold text-[#db2777] underline decoration-rose-300 underline-offset-2 hover:decoration-[#db2777]"
                onClick={() => inputRef.current?.click()}
              >
                Elegí un archivo
              </button>{" "}
              o soltalo acá
            </p>
            <p className="text-xs text-zinc-500">PNG, JPG, WebP o GIF · hasta 1MB</p>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
              {loading ? "Subiendo…" : "Examinar archivos"}
            </Button>
          </div>
        </div>
      </div>

      {fileName && !error ? (
        <p className="mt-3 text-xs text-zinc-500">
          Último archivo: <span className="font-medium text-zinc-700">{fileName}</span>
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {url ? (
        <div className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">Listo — imagen disponible</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="break-all text-sm font-medium text-[#db2777] underline"
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Abrir URL
            </a>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                } catch {
                  setError("No pudimos copiar al portapapeles.");
                }
              }}
            >
              Copiar URL
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
