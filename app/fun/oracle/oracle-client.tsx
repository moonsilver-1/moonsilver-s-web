"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";
import {
  type Answer,
  type GameState,
  handleGuessCorrect,
  handleGuessWrong,
  initGame,
  processAnswer,
  startGame,
} from "./oracle-engine";
import { findUniversityById, filterCompatibleUniversities, questions, universities } from "./oracle-data";

type Copy = {
  title: string;
  subtitle: string;
  intro: string;
  start: string;
  backToFun: string;
  howToPlay: string;
  howToPlayText: string;
  yes: string;
  no: string;
  unsure: string;
  thinking: string;
  myGuess: string;
  isCorrect: string;
  correct: string;
  defeated: string;
  defeatedDesc: string;
  playAgain: string;
  guessAttempt: (count: number) => string;
  stageLabel: (stage: string) => string;
};

function getCopy(language: "zh" | "en"): Copy {
  if (language === "en") {
    return {
      title: "The All-Knowing One",
      subtitle: "Think of a university and the goat will guess it.",
      intro: "",
      start: "Ask the oracle",
      backToFun: "Back to Fun",
      howToPlay: "How it works",
      howToPlayText: "Answer yes, no, or unsure. The oracle keeps asking until it can make a confident guess.",
      yes: "Yes",
      no: "No",
      unsure: "Not sure",
      thinking: "The goat is thinking...",
      myGuess: "I think your university is",
      isCorrect: "Am I close?",
      correct: "I knew it.",
      defeated: "You outsmarted the oracle.",
      defeatedDesc: "I ran out of guesses. Try again and I will listen for different clues.",
      playAgain: "Try again",
      guessAttempt: (count) => `Guess ${count} of 3`,
      stageLabel: (stage) => {
        if (stage === "early") return "Opening";
        if (stage === "mid") return "Mid game";
        if (stage === "late") return "Fine tuning";
        return "Clue";
      },
    };
  }

  return {
    title: "\u77e5\u6653\u4e00\u5207\u4e4b\u4eba",
    subtitle: "\u60f3\u4e00\u6240\u5927\u5b66\uff0cgoat\u4f1a\u628a\u5b83\u731c\u51fa\u6765\u3002",
    intro: "",
    start: "\u5f00\u59cb\u63d0\u95ee",
    backToFun: "\u8fd4\u56de Fun",
    howToPlay: "\u600e\u4e48\u73a9",
    howToPlayText:
      "\u56de\u7b54\u662f\u3001\u4e0d\u662f\u6216\u8005\u4e0d\u786e\u5b9a\u3002\u795e\u8c0d\u4f1a\u4e00\u76f4\u8ffd\u95ee\uff0c\u76f4\u5230\u5b83\u6562\u4e0b\u5224\u65ad\u3002",
    yes: "\u662f",
    no: "\u4e0d\u662f",
    unsure: "\u4e0d\u786e\u5b9a",
    thinking: "\u5c71\u7f8a\u6b63\u5728\u601d\u8003...",
    myGuess: "\u6211\u89c9\u5f97\u4f60\u7684\u5927\u5b66\u662f",
    isCorrect: "\u6211\u731c\u5f97\u5bf9\u5417\uff1f",
    correct: "\u6211\u5c31\u77e5\u9053\u3002",
    defeated: "\u4f60\u628a\u795e\u8c0d\u96be\u4f4f\u4e86\u3002",
    defeatedDesc:
      "\u6211\u5df2\u7ecf\u7528\u5b8c\u4e86\u731c\u6d4b\u6b21\u6570\u3002\u4f60\u53ef\u4ee5\u518d\u6765\u4e00\u5c40\uff0c\u8ba9\u6211\u91cd\u65b0\u542c\u7ebf\u7d22\u3002",
    playAgain: "\u518d\u6765\u4e00\u5c40",
    guessAttempt: (count) => `\u7b2c ${count} \u6b21\u731c\u6d4b`,
    stageLabel: (stage) => {
      if (stage === "early") return "\u5f00\u5c40";
      if (stage === "mid") return "\u4e2d\u6bb5";
      if (stage === "late") return "\u6536\u675f";
      return "\u7ebf\u7d22";
    },
  };
}

