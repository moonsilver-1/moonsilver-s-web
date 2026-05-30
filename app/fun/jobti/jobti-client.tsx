"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  careerTypes,
  getAbilityById,
  normalizedQuestions,
} from "@/app/fun/jobti/jobti-data";
import { calculateJobtiResult, createEmptyAnswers } from "@/app/fun/jobti/jobti-engine";
import { useSiteLanguage } from "@/app/components/language-provider";

const answerOptions = {
  zh: [
    { value: 1, label: "左侧非常符合" },
    { value: 2, label: "左侧符合" },
    { value: 3, label: "无感" },
    { value: 4, label: "右侧符合" },
    { value: 5, label: "右侧非常符合" },
  ],
  en: [
    { value: 1, label: "Much closer to left" },
    { value: 2, label: "Closer to left" },
    { value: 3, label: "Neutral" },
    { value: 4, label: "Closer to right" },
    { value: 5, label: "Much closer to right" },
  ],
} as const;

function SectionLabel({ children }: { children: string }) {
  return <span className="block text-xs font-medium uppercase tracking-[0.25em] text-white/30">{children}</span>;
}

function getDimensionLabel(dimension: string, language: "zh" | "en") {
  const map: Record<string, { zh: string; en: string }> = {
    AR: { zh: "创意表达 / 规则构建", en: "Creative Expression / Rule Building" },
    PD: { zh: "人群协同 / 数据驱动", en: "People Coordination / Data Driven" },
    XS: { zh: "探索开拓 / 稳定落地", en: "Exploration / Stable Delivery" },
    LM: { zh: "统筹主导 / 专精深耕", en: "Leadership / Deep Specialization" },
  };

  return map[dimension]?.[language] ?? dimension;
}

