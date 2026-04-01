"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  postId: string;
  initialLikes: number;
};

const getSessionId = () => {
  const key = "lasgirls_like_session";
  const current = localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
};

export function LikeButton({ postId, initialLikes }: Props) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onLike = async () => {
    setLoading(true);
    const sessionId = getSessionId();
    const response = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, sessionId }),
    });
    const json = (await response.json()) as { ok: boolean; reason?: string };
    if (json.ok) {
      setLikes((value) => value + 1);
      setMessage("Gracias por el apoyo.");
    } else if (json.reason === "already-liked") {
      setMessage("Ya habías dejado tu like.");
    } else {
      setMessage("No pudimos registrar el like en este momento.");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <Button onClick={onLike} disabled={loading} type="button">
        {loading ? "Enviando..." : "Me gustó"}
      </Button>
      <span className="text-sm">{likes} likes</span>
      {message && <span className="text-xs text-zinc-600">{message}</span>}
    </div>
  );
}
