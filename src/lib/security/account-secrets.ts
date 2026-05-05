import { createDecipheriv, createHash } from "node:crypto";

/** Solo para contraseñas legacy guardadas como `enc:v1:…`. */
function getSecretKeyForLegacyDecrypt() {
  const raw = process.env.CLIENT_ACCOUNT_SECRET ?? "";
  if (!raw.trim()) {
    throw new Error("Falta CLIENT_ACCOUNT_SECRET para descifrar contraseñas en formato antiguo.");
  }
  return createHash("sha256").update(raw).digest();
}

function decryptLegacyEncV1(value: string): string {
  const key = getSecretKeyForLegacyDecrypt();
  const [, , ivB64, tagB64, payloadB64] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payloadB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Valor tal como está en Firestore → texto para la API.
 * Las contraseñas nuevas se guardan como string plano; los valores `enc:v1:` antiguos se descifran si hay secret.
 */
export function storedPasswordToPlain(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith("enc:v1:")) return stored;
  try {
    return decryptLegacyEncV1(stored);
  } catch {
    return "";
  }
}