export function JobtiClient() {
  const { language } = useSiteLanguage();
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(createEmptyAnswers);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const copy = {
    zh: {
      label: "Entertainment",
      title: "Jobti",
      intro: "一个轻量的职业向量小游戏。答完题后会生成类型结果和岗位匹配。",
      start: "开始体验",
      backToFun: "返回娱乐页",
      stepHelp: "下面两种描述里，选择更接近你真实状态的一项。结果会在全部答完后统一生成。",
      backIntro: "返回介绍",
      previous: "上一题",
      next: "下一题",
      result: "查看结果",
      answerLeft: "左侧",
      answerRight: "右侧",
      resultLabel: "Result",
      matches: "Matches",
      detail: "Detail",
      abilities: "Core Abilities",
      education: "Education Hint",
      profile: "Profile",
      whyFit: "Why It Fits",
      restart: "再测一次",
      backToFunEnd: "返回娱乐页",
      stage: "阶段",
      primaryCode: "主代码",
      domain: "领域",
      fitScore: "匹配分",
      fitTag: "fit",
      questionPrefix: (index: number, total: number) => `${index} / ${total}`,
      resultIntro: "你的结果代码是",
      resultIntroTail: "当前岗位主代码是",
      resultExplain: "匹配分同时参考了类型代码、四维向量距离和岗位排序权重。",
      questionIntro: "下面两种描述里，选择更接近你真实状态的一项。结果会在全部答完后统一生成。",
      unlocked: "内容持续更新中",
    },
    en: {
      label: "Entertainment",
      title: "Jobti",
      intro: "A lightweight career-vector mini game. After you finish, it generates a type result and job matches.",
      start: "Start",
      backToFun: "Back to fun",
      stepHelp: "Choose the option that feels closer to your real state. The result will be generated after all questions are answered.",
      backIntro: "Back to intro",
      previous: "Previous",
      next: "Next",
      result: "See result",
      answerLeft: "Left side",
      answerRight: "Right side",
      resultLabel: "Result",
      matches: "Matches",
      detail: "Detail",
      abilities: "Core Abilities",
      education: "Education Hint",
      profile: "Profile",
      whyFit: "Why It Fits",
      restart: "Try again",
      backToFunEnd: "Back to fun",
      stage: "Stage",
      primaryCode: "Primary Code",
      domain: "Domain",
      fitScore: "Fit Score",
      fitTag: "fit",
      questionPrefix: (index: number, total: number) => `${index} / ${total}`,
      resultIntro: "Your result code is",
      resultIntroTail: "and the current job primary code is",
      resultExplain: "The match score also considers the type code, 4D vector distance, and ranking weight.",
      questionIntro: "Choose the description that is closer to your real state. The result will be generated after all questions are answered.",
      unlocked: "Content keeps growing",
    },
  }[language];

  const result = useMemo(() => calculateJobtiResult(answers), [answers]);
  const currentQuestion = normalizedQuestions[currentIndex];
  const currentValue = currentQuestion ? answers[currentIndex] : null;
  const answeredCount = answers.filter((value) => value !== null).length;
  const completed = answeredCount === normalizedQuestions.length;
  const activeMatch = result.jobs.find((match) => match.job.job_id === selectedJobId) ?? result.jobs[0] ?? null;

  function handleStart() {
    setStarted(true);
    setCurrentIndex(0);
  }

  function handleRestart() {
    setStarted(false);
    setCurrentIndex(0);
    setSelectedJobId(null);
    setAnswers(createEmptyAnswers());
  }

  function handleAnswer(value: number) {
    setAnswers((current) => {
      const next = [...current];
      next[currentIndex] = value;
      return next;
    });
  }

  function handlePrevious() {
    if (currentIndex === 0) {
      setStarted(false);
      return;
    }

    setCurrentIndex((value) => value - 1);
  }

  function handleNext() {
    if (currentValue === null) {
      return;
    }

    if (currentIndex < normalizedQuestions.length - 1) {
      setCurrentIndex((value) => value + 1);
    }
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-black pt-20 text-white page-enter">
        <section className="mx-auto max-w-4xl px-6 py-24">
          <div className="mb-10 space-y-3">
            <Link href="/fun" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white hover:shadow-sm">
              {copy.backToFun}
            </Link>
            <SectionLabel>{copy.label}</SectionLabel>
          </div>

          <h1 className="mt-4 text-4xl font-bold md:text-5xl">{copy.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/40">{copy.intro}</p>

          <div className="mt-16 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="magnetic-btn rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-medium text-black transition-all duration-200 hover:bg-white/90 hover:shadow-lg active:scale-95"
            >
              {copy.start}
            </button>
            <Link href="/fun" className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white hover:shadow-sm">
              {copy.backToFun}
            </Link>
          </div>
        </section>

      </div>
    );
  }

  if (!completed && currentQuestion) {
    const progress = Math.round(((currentIndex + 1) / normalizedQuestions.length) * 100);

    return (
      <div className="min-h-screen bg-black pt-20 text-white page-enter">
        <section className="mx-auto max-w-4xl px-6 py-24">
          <div className="mb-12 space-y-3">
            <Link href="/fun" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white hover:shadow-sm">
              {copy.backToFun}
            </Link>
            <SectionLabel>{copy.label}</SectionLabel>
          </div>

          <div className="mb-12">
            <div className="mt-4 flex items-end justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold md:text-5xl">{copy.questionPrefix(currentIndex + 1, normalizedQuestions.length)}</h1>
                <p className="mt-3 text-sm text-white/40">{getDimensionLabel(currentQuestion.dimension, language)}</p>
              </div>
              <p className="text-sm text-white/30">{progress}%</p>
            </div>
            <div className="mt-5 h-px bg-white/10">
              <div className="h-px bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-8 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30">{currentQuestion.question_id}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/40">{copy.questionIntro}</p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/8 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.answerLeft}</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">{currentQuestion.left_text}</h2>
              </div>
              <div className="rounded-2xl border border-white/8 p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.answerRight}</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">{currentQuestion.right_text}</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              {answerOptions[language].map((option) => {
                const active = currentValue === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleAnswer(option.value)}
                    className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-colors ${
                      active ? "border-white/30 bg-white/[0.08] text-white" : "border-white/8 bg-transparent text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span className="text-sm">{option.label}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-white/30">{option.value}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                {currentIndex === 0 ? copy.backIntro : copy.previous}
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentValue === null}
                className="rounded-full border border-white/15 bg-white px-5 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {currentIndex === normalizedQuestions.length - 1 ? copy.result : copy.next}
              </button>
            </div>
          </div>
        </section>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20 text-white page-enter">
      <section className="mx-auto max-w-4xl px-6 py-24">
        <div className="mb-10 space-y-3">
          <Link href="/fun" className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition-all duration-300 hover:border-white/20 hover:text-white hover:shadow-sm">
            {copy.backToFunEnd}
          </Link>
          <SectionLabel>{copy.resultLabel}</SectionLabel>
        </div>

        <div className="mt-4">
          <h1 className="text-4xl font-bold md:text-5xl">
            {result.careerType.career_code} · {result.careerType.type_name}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/40">{result.careerType.summary}</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/30">{result.careerType.fit_scenes}</p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-4">
          {result.dimensions.map((dimension) => (
            <div key={dimension.dimension} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">{dimension.dimension}</p>
              <p className="mt-3 text-2xl font-semibold text-white">{dimension.normalized}</p>
              <p className="mt-2 text-sm text-white/40">
                {dimension.leftLetter} / {dimension.rightLetter}
              </p>
              <div className="mt-4 h-px bg-white/10">
                <div className="h-px bg-white" style={{ width: `${dimension.normalized}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>{copy.matches}</SectionLabel>
            <div className="mt-6 space-y-3">
              {result.jobs.map((match, index) => {
                const active = activeMatch?.job.job_id === match.job.job_id;

                return (
                  <button
                    key={match.job.job_id}
                    type="button"
                    onClick={() => setSelectedJobId(match.job.job_id)}
                    className={`w-full rounded-2xl border px-5 py-4 text-left transition-colors ${
                      active ? "border-white/25 bg-white/[0.04]" : "border-white/8 bg-transparent hover:border-white/20 hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/30">{String(index + 1).padStart(2, "0")}</p>
                        <p className="mt-2 text-base font-medium text-white">{match.job.job_display_name}</p>
                        <p className="mt-1 text-sm text-white/40">
                          {match.job.job_family} · {match.job.career_stage}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-white">{match.fitScore}</p>
                        <p className="text-xs text-white/30">{copy.fitTag}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <SectionLabel>{copy.detail}</SectionLabel>
            <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.02] p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-white/30">{activeMatch?.job.domain}</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">{activeMatch?.job.job_display_name}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/40">{activeMatch?.job.job_summary}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/30">{activeMatch?.job.family_desc}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/8 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.abilities}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(activeMatch?.job.coreAbilityIds ?? []).map((abilityId) => (
                      <span key={abilityId} className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/60">
                        {getAbilityById(abilityId)?.ability_name ?? abilityId}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.education}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/40">{activeMatch?.job.education_hint}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/8 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.profile}</p>
                  <div className="mt-4 space-y-2 text-sm text-white/40">
                    <p>
                      {copy.stage}: {activeMatch?.job.career_stage}
                    </p>
                    <p>
                      {copy.primaryCode}: {activeMatch?.job.primary_code}
                    </p>
                    <p>
                      {copy.domain}: {activeMatch?.job.domain}
                    </p>
                    <p>
                      {copy.fitScore}: {activeMatch?.fitScore}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">{copy.whyFit}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/40">
                    {copy.resultIntro} {result.careerType.career_code} {copy.resultIntroTail} {activeMatch?.job.primary_code}.{" "}
                    {copy.resultExplain}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionLabel>{copy.abilities}</SectionLabel>
            <div className="mt-6 space-y-3">
              {result.topAbilities.map((ability) => (
                <div key={ability.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-base font-medium text-white">{ability.name}</p>
                    <span className="text-sm text-white/30">× {ability.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Type Map</SectionLabel>
            <div className="mt-6 space-y-3">
              {careerTypes.map((type) => (
                <div
                  key={type.career_code}
                  className={`rounded-2xl border px-5 py-4 ${
                    type.career_code === result.careerType.career_code ? "border-white/25 bg-white/[0.04]" : "border-white/8 bg-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/30">{type.career_code}</p>
                      <p className="mt-2 text-base font-medium text-white">{type.type_name}</p>
                    </div>
                    <span className="text-sm text-white/30">{type.job_count_primary}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-white/40">{type.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-full border border-white/15 bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            {copy.restart}
          </button>
          <Link href="/fun" className="rounded-full border border-white/10 px-6 py-3 text-sm text-white/60 transition-colors hover:border-white/20 hover:text-white">
            {copy.backToFunEnd}
          </Link>
        </div>
      </section>
    </div>
  );
}
