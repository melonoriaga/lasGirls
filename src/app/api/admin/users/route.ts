import { NextResponse } from "next/server";
import { listMergedTeamUsers } from "@/lib/admin/team-users";
import { getSessionActor } from "@/lib/api/admin-session";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const merged = await listMergedTeamUsers();
  const users = merged.map((u) => ({
    id: u.id,
    fullName: u.fullName ?? "",
    email: u.email ?? "",
    username: u.username ?? "",
    photoURL: u.photoURL ?? "",
  }));

  return NextResponse.json({ ok: true, users });
}
