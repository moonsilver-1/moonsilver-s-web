import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX = "pbkdf2";
const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${PREFIX}:${ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  if (!stored.startsWith(`${PREFIX}:`)) {
    return password === stored;
  }

  const [, iterationsRaw, salt, hash] = stored.split(":");
  const iterations = Number(iterationsRaw);
  if (!iterations || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
