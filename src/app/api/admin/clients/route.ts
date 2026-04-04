import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
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
  const startAfterId = searchParams.get("startAfterId");
  const endBeforeId = searchParams.get("endBeforeId");
  const q = (searchParams.get("q") ?? "").trim();

  try {
    if (q) {
      const snapshot = await adminDb.collection("clients").orderBy("createdAt", "desc").limit(MAX_SCAN).get();
      const flat = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, unknown>);
      const filtered = flat.filter((row) => rowMatchesQuery(row, q));
      const slice = filtered.slice(0, limit);
      return NextResponse.json({
        ok: true,
        searchMode: true,
        items: slice,
        hasNext: filtered.length > limit,
        hasPrev: false,
        nextStartAfterId: null as string | null,
        firstId: slice.length ? String(slice[0].id) : null,
        lastId: slice.length ? String(slice[slice.length - 1].id) : null,
        scanCapped: snapshot.size >= MAX_SCAN,
      });
    }

    const collection = adminDb.collection("clients").orderBy("createdAt", "desc");

    if (endBeforeId) {
      const cursorDoc = await adminDb.collection("clients").doc(endBeforeId).get();
      if (!cursorDoc.exists) {
        return NextResponse.json({ ok: false, error: "Cursor inválido." }, { status: 400 });
      }
      const snapshot = await collection.endBefore(cursorDoc).limitToLast(limit).get();
      const docs = snapshot.docs;
      const items = docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({
        ok: true,
        searchMode: false,
        items,
        hasNext: true,
        hasPrev: docs.length === limit,
        nextStartAfterId: null,
        prevEndBeforeId: items.length ? String(items[0].id) : null,
        firstId: items.length ? String(items[0].id) : null,
        lastId: items.length ? String(items[items.length - 1].id) : null,
      });
    }

    let snapshot;
    if (startAfterId) {
      const cursorDoc = await adminDb.collection("clients").doc(startAfterId).get();
      if (!cursorDoc.exists) {
        return NextResponse.json({ ok: false, error: "Cursor inválido." }, { status: 400 });
      }
      snapshot = await collection.startAfter(cursorDoc).limit(limit + 1).get();
    } else {
      snapshot = await collection.limit(limit + 1).get();
    }
    const docs = snapshot.docs;
    const hasNext = docs.length > limit;
    const pageDocs = hasNext ? docs.slice(0, limit) : docs;
    const items = pageDocs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({
      ok: true,
      searchMode: false,
      items,
      hasNext,
      hasPrev: Boolean(startAfterId),
      nextStartAfterId: hasNext && items.length ? String(items[items.length - 1].id) : null,
      prevEndBeforeId: items.length ? String(items[0].id) : null,
      firstId: items.length ? String(items[0].id) : null,
      lastId: items.length ? String(items[items.length - 1].id) : null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
