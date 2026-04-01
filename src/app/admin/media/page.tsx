"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { firebaseStorage } from "@/lib/firebase/client";

export default function AdminMediaPage() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Solo aceptamos imágenes.");
      return;
    }
    if (file.size > 1024 * 1024) {
      setError("La imagen supera el máximo de 1MB.");
      return;
    }

    setLoading(true);
    setError("");
    const fileRef = ref(firebaseStorage, `media/${Date.now()}-${file.name.replace(/\s+/g, "-")}`);
    await uploadBytes(fileRef, file);
    const uploadedUrl = await getDownloadURL(fileRef);
    setUrl(uploadedUrl);
    setLoading(false);
  };

  return (
    <section className="grid gap-4">
      <h1 className="font-display text-5xl uppercase">Media Manager</h1>
      <p className="text-sm text-zinc-700">
        Subí imágenes para blog o recursos internos. Máximo permitido: 1MB por archivo.
      </p>
      <input type="file" accept="image/*" onChange={(e) => void upload(e.target.files?.[0])} />
      <Button type="button" disabled={loading}>
        {loading ? "Subiendo..." : "Listo para subir"}
      </Button>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {url && (
        <div className="grid gap-2">
          <p className="text-sm text-emerald-700">Imagen subida correctamente.</p>
          <a className="text-sm underline" href={url} target="_blank" rel="noreferrer">
            Ver URL
          </a>
        </div>
      )}
    </section>
  );
}
