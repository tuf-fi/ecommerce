import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

// AES-256-GCM for secrets stored in the database (TOTP seeds), so a leaked database dump alone can't mint login codes.
// Key: TOTP_ENCRYPTION_KEY if set, otherwise derived from JWT_SECRET. Changing either makes existing seeds unreadable.
function key(): Buffer {
  const source = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source) throw new Error("No encryption key configured");
  return createHash("sha256").update(source).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(stored: string): string {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
