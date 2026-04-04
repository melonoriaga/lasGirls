import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const snapshot = await adminDb.collection("users").orderBy("createdAt", "desc").limit(200).get();
  const users = snapshot.docs.map((doc) => {
    const data = doc.data() as { fullName?: string; email?: string; username?: string };
    return {
      id: doc.id,
      fullName: data.fullName ?? "",
      email: data.email ?? "",
      username: data.username ?? "",
    };
  });

  return NextResponse.json({ ok: true, users });
}
