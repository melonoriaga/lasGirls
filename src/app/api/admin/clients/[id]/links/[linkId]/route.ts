import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientLinkPatchSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string; linkId: string }> };

async function assertClientAccess(id: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(id).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id, linkId } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

    const body = await request.json();
    const parsed = clientLinkPatchSchema.parse(body);
    if (Object.keys(parsed).length === 0) {
      return NextResponse.json({ ok: false, error: "Sin cambios." }, { status: 400 });
    }

    const linkRef = adminDb.collection("clients").doc(id).collection("links").doc(linkId);
    const linkSnap = await linkRef.get();
    if (!linkSnap.exists) {
      return NextResponse.json({ ok: false, error: "Link inexistente." }, { status: 404 });
    }

    const prev = linkSnap.data() ?? {};
    const prevTitle = String(prev.title ?? "");
    const now = new Date().toISOString();

    await linkRef.set(
      {
        ...parsed,
        updatedAt: now,
        updatedByUserId: actor.uid,
      },
      { merge: true },
    );

    const contentKeys = Object.keys(parsed).filter((k) => k !== "active");

    if ("active" in parsed) {
      if (parsed.active === false && prev.active !== false) {
        await logClientActivity({
          clientId: id,
          action: "link_deactivated",
          createdByUserId: actor.uid,
          message: prevTitle,
          metadata: { linkId },
        });
      } else if (parsed.active === true && prev.active === false) {
        await logClientActivity({
          clientId: id,
          action: "link_reactivated",
          createdByUserId: actor.uid,
          message: prevTitle,
          metadata: { linkId },
        });
      }
    }

    if (contentKeys.length > 0) {
      await logClientActivity({
        clientId: id,
        action: "link_updated",
        createdByUserId: actor.uid,
        message: String(parsed.title ?? prevTitle),
        metadata: { linkId },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id, linkId } = await context.params;
  const access = await assertClientAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const linkRef = adminDb.collection("clients").doc(id).collection("links").doc(linkId);
  const linkSnap = await linkRef.get();
  if (!linkSnap.exists) {
    return NextResponse.json({ ok: false, error: "Link inexistente." }, { status: 404 });
  }

  const prev = linkSnap.data() ?? {};
  const prevTitle = String(prev.title ?? "");

  await linkRef.delete();
  await incrementClientCounter(id, "usefulLinksCount", -1);
  await logClientActivity({
    clientId: id,
    action: "link_deleted",
    createdByUserId: actor.uid,
    message: prevTitle,
    metadata: { linkId },
  });

  return NextResponse.json({ ok: true });
}
