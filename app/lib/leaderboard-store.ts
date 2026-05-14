import { neon } from "@neondatabase/serverless";

export type LeaderboardEntry = {
  username: string;
  score: number;
  updatedAt: string;
};

export type GameKey = "2048" | "tetris" | "penalty-shootout";

const GAME_KEYS = new Set<GameKey>(["2048", "tetris", "penalty-shootout"]);

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function sql() {
  return neon(getDatabaseUrl());
}

export function isValidGameKey(gameKey: string): gameKey is GameKey {
  return GAME_KEYS.has(gameKey as GameKey);
}

async function ensureLeaderboardDb() {
  await sql()`
    CREATE TABLE IF NOT EXISTS moon_game_scores (
      game_key TEXT NOT NULL,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (game_key, username)
    )
  `;
}

export async function getLeaderboard(gameKey: string): Promise<LeaderboardEntry[]> {
  if (!hasDatabase()) {
    return [];
  }

  await ensureLeaderboardDb();
  const rows = (await sql()`
    SELECT username, score, updated_at
    FROM moon_game_scores
    WHERE game_key = ${gameKey}
    ORDER BY score DESC, updated_at ASC
    LIMIT 10
  `) as Array<{ username: string; score: number; updated_at: Date | string }>;

  return rows.map((row) => ({
    username: row.username,
    score: row.score,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString(),
  }));
}

export async function submitScore(gameKey: string, username: string, score: number) {
  if (!hasDatabase()) {
    return { saved: false, leaderboard: [] as LeaderboardEntry[] };
  }

  await ensureLeaderboardDb();
  await sql()`
    INSERT INTO moon_game_scores (game_key, username, score, updated_at)
    VALUES (${gameKey}, ${username}, ${score}, NOW())
    ON CONFLICT (game_key, username)
    DO UPDATE SET
      score = GREATEST(moon_game_scores.score, EXCLUDED.score),
      updated_at = CASE
        WHEN EXCLUDED.score > moon_game_scores.score THEN NOW()
        ELSE moon_game_scores.updated_at
      END
  `;

  return {
    saved: true,
    leaderboard: await getLeaderboard(gameKey),
  };
}
