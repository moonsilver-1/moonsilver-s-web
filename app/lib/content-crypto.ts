import { createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;

export const ENC_EXT = ".enc";

export function isEncryptedFile(name: string): boolean {
  return name.endsWith(ENC_EXT);
}

export function stripEncExt(name: string): string {
  return isEncryptedFile(name) ? name.slice(0, -ENC_EXT.length) : name;
}

export function decryptBuffer(buf: Buffer): string {
  const secret = process.env.CONTENT_SECRET;
  if (!secret) throw new Error("CONTENT_SECRET is not set");

  const key = Buffer.from(secret, "hex");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);

  const dec = createDecipheriv(ALGORITHM, key, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(data), dec.final()]).toString("utf8");
}
