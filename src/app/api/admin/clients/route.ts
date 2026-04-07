import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { adminDb } from "@/lib/firebase/admin";
import { getClientDisplayName } from "@/types/client";

const MAX_SCAN = 350;

function rowMatchesQuery(
  row: Record<string, unknown>,
  q: string,
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const name = String(getClientDisplayName(row as Parameters<typeof getClientDisplayName>[0]) ?? "").toLowerCase();
  const email = String(row.email ?? "").toLowerCase();
  const company = String(row.company ?? "").toLowerCase();
  const brand = String(row.brandName ?? "").toLowerCase();
  return name.includes(needle) || email.includes(needle) || company.includes(needle) || brand.includes(needle);
}

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "10", 10), 1), 50);
  const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10), 1);
  const q = (searchParams.get("q") ?? "").trim();
  const scope = searchParams.get("scope") === "mine" ? "mine" : "all";

  try {
    const snapshot = await adminDb.collection("clients").orderBy("createdAt", "desc").limit(MAX_SCAN).get();
    const base = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>);
    const visible = base.filter((row) => canAccessRecord(row, actor.uid));
    const scopeFiltered = scope === "mine" ? visible.filter((row) => String(row.ownerUserId ?? "") === actor.uid) : visible;
    const filtered = q ? scopeFiltered.filter((row) => rowMatchesQuery(row, q)) : scopeFiltered;

    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * limit;

    const slice = filtered.slice(startIndex, startIndex + limit);
    const hasPrev = startIndex > 0;
    const hasNext = startIndex + limit < filtered.length;

    return NextResponse.json({
      ok: true,
      searchMode: Boolean(q),
      items: slice,
      hasNext,
      hasPrev,
      page: safePage,
      totalPages,
      totalItems,
      nextStartAfterId: hasNext && slice.length ? String(slice[slice.length - 1].id) : null,
      prevEndBeforeId: hasPrev && slice.length ? String(slice[0].id) : null,
      firstId: slice.length ? String(slice[0].id) : null,
      lastId: slice.length ? String(slice[slice.length - 1].id) : null,
      scanCapped: snapshot.size >= MAX_SCAN,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
