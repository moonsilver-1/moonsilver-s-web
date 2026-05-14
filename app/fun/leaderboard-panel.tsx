"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/app/components/auth-provider";
import { useSiteLanguage } from "@/app/components/language-provider";
import type { GameKey } from "@/app/lib/leaderboard-store";

type Entry = {
  username: string;
  score: number;
  updatedAt: string;
};

type LeaderboardPanelProps = {
  gameKey: GameKey;
  score: number;
  gameOver?: boolean;
};

export function LeaderboardPanel({ gameKey, score, gameOver = false }: LeaderboardPanelProps) {
  const { language } = useSiteLanguage();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy =
    language === "en"
      ? {
          title: "Leaderboard",
          empty: "No scores yet.",
          submit: "Submit score",
          saved: "Score submitted.",
          signin: "Sign in to submit.",
          unavailable: "Leaderboard is unavailable locally.",
        }
      : {
          title: "排行榜",
          empty: "暂无成绩。",
          submit: "提交分数",
          saved: "分数已提交。",
          signin: "登录后才能提交。",
          unavailable: "本地排行榜暂不可用。",
        };

  const loadLeaderboard = useCallback(async () => {
    const response = await fetch(`/api/leaderboard?gameKey=${gameKey}`, { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { leaderboard?: Entry[] } | null;

    if (response.ok && data?.leaderboard) {
      setEntries(data.leaderboard);
    }
  }, [gameKey]);

  const submitScore = useCallback(async () => {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameKey, score }),
    });
    const data = (await response.json().catch(() => null)) as { leaderboard?: Entry[]; error?: string; saved?: boolean } | null;

    if (response.ok) {
      if (data?.leaderboard) {
        setEntries(data.leaderboard);
      }
      setMessage(data?.saved === false ? copy.unavailable : copy.saved);
    } else {
      setMessage(data?.error || copy.signin);
    }

    setIsSubmitting(false);
  }, [copy.saved, copy.signin, copy.unavailable, gameKey, score]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    if (gameOver && score > 0 && user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void submitScore();
    }
  }, [gameOver, score, submitScore, user]);

  return (
    <section className="mt-8 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{copy.title}</h2>
        <button
          type="button"
          onClick={submitScore}
          disabled={isSubmitting || score <= 0}
          className="rounded-full border border-[var(--app-border)] px-4 py-2 text-xs text-[var(--app-muted)] hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)] disabled:opacity-50"
        >
          {copy.submit}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {entries.length > 0 ? (
          entries.map((entry, index) => (
            <div key={`${entry.username}-${entry.updatedAt}`} className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] px-4 py-3 text-sm">
              <span className="text-[var(--app-muted)]">
                #{index + 1} {entry.username}
              </span>
              <span className="font-semibold">{entry.score.toLocaleString("en-US")}</span>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--app-border)] px-4 py-3 text-sm text-[var(--app-muted)]">{copy.empty}</p>
        )}
      </div>

      {message ? <p className="mt-3 text-sm text-[var(--app-muted)]">{message}</p> : null}
    </section>
  );
}
