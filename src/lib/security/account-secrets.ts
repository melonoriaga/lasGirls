import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

function getSecretKey() {
  const raw = process.env.CLIENT_ACCOUNT_SECRET ?? "";
  if (!raw.trim()) {
    throw new Error("Falta configurar CLIENT_ACCOUNT_SECRET para cifrar cuentas.");
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptAccountPassword(plain: string) {
  if (!plain) return "";
  const key = getSecretKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptAccountPassword(value: string) {
  if (!value) return "";
  if (!value.startsWith("enc:v1:")) return value;
  const key = getSecretKey();
  const [, , ivB64, tagB64, payloadB64] = value.split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(payloadB64, "base64")), decipher.final()]);
  return decrypted.toString("utf8");
}
