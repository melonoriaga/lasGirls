import type { DocumentData } from "firebase-admin/firestore";
import { DocumentReference, GeoPoint, Timestamp } from "firebase-admin/firestore";

/** Convierte valores típicos de Firestore Admin SDK a JSON seguro (sin romper Response.json). */
export function firestoreToJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (t === "bigint") return (value as bigint).toString();
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof DocumentReference) return { __firestoreRef: value.path };
  if (value instanceof GeoPoint) return { latitude: value.latitude, longitude: value.longitude };
  if (Array.isArray(value)) return value.map(firestoreToJson);
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = firestoreToJson(v);
    }
    return out;
  }
  return value;
}

export function firestoreDocToJson(docId: string, data: DocumentData | undefined): Record<string, unknown> {
  const converted = firestoreToJson(data ?? {}) as Record<string, unknown>;
  return { ...converted, id: docId };
}
