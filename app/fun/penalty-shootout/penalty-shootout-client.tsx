"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode, type ThemeMode } from "@/app/lib/use-theme-mode";
import { LeaderboardPanel } from "@/app/fun/leaderboard-panel";
import { GameOver } from "@/app/fun/penalty-shootout-game-development/src/components/GameOver";
import { Menu } from "@/app/fun/penalty-shootout-game-development/src/components/Menu";
import { Pitch, PITCH_W } from "@/app/fun/penalty-shootout-game-development/src/components/Pitch";
import { PowerMeter } from "@/app/fun/penalty-shootout-game-development/src/components/PowerMeter";
import { ScoreBoard } from "@/app/fun/penalty-shootout-game-development/src/components/ScoreBoard";
import { useGameState } from "@/app/fun/penalty-shootout-game-development/src/hooks/useGameState";

function getPageClass(theme: ThemeMode) {
  return theme === "light"
    ? "bg-[radial-gradient(circle_at_top_right,rgba(24,21,19,0.07),transparent_28%),linear-gradient(180deg,#f5f1e8_0%,#efe8db_55%,#f5f1e8_100%)]"
    : "bg-[radial-gradient(circle_at_top_right,rgba(120,160,255,0.12),transparent_28%),linear-gradient(180deg,#050505_0%,#090909_55%,#050505_100%)]";
}

function getSurface(theme: ThemeMode, alpha = 0.72) {
  return theme === "light" ? `rgba(255,255,255,${alpha})` : `rgba(255,255,255,0.04)`;
}

export function PenaltyShootoutClient() {
  const theme = useThemeMode();
  const { language } = useSiteLanguage();
  const { state, shoot, startGame, nextRound, goToMenu, setAim } = useGameState();
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const pitchScale = useMemo(() => {
    if (!viewportWidth) {
      return 1;
    }

    return Math.max(0.5, Math.min(1, (viewportWidth - 56) / PITCH_W));
  }, [viewportWidth]);

  const showPowerMeter =
    state.phase === "shooting" || state.phase === "ball_flying" || state.phase === "result";
  const isPowerLocked = state.phase !== "shooting" || !state.isPlayerTurn;
  const pageClass = getPageClass(theme);
  const surface = getSurface(theme, 0.72);

  const copy =
    language === "en"
      ? {
          back: "Back to Fun",
          label: "Mini game",
          title: "Penalty Shootout",
          intro: "A compact football game embedded in the Fun section. Aim, shoot, and try to outsmart the keeper.",
          detail: "It reuses the existing game state and stays aligned with the site theme.",
          hint: "Best on mouse or touch. The pitch scales down on smaller screens.",
        }
      : {
          back: "返回 Fun",
          label: "小游戏",
          title: "点球大战",
          intro: "把点球小游戏嵌进 Fun 里，瞄准、射门、试着骗过门将。",
          detail: "复用现有游戏状态，外层样式保持和站点主题一致。",
          hint: "鼠标和触控都能玩，手机上球场会自动缩小。",
        };

  return (
    <div className={`min-h-screen pt-20 text-[var(--app-fg)] transition-colors duration-300 ${pageClass}`}>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="max-w-xl">
          <Link
            href="/fun"
            className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            {copy.back}
          </Link>

          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-[var(--app-muted)]">{copy.label}</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">{copy.title}</h1>
          <p className="mt-6 text-sm leading-7 text-[var(--app-muted)] md:text-base">{copy.intro}</p>
          <p className="mt-4 text-sm leading-7 text-[var(--app-muted)]">{copy.detail}</p>

          <div className="mt-8 rounded-[28px] border border-[var(--app-border)] p-5" style={{ backgroundColor: surface }}>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{copy.hint}</p>
            <div className="mt-4 grid gap-3 text-sm text-[var(--app-muted)] sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--app-border)] px-4 py-3">Tap or move to aim</div>
              <div className="rounded-2xl border border-[var(--app-border)] px-4 py-3">Click or tap to shoot</div>
              <div className="rounded-2xl border border-[var(--app-border)] px-4 py-3">Five rounds plus sudden death</div>
              <div className="rounded-2xl border border-[var(--app-border)] px-4 py-3">Built to match the Fun section</div>
            </div>
          </div>

          <LeaderboardPanel gameKey="penalty-shootout" score={state.playerScore} gameOver={state.phase === "game_over"} />
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[36px] bg-[radial-gradient(circle,rgba(120,160,255,0.12),transparent_60%)] blur-2xl" />
          <div
            className="relative overflow-hidden rounded-[34px] border border-[var(--app-border)] p-4 md:p-6"
            style={{ backgroundColor: surface, boxShadow: "0 30px 80px rgba(0,0,0,0.18)" }}
          >
            {state.phase === "menu" ? (
              <div className="flex justify-center">
                <Menu onStart={startGame} />
              </div>
            ) : null}

            {state.phase === "game_over" ? (
              <div className="flex justify-center">
                <GameOver
                  playerScore={state.playerScore}
                  cpuScore={state.cpuScore}
                  roundHistory={state.roundHistory}
                  onPlayAgain={startGame}
                  onMenu={goToMenu}
                  isSuddenDeath={state.isSuddenDeath}
                />
              </div>
            ) : null}

            {state.phase === "shooting" ||
            state.phase === "ball_flying" ||
            state.phase === "result" ||
            state.phase === "round_end" ? (
              <div className="flex flex-col items-center gap-6 xl:flex-row xl:items-start xl:justify-center">
                {showPowerMeter && state.isPlayerTurn ? (
                  <div className="pt-2 xl:pt-8">
                    <PowerMeter power={state.power} locked={isPowerLocked} />
                  </div>
                ) : null}

                <div className="flex w-full flex-col items-center gap-5">
                  <ScoreBoard
                    playerScore={state.playerScore}
                    cpuScore={state.cpuScore}
                    currentRound={state.currentRound}
                    maxRounds={state.maxRounds}
                    isSuddenDeath={state.isSuddenDeath}
                    roundHistory={state.roundHistory}
                    isPlayerTurn={state.isPlayerTurn}
                  />

                  <div className="flex w-full justify-center overflow-hidden">
                    <Pitch
                      phase={state.phase}
                      aimX={state.aimX}
                      aimY={state.aimY}
                      ballX={state.ballX}
                      ballY={state.ballY}
                      ballAnimating={state.ballAnimating}
                      goalkeeperDive={state.goalkeeperDive}
                      shotResult={state.shotResult}
                      showResultText={state.showResultText}
                      isPlayerTurn={state.isPlayerTurn}
                      onAimMove={setAim}
                      onShoot={shoot}
                      scale={pitchScale}
                    />
                  </div>
                </div>

                {showPowerMeter && state.isPlayerTurn ? <div className="hidden xl:block xl:w-14" /> : null}
              </div>
            ) : null}

            {state.phase === "round_end" ? (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={nextRound}
                  className="rounded-full bg-[var(--app-fg)] px-5 py-3 text-sm font-semibold text-[var(--app-bg)] transition-opacity hover:opacity-90"
                >
                  Next Round
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
