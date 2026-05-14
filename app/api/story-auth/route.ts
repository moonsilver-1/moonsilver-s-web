import { NextResponse } from "next/server";
import { signToken } from "@/app/lib/story-token";

export const runtime = "nodejs";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

type AuthBody = {
  password?: unknown;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();

  const entry = attempts.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    entry.count++;
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  const body = (await request.json().catch(() => null)) as AuthBody | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password.trim() : "";

  const storyPassword = process.env.STORY_PASSWORD;
  if (!storyPassword) {
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  if (password.toUpperCase() !== storyPassword.toUpperCase()) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  attempts.delete(ip);

  const token = signToken();

  return NextResponse.json({ token });
}
