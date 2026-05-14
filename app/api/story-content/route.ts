import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/story-token";
import { getAllStories } from "@/app/lib/story-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const token = authHeader.slice(7);

  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
  }

  const stories = await getAllStories();

  return NextResponse.json(
    { stories },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } },
  );
}
