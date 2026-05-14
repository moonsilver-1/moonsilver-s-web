import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser, StoredUser } from "@/app/lib/auth-data";
import { toAuthUser } from "@/app/lib/auth-data";

const ALGORITHM = "sha256";
const SESSION_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

export const AUTH_COOKIE_NAME = "moon_auth_session";

function getSecret() {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.STORY_TOKEN_SECRET || process.env.CONTENT_SECRET;
  if (!secret) throw new Error("AUTH_SESSION_SECRET is not set");
  return secret;
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export function signAuthSession(user: StoredUser): string {
  const payload = JSON.stringify({
    ...toAuthUser(user),
    exp: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
  });

  const payloadB64 = toBase64Url(payload);
  const signature = createHmac(ALGORITHM, getSecret()).update(payloadB64).digest();
  return `${payloadB64}.${toBase64Url(signature)}`;
}

export function verifyAuthSession(token: string): AuthUser | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payloadB64 = token.slice(0, dotIndex);
  const sigB64 = token.slice(dotIndex + 1);
  const expected = createHmac(ALGORITHM, getSecret()).update(payloadB64).digest();
  const provided = fromBase64Url(sigB64);

  if (expected.length !== provided.length) return null;
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64).toString("utf8")) as AuthUser & { exp?: unknown };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.username || payload.status !== "approved") return null;
    return {
      username: payload.username,
      isAdmin: Boolean(payload.isAdmin),
      status: payload.status,
    };
  } catch {
    return null;
  }
}