function OracleStyles({ isLight }: { isLight: boolean }) {
  const focusGlow = isLight ? "rgba(100,116,255,0.08)" : "rgba(124,140,255,0.10)";

  return (
    <style>{`
      @keyframes oracle-float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-7px); }
      }
      @keyframes oracle-card-in {
        from { opacity: 0; transform: translateY(18px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes oracle-guess-pop {
        from { opacity: 0; transform: scale(0.86) rotateX(12deg); }
        to { opacity: 1; transform: scale(1) rotateX(0); }
      }
      .oracle-shell {
        background: var(--app-bg);
      }
      .oracle-panel {
        background: color-mix(in srgb, var(--app-surface) 84%, transparent);
        backdrop-filter: blur(14px);
      }
      .oracle-card {
        border: 1px solid var(--app-border);
        box-shadow: 0 16px 50px rgba(0, 0, 0, 0.08);
      }
      .oracle-start {
        background: linear-gradient(135deg, var(--app-fg), color-mix(in srgb, var(--app-fg) 76%, #6f7cff));
        color: var(--app-bg);
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.12);
      }
      .oracle-start:hover {
        box-shadow: 0 16px 42px rgba(0, 0, 0, 0.16);
      }
      .oracle-answer-yes {
        background: color-mix(in srgb, #16a34a 84%, var(--app-bg));
        color: white;
      }
      .oracle-answer-no {
        background: color-mix(in srgb, #ef4444 84%, var(--app-bg));
        color: white;
      }
      .oracle-answer-unsure {
        background: color-mix(in srgb, var(--app-muted) 74%, var(--app-bg));
        color: white;
      }
      .oracle-progress {
        background: linear-gradient(90deg, var(--app-fg), var(--app-muted));
      }
      .oracle-focus {
        background: radial-gradient(circle at top, ${focusGlow}, transparent 58%);
      }
      .oracle-float {
        animation: oracle-float 4.2s ease-in-out infinite;
      }
      .oracle-card-in {
        animation: oracle-card-in 0.45s ease-out both;
      }
      .oracle-guess-pop {
        animation: oracle-guess-pop 0.55s ease-out both;
      }
    `}</style>
  );
}

function GoatOracleRow() {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4">
      <GoatSprite variant="think" tone="amber" />
      <GoatSprite variant="read" tone="blue" className="-mb-1 scale-110" />
      <GoatSprite variant="point" tone="green" />
    </div>
  );
}

function GoatSprite({
  variant,
  tone,
  className = "",
}: {
  variant: "think" | "read" | "point";
  tone: "amber" | "blue" | "green";
  className?: string;
}) {
  const colors =
    tone === "amber"
      ? { fur: "#e6c58d", accent: "#9c6a18", glow: "rgba(194,146,33,0.22)" }
      : tone === "blue"
        ? { fur: "#d7e6ff", accent: "#4c67cc", glow: "rgba(91,119,255,0.22)" }
        : { fur: "#d8eed9", accent: "#2b7f4d", glow: "rgba(50,160,104,0.20)" };

  const pose =
    variant === "think"
      ? "translate(2, 2)"
      : variant === "point"
        ? "translate(1, 0)"
        : "translate(0, 0)";

  return (
    <svg
      className={`oracle-float ${className}`}
      viewBox="0 0 120 150"
      width="96"
      height="120"
      aria-hidden="true"
    >
      <defs>
        <filter id={`shadow-${tone}`}>
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor={colors.glow} />
        </filter>
      </defs>
      <g filter={`url(#shadow-${tone})`} transform={pose}>
        <ellipse cx="60" cy="130" rx="28" ry="10" fill="rgba(0,0,0,0.10)" />
        <path d="M38 98c2-24 2-31 22-31s20 7 22 31v11H38z" fill={colors.fur} />
        <path d="M46 40c0 10 6 19 14 19s14-9 14-19-6-17-14-17-14 7-14 17Z" fill={colors.fur} />
        <path d="M41 26c-6-7-10-15-8-20 3-5 11-2 16 5" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
        <path d="M79 26c6-7 10-15 8-20-3-5-11-2-16 5" fill="none" stroke={colors.accent} strokeWidth="4" strokeLinecap="round" />
        <path d="M28 50c7-2 13-4 18-4" fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        <path d="M92 50c-7-2-13-4-18-4" fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        <path d="M51 54c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4Zm18 0c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4Z" fill={colors.accent} />
        <path d="M57 63c2 3 5 3 6 0" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M33 72c8 7 14 10 27 10s21-3 27-10" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
        <path d="M38 101c-9 7-12 20-12 29" fill="none" stroke={colors.accent} strokeWidth="6" strokeLinecap="round" />
        <path d="M82 101c9 7 12 20 12 29" fill="none" stroke={colors.accent} strokeWidth="6" strokeLinecap="round" />
        <path d="M50 99v22" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        <path d="M70 99v22" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        {variant === "think" ? (
          <g transform="translate(82 80)">
            <circle cx="0" cy="0" r="13" fill="rgba(255,255,255,0.42)" />
            <circle cx="0" cy="0" r="7" fill={colors.accent} opacity="0.8" />
          </g>
        ) : null}
        {variant === "read" ? (
          <rect x="18" y="86" width="22" height="16" rx="4" fill="rgba(255,255,255,0.55)" stroke={colors.accent} strokeWidth="2" />
        ) : null}
        {variant === "point" ? (
          <path d="M95 91l14-2 2 8-14 4" fill="rgba(255,255,255,0.48)" stroke={colors.accent} strokeWidth="2" />
        ) : null}
      </g>
    </svg>
  );
}

function GoatOracleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-16 h-56 w-56 -translate-x-1/2 rounded-full bg-[rgba(100,116,255,0.08)] blur-3xl" />
      <div className="absolute left-[-4rem] top-1/3 h-44 w-44 rounded-full bg-[rgba(148,163,184,0.08)] blur-3xl" />
      <div className="absolute right-[-3rem] top-1/2 h-48 w-48 rounded-full bg-[rgba(16,185,129,0.06)] blur-3xl" />
    </div>
  );
}

export function OracleClient() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const isLight = theme === "light";
  const copy = useMemo(() => getCopy(language), [language]);
  const [state, setState] = useState<GameState>(() => initGame());
  const [guessId, setGuessId] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const currentQuestion = useMemo(() => {
    if (!state.currentQuestionId) return null;
    return questions.find((question) => question.id === state.currentQuestionId) ?? null;
  }, [state.currentQuestionId]);

  const ranking = useMemo(() => filterCompatibleUniversities(state.answers), [state.answers]);
  const guessedUniversity = useMemo(() => (guessId ? findUniversityById(guessId) : null), [guessId]);
  const topUniversity = ranking[0] ?? guessedUniversity;
  const questionStage = currentQuestion?.stage ?? "unknown";

  useEffect(() => {
    if (!showThinking) return;
    const timer = window.setTimeout(() => setShowThinking(false), 1300);
    return () => window.clearTimeout(timer);
  }, [showThinking]);

  const universeResources = useMemo(
    () => ({
      universities: universities.map((university) => ({ id: university.id, props: university.props })),
      questions: questions.map((question) => ({
        id: question.id,
        priority: question.priority,
        dimension: question.dimension,
        tags: question.tags,
        sourceId: question.sourceId,
        textZh: question.text.zh,
        textEn: question.text.en,
        exclusiveGroup: question.exclusiveGroup,
        exclusiveValue: question.exclusiveValue,
        mutexAfterPositiveAnswer: question.mutexAfterPositiveAnswer,
      })),
    }),
    [],
  );

  const handleStart = useCallback(() => {
    const started = startGame(universeResources.universities, universeResources.questions);
    setState(started);
    setGuessId(null);
    setShowHowToPlay(false);
  }, [universeResources.questions, universeResources.universities]);

  const handleAnswer = useCallback(
    (answer: Answer) => {
      if (!state.currentQuestionId) return;
      const result = processAnswer(state, answer, universeResources.universities, universeResources.questions);
      setState(result.state);
      setGuessId(result.guessId);
      setShowThinking(result.state.phase === "guessing");
    },
    [state, universeResources.questions, universeResources.universities],
  );

  const handleGuessResponse = useCallback(
    (correct: boolean) => {
      if (correct) {
        setState(handleGuessCorrect(state));
        return;
      }

      const result = handleGuessWrong(state, guessId, universeResources.universities, universeResources.questions);
      setState(result.state);
      setGuessId(result.guessId);
      setShowThinking(result.state.phase === "guessing");
    },
    [guessId, state, universeResources.questions, universeResources.universities],
  );

  const handleRestart = useCallback(() => {
    setState(initGame());
    setGuessId(null);
    setShowThinking(false);
    setShowHowToPlay(false);
  }, []);

  const activeTop = topUniversity ?? null;

  return (
    <div className="oracle-shell min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <OracleStyles isLight={isLight} />
      <GoatOracleBackdrop />

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8">
          <Link
            href="/fun"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/70 px-4 py-2 text-sm text-[var(--app-muted)] backdrop-blur-sm transition-colors hover:text-[var(--app-fg)]"
          >
            <span className="text-base">←</span>
            {copy.backToFun}
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <section className="oracle-card oracle-panel relative overflow-hidden rounded-[30px] p-6 sm:p-8">
            <div className="oracle-focus absolute inset-0 opacity-80" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-[0.26em] text-[var(--app-muted)]">
                Oracle
              </p>
              <h1 className="mt-4 max-w-2xl text-5xl font-bold tracking-tight md:text-7xl">
                {copy.title}
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--app-muted)] md:text-base">
                {copy.subtitle}
              </p>
              {copy.intro ? (
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--app-muted)] sm:text-base">
                  {copy.intro}
                </p>
              ) : null}

              <div className="mt-8 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5">
                <GoatOracleRow />
              </div>
            </div>
          </section>

          <section className="oracle-card oracle-panel relative overflow-hidden rounded-[30px] p-5 sm:p-8">
            <div className="relative">
              {state.phase === "intro" ? (
                <div className="oracle-card-in">
                  <div className="rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-5">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface)]/90">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(124,140,255,0.75),rgba(124,140,255,0.18)_42%,transparent_70%)]" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold tracking-tight">{copy.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--app-muted)]">{copy.subtitle}</p>
                    <button
                      type="button"
                      onClick={handleStart}
                      className="oracle-start mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {copy.start}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowHowToPlay((value) => !value)}
                    className="mx-auto mt-4 block text-sm text-[var(--app-muted)] underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--app-fg)]"
                  >
                    {copy.howToPlay}
                  </button>

                  {showHowToPlay ? (
                    <div className="oracle-card-in mt-4 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-5 text-sm leading-7 text-[var(--app-muted)]">
                      <p>{copy.howToPlayText}</p>
                    </div>
                  ) : null}
                </div>
              ) : state.phase === "playing" && currentQuestion ? (
                <div className="oracle-card-in">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--app-muted)]">
                      {copy.stageLabel(questionStage)}
                    </p>
                    <button
                      type="button"
                      onClick={handleRestart}
                      className="rounded-full border border-[var(--app-border)] px-3 py-2 text-xs uppercase tracking-[0.22em] text-[var(--app-muted)] transition-colors hover:text-[var(--app-fg)]"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--app-surface)]">
                    <div
                      className="oracle-progress h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((state.asked.length / 20) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/65 p-6">
                    <h2 className="mt-0 text-2xl font-semibold leading-snug sm:text-3xl">
                      {language === "en" ? currentQuestion.text.en : currentQuestion.text.zh}
                    </h2>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <button
                      type="button"
                      onClick={() => handleAnswer("yes")}
                      className="oracle-answer-yes rounded-2xl px-4 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {copy.yes}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer("unsure")}
                      className="oracle-answer-unsure rounded-2xl px-4 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {copy.unsure}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAnswer("no")}
                      className="oracle-answer-no rounded-2xl px-4 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {copy.no}
                    </button>
                  </div>
                </div>
              ) : state.phase === "guessing" ? (
                <div className="oracle-card-in">
                  {showThinking ? (
                    <div className="flex min-h-[30rem] flex-col items-center justify-center gap-5 text-center">
                      <div className="oracle-float">
                        <GoatSprite variant="think" tone="amber" className="h-[128px] w-[100px]" />
                      </div>
                      <p className="text-xl font-medium text-[var(--app-muted)]">{copy.thinking}</p>
                    </div>
                  ) : guessedUniversity ? (
                    <div className="oracle-guess-pop flex min-h-[30rem] flex-col items-center justify-center text-center">
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--app-muted)]">
                        {copy.guessAttempt(state.guessCount + 1)}
                      </p>
                      <p className="mt-4 text-sm text-[var(--app-muted)]">{copy.myGuess}</p>

                      <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/68 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.10)]">
                        <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                          {language === "en" ? guessedUniversity.name.en : guessedUniversity.name.zh}
                        </p>
                      </div>

                      <p className="mt-6 text-sm text-[var(--app-muted)]">{copy.isCorrect}</p>
                      <div className="mt-6 flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleGuessResponse(true)}
                          className="oracle-start rounded-2xl px-6 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {copy.yes}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGuessResponse(false)}
                          className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]/55 px-6 py-3 text-base font-semibold text-[var(--app-muted)] transition-colors hover:text-[var(--app-fg)]"
                        >
                          {copy.no}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : state.phase === "result_correct" ? (
                <div className="oracle-card-in flex min-h-[30rem] flex-col items-center justify-center text-center">
                  <div className="text-6xl">🎉</div>
                  <h2 className="mt-5 text-3xl font-semibold">{copy.correct}</h2>
                  {guessedUniversity ? (
                    <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
                      <p className="text-2xl font-semibold">
                        {language === "en" ? guessedUniversity.name.en : guessedUniversity.name.zh}
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="oracle-start mt-7 rounded-2xl px-6 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {copy.playAgain}
                  </button>
                </div>
              ) : state.phase === "defeated" ? (
                <div className="oracle-card-in flex min-h-[30rem] flex-col items-center justify-center text-center">
                  <div className="text-6xl">😵</div>
                  <h2 className="mt-5 text-3xl font-semibold">{copy.defeated}</h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[var(--app-muted)]">
                    {copy.defeatedDesc}
                  </p>
                  {activeTop ? (
                    <div className="mt-6 rounded-[24px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5">
                      <p className="mt-3 text-2xl font-semibold">
                        {language === "en" ? activeTop.name.en : activeTop.name.zh}
                      </p>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="oracle-start mt-7 rounded-2xl px-6 py-3 text-base font-semibold transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {copy.playAgain}
                  </button>
                </div>
              ) : (
                <div className="oracle-card-in flex min-h-[30rem] items-center justify-center text-sm text-[var(--app-muted)]">
                  {copy.start}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
