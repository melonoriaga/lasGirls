import { adminDb } from "@/lib/firebase/admin";
import type { PartnerLogoPublic } from "@/lib/partner-logos/types";

export async function getPublicPartnerLogos(): Promise<PartnerLogoPublic[]> {
  const snap = await adminDb.collection("partnerLogos").orderBy("sortOrder", "asc").get();
  return snap.docs
    .map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        imageUrl: String(d.imageUrl ?? "").trim(),
        linkUrl: String(d.linkUrl ?? "").trim(),
        enabled: d.enabled !== false,
      };
    })
    .filter((row) => row.enabled && row.imageUrl)
    .map(({ id, imageUrl, linkUrl }) => ({ id, imageUrl, linkUrl }));
}
