import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: "ID inválido." }, { status: 400 });
  }

  if (id === actor.uid) {
    return NextResponse.json({ ok: false, error: "No podés eliminar tu propio usuario." }, { status: 403 });
  }

  let deletedAuth = false;
  let deletedFirestore = false;

  try {
    await adminAuth.getUser(id);
    await adminAuth.deleteUser(id);
    deletedAuth = true;
  } catch (err: unknown) {
    const code = typeof err === "object" && err !== null && "code" in err ? String((err as { code: string }).code) : "";
    if (code !== "auth/user-not-found") {
      const message = err instanceof Error ? err.message : "Error al eliminar en Authentication.";
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
  }

  const userRef = adminDb.collection("users").doc(id);
  const snap = await userRef.get();
  if (snap.exists) {
    await userRef.delete();
    deletedFirestore = true;
  }

  if (!deletedAuth && !deletedFirestore) {
    return NextResponse.json(
      { ok: false, error: "No existe perfil ni cuenta con ese identificador." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, deletedAuth, deletedFirestore });
}
