#!/usr/bin/env node

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function readArg(name, fallback = "") {
  const prefix = `${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const idx = process.argv.findIndex((arg) => arg === name);
  if (idx >= 0) return process.argv[idx + 1] ?? fallback;
  return fallback;
}

const isApply = process.argv.includes("--apply");
const onlyClientId = readArg("--client", "").trim();
const limitRaw = readArg("--limit", "").trim();
const maxTasks = Number.isFinite(Number(limitRaw)) && Number(limitRaw) > 0 ? Number(limitRaw) : null;

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") ?? "";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? "";
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "las-girls";
const useCert = Boolean(privateKey && clientEmail && projectId);

const app =
  getApps()[0] ??
  initializeApp({
    credential: useCert
      ? cert({
          projectId,
          clientEmail,
          privateKey,
        })
      : applicationDefault(),
    projectId,
  });

const db = getFirestore(app);

function normalizeVisibilityScope(value) {
  return value === "private" ? "private" : "team";
}

async function loadClientVisibilityMap() {
  const map = new Map();
  let lastDoc = null;
  while (true) {
    let q = db.collection("clients").orderBy("__name__").limit(400);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const row = doc.data() ?? {};
      const visibilityScope = normalizeVisibilityScope(row.visibilityScope);
      const ownerUserId = typeof row.ownerUserId === "string" ? row.ownerUserId : "";
      map.set(doc.id, { visibilityScope, ownerUserId });
    }
    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
  }
  return map;
}

async function run() {
  console.log(`[migrate-task-visibility] mode=${isApply ? "APPLY" : "DRY-RUN"} project=${projectId}`);
  if (onlyClientId) {
    console.log(`[migrate-task-visibility] filtering clientId=${onlyClientId}`);
  }
  if (maxTasks) {
    console.log(`[migrate-task-visibility] limiting tasks=${maxTasks}`);
  }

  const clientMap = await loadClientVisibilityMap();
  console.log(`[migrate-task-visibility] loaded clients=${clientMap.size}`);

  let scanned = 0;
  let updated = 0;
  let skippedNoClient = 0;
  let unchanged = 0;
  let lastDoc = null;
  const updates = [];

  while (true) {
    let q = db.collection("tasks").orderBy("__name__").limit(300);
    if (lastDoc) q = q.startAfter(lastDoc);
    const snap = await q.get();
    if (snap.empty) break;

    for (const taskDoc of snap.docs) {
      if (maxTasks && scanned >= maxTasks) break;
      scanned += 1;
      const row = taskDoc.data() ?? {};
      const clientId = typeof row.clientId === "string" ? row.clientId.trim() : "";
      if (!clientId || (onlyClientId && clientId !== onlyClientId)) continue;

      const clientMeta = clientMap.get(clientId);
      if (!clientMeta) {
        skippedNoClient += 1;
        continue;
      }

      const currentScope = normalizeVisibilityScope(row.visibilityScope);
      const currentOwner = typeof row.ownerUserId === "string" ? row.ownerUserId : "";
      const nextScope = clientMeta.visibilityScope;
      const nextOwner = clientMeta.ownerUserId;
      const needsUpdate = currentScope !== nextScope || currentOwner !== nextOwner;
      if (!needsUpdate) {
        unchanged += 1;
        continue;
      }

      updated += 1;
      updates.push({
        taskId: taskDoc.id,
        clientId,
        patch: {
          visibilityScope: nextScope,
          ownerUserId: nextOwner,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    lastDoc = snap.docs[snap.docs.length - 1] ?? null;
    if (maxTasks && scanned >= maxTasks) break;
  }

  console.log(
    `[migrate-task-visibility] scanned=${scanned} candidateUpdates=${updated} unchanged=${unchanged} missingClient=${skippedNoClient}`,
  );

  if (!isApply) {
    for (const row of updates.slice(0, 20)) {
      console.log(
        `[dry-run] task=${row.taskId} client=${row.clientId} -> scope=${row.patch.visibilityScope}, owner=${row.patch.ownerUserId || "∅"}`,
      );
    }
    if (updates.length > 20) {
      console.log(`[dry-run] ... and ${updates.length - 20} more`);
    }
    console.log("[dry-run] No writes executed. Run with --apply to persist changes.");
    return;
  }

  let writeCount = 0;
  while (updates.length) {
    const chunk = updates.splice(0, 250);
    const batch = db.batch();
    for (const row of chunk) {
      const globalRef = db.collection("tasks").doc(row.taskId);
      const clientRef = db.collection("clients").doc(row.clientId).collection("tasks").doc(row.taskId);
      batch.set(globalRef, row.patch, { merge: true });
      batch.set(clientRef, row.patch, { merge: true });
      writeCount += 2;
    }
    await batch.commit();
    console.log(`[apply] committed chunk size=${chunk.length}`);
  }

  console.log(`[apply] done. updatedTasks=${updated} totalWrites=${writeCount}`);
}

run().catch((error) => {
  console.error("[migrate-task-visibility] failed:", error);
  process.exitCode = 1;
});
