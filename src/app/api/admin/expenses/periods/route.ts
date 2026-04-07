import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { getCurrentPeriodId } from "@/lib/expenses/periods";
import { listPastPeriodsPage } from "@/lib/expenses/periods-list";

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "8", 10), 1), 30);
  const cursor = (searchParams.get("cursor") ?? "").trim() || null;
  const beforeRaw = (searchParams.get("before") ?? "").trim();
  const before = /^\d{4}-\d{2}$/.test(beforeRaw) ? beforeRaw : getCurrentPeriodId();

  try {
    const { items, nextCursor, hasMore } = await listPastPeriodsPage(adminDb, before, limit, cursor);
    return NextResponse.json({ ok: true, items, nextCursor, hasMore });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
