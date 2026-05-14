import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const TOKEN_LIFETIME_SECONDS = 8 * 60 * 60; // 8 hours
const ALGORITHM = "sha256";

function getSecret(): string {
  const secret = process.env.STORY_TOKEN_SECRET;
  if (!secret) throw new Error("STORY_TOKEN_SECRET is not set");
  return secret;
}

function toBase64Url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

function fromBase64Url(str: string): Buffer {
  return Buffer.from(str, "base64url");
}

export function signToken(): string {
  const payload = JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
    purpose: "story-access",
    nonce: randomBytes(8).toString("hex"),
  });

  const payloadB64 = toBase64Url(Buffer.from(payload, "utf8"));
  const signature = createHmac(ALGORITHM, getSecret()).update(payloadB64).digest();
  const sigB64 = toBase64Url(signature);

  return `${payloadB64}.${sigB64}`;
}

export function verifyToken(token: string): boolean {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return false;

  const payloadB64 = token.slice(0, dotIndex);
  const sigB64 = token.slice(dotIndex + 1);

  const expectedSig = createHmac(ALGORITHM, getSecret()).update(payloadB64).digest();
  const providedSig = fromBase64Url(sigB64);

  if (expectedSig.length !== providedSig.length) return false;

  try {
    if (!timingSafeEqual(expectedSig, providedSig)) return false;
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8"));
    if (payload.purpose !== "story-access") return false;
    if (typeof payload.exp !== "number") return false;
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}
