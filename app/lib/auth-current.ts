import { cookies } from "next/headers";
import type { AuthUser } from "@/app/lib/auth-data";
import { AUTH_COOKIE_NAME, verifyAuthSession } from "@/app/lib/auth-token";

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return token ? verifyAuthSession(token) : null;
}
