import { NextResponse } from "next/server";
import { getCurrentAuthUser } from "@/app/lib/auth-current";
import { getLeaderboard, isValidGameKey, submitScore } from "@/app/lib/leaderboard-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScoreBody = {
  gameKey?: unknown;
  score?: unknown;
};

function readGameKey(request: Request) {
  const { searchParams } = new URL(request.url);
  return searchParams.get("gameKey") || "";
}

export async function GET(request: Request) {
  const gameKey = readGameKey(request);
  if (!isValidGameKey(gameKey)) {
    return NextResponse.json({ error: "Invalid game key." }, { status: 400 });
  }

  return NextResponse.json({ leaderboard: await getLeaderboard(gameKey) });
}

export async function POST(request: Request) {
  const user = await getCurrentAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in before submitting scores." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ScoreBody | null;
  const gameKey = typeof body?.gameKey === "string" ? body.gameKey : "";
  const score = typeof body?.score === "number" ? Math.floor(body.score) : NaN;

  if (!isValidGameKey(gameKey)) {
    return NextResponse.json({ error: "Invalid game key." }, { status: 400 });
  }

  if (!Number.isFinite(score) || score <= 0) {
    return NextResponse.json({ error: "Score must be positive." }, { status: 400 });
  }

  const result = await submitScore(gameKey, user.username, score);
  return NextResponse.json(result);
}
