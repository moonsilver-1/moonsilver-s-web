"use client";

import { useState, useEffect, useRef } from "react";
import type React from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useScene } from "@/app/components/scene-provider";
import type { SceneKey } from "@/app/lib/scene-config";

function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

type LocaleText = {
  zh: string;
  en: string;
};

type Award = {
  title: LocaleText;
  sub: LocaleText;
};

type Contest = {
  level: "outstanding-winner" | "provincial-1" | "regional-2" | "provincial-2" | "bronze" | "provincial-3";
  award: LocaleText;
  name: LocaleText;
};

type ResearchItem = {
  title: LocaleText;
  desc: LocaleText;
};

const awards: Award[] = [
  {
    title: { zh: "一等奖学金", en: "First-class Scholarship" },
    sub: { zh: "杭州电子科技大学", en: "Hangzhou Dianzi University" },
  },
  {
    title: { zh: "浙江省政府奖学金", en: "Provincial Government Scholarship" },
    sub: { zh: "浙江省人民政府", en: "People's Government of Zhejiang Province" },
  },
  {
    title: { zh: "三好学生", en: "Outstanding Student" },
    sub: { zh: "杭州电子科技大学", en: "Hangzhou Dianzi University" },
  },
  {
    title: { zh: "优秀共青团员", en: "Excellent CYL Member" },
    sub: { zh: "共青团组织", en: "Communist Youth League" },
  },
];

const contests: Contest[] = [
  {
    level: "outstanding-winner",
    award: { zh: "特等奖（O奖）", en: "Outstanding Winner" },
    name: { zh: "美国大学生数学建模竞赛", en: "Mathematical Contest in Modeling (MCM/ICM)" },
  },
  {
    level: "provincial-1",
    award: { zh: "省级一等奖", en: "Provincial 1st Prize" },
    name: { zh: "全国大学生数学建模竞赛", en: "National College Students Mathematical Modeling Contest" },
  },
  {
    level: "regional-2",
    award: { zh: "区域二等奖", en: "Regional 2nd Prize" },
    name: { zh: "全国大学生服务外包创新创业大赛（华东区域）", en: "National Service Outsourcing Innovation & Entrepreneurship Competition (Eastern Region)" },
  },
  {
    level: "provincial-2",
    award: { zh: "省级二等奖", en: "Provincial 2nd Prize" },
    name: { zh: "浙江省服务外包创新应用大赛", en: "Zhejiang Service Outsourcing Innovation Contest" },
  },
  {
    level: "provincial-2",
    award: { zh: "省级二等奖", en: "Provincial 2nd Prize" },
    name: { zh: "中国大学生计算机设计大赛", en: "China College Students Computer Design Competition" },
  },
  {
    level: "bronze",
    award: { zh: "省级铜奖", en: "Provincial Bronze" },
    name: { zh: "挑战杯“人工智能+”专项赛", en: "Challenge Cup AI+ Special Track" },
  },
  {
    level: "provincial-3",
    award: { zh: "省级三等奖", en: "Provincial 3rd Prize" },
    name: { zh: "浙江省人工智能竞赛", en: "Zhejiang Artificial Intelligence Contest" },
  },
];

const research: ResearchItem[] = [
  {
    title: { zh: "清华大学课题组科研实习", en: "Research Internship at Tsinghua University" },
    desc: {
      zh: "在相关课题组参与科研项目，跟进数据分析、实验设计与模型验证等工作，逐步积累学术研究经验。",
      en: "Participated in a related research lab project and gained experience in data analysis, experiment design, and model validation.",
    },
  },
  {
    title: { zh: "浙江省新苗人才计划", en: "Zhejiang New Talent Program" },
    desc: {
      zh: "项目顺利立项并获得省级大学生创新训练计划支持，在团队协作中推进从想法到落地的完整流程。",
      en: "The project was approved and supported by a provincial innovation training program, with a focus on turning ideas into practice.",
    },
  },
];

// Autumn scene data
const autumnLeaves = Array.from({ length: 10 }, (_, i) => ({
  left: `${((i * 37 + 9) % 104) - 2}%`,
  delay: `${((i * 11) % 90) / 10}s`,
  duration: `${9 + ((i * 7) % 9)}s`,
  size: `${8 + ((i * 5) % 13)}px`,
  rotate: `${-28 + ((i * 19) % 72)}deg`,
  depth: i % 3,
}));

const autumnRedRain = Array.from({ length: 56 }, (_, i) => ({
  left: `${((i * 29 + 3) % 112) - 6}%`,
  delay: `${((i * 13) % 70) / 10}s`,
  duration: `${4.5 + ((i * 5) % 6)}s`,
  length: `${24 + ((i * 3) % 26)}px`,
  opacity: `${0.18 + ((i % 5) * 0.045)}`,
}));

const autumnWindLines = Array.from({ length: 9 }, (_, i) => ({
  top: `${15 + i * 7}%`,
  delay: `${i * 0.45}s`,
  width: `${18 + (i % 4) * 8}vw`,
}));

// Spring scene data - soft light rays + petal rain
const springPetals = Array.from({ length: 16 }, (_, i) => ({
  left: `${((i * 31 + 5) % 106) - 3}%`,
  delay: `${((i * 17) % 80) / 10}s`,
  duration: `${10 + ((i * 7) % 8)}s`,
  size: `${4 + ((i * 5) % 8)}px`,
  opacity: `${0.2 + ((i % 4) * 0.08)}`,
}));

const springRays = Array.from({ length: 5 }, (_, i) => ({
  top: `${8 + i * 14}%`,
  left: `${15 + i * 12}%`,
  delay: `${i * 1.2}s`,
  width: `${20 + (i % 3) * 10}vw`,
}));

// Spring scene data - butterflies
const springButterflies = Array.from({ length: 8 }, (_, i) => ({
  left: `${((i * 29 + 10) % 90) + 5}%`,
  delay: `${((i * 13) % 60) / 10}s`,
  duration: `${15 + ((i * 5) % 10)}s`,
  size: `${5 + ((i * 3) % 4)}px`,
}));

// Winter scene data - snowflakes + frost wind
const winterSnow = Array.from({ length: 24 }, (_, i) => ({
  left: `${((i * 23 + 7) % 108) - 4}%`,
  delay: `${((i * 13) % 60) / 10}s`,
  duration: `${6 + ((i * 5) % 7)}s`,
  size: `${3 + ((i * 4) % 6)}px`,
  opacity: `${0.3 + ((i % 5) * 0.08)}`,
}));

const winterWind = Array.from({ length: 6 }, (_, i) => ({
  top: `${18 + i * 10}%`,
  delay: `${i * 0.6}s`,
  width: `${14 + (i % 3) * 7}vw`,
}));

// Winter scene data - pine trees
const winterPines = [
  { left: '6%', height: 90, bottom: '20%' },
  { left: '82%', height: 110, bottom: '19%' },
  { left: '38%', height: 65, bottom: '21%' },
  { left: '92%', height: 75, bottom: '22%' },
];

// Starry scene data - twinkling stars
const starryDots = Array.from({ length: 30 }, (_, i) => ({
  left: `${((i * 29 + 3) % 100)}%`,
  top: `${((i * 37 + 11) % 65)}%`,
  size: `${2 + ((i * 3) % 4)}px`,
  delay: `${((i * 7) % 30) / 10}s`,
  duration: `${2.5 + ((i * 3) % 4)}s`,
}));

const awardColor: Record<Contest["level"], string> = {
  "outstanding-winner": "autumn-badge autumn-badge-rose",
  "provincial-1": "autumn-badge autumn-badge-gold",
  "regional-2": "autumn-badge autumn-badge-blue",
  "provincial-2": "autumn-badge autumn-badge-blue",
  bronze: "autumn-badge autumn-badge-bronze",
  "provincial-3": "autumn-badge autumn-badge-slate",
};

const awardBarColor: Record<Contest["level"], string> = {
  "outstanding-winner": "#dc2626",
  "provincial-1": "#b7791f",
  "regional-2": "#2563eb",
  "provincial-2": "#2563eb",
  bronze: "#9a3412",
  "provincial-3": "#71717a",
};

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="section-label flex items-center gap-3">
      <span>{children}</span>
    </span>
  );
}

function Divider() {
  const { ref, visible } = useScrollReveal(0.3);
  return (
    <div ref={ref} className="mx-auto max-w-5xl px-6">
      <div className={`autumn-divider ${visible ? "divider-animated" : "opacity-0"}`} />
    </div>
  );
}

export default function HomePage() {
  const { language } = useSiteLanguage();
  const { scene } = useScene();
  const isEnglish = language === "en";
  const [expanded, setExpanded] = useState<string | null>("all");

  const copy = {
    heroEyebrow: isEnglish ? "HANGZHOU DIANZI UNIVERSITY · CLASS OF 2024" : "杭州电子科技大学 · 2024级",
    heroTitle: "MOONSILVER",
    heroDescription: isEnglish
      ? "One day, the fragrance will spread far and wide."
      : "终有一天馥郁传香",
    heroTagA: isEnglish ? "AI Research" : "人工智能科研",
    heroTagB: isEnglish ? "Engineering Practice" : "工程实现",
    heroTagC: isEnglish ? "Mathematical Modeling" : "数学建模",
    aboutLabel: isEnglish ? "About" : "关于",
    aboutTitle: isEnglish ? "Class of 2024 · Hangzhou Dianzi University" : "2024级 · 杭州电子科技大学",
    aboutDescription: isEnglish
      ? "moonsilver, keep pushing forward!"
      : "moonsilver冲冲冲！",
    honorsLabel: isEnglish ? "Honors" : "荣誉",
    honorsTitle: isEnglish ? "Awards" : "荣誉奖项",
    contestsLabel: isEnglish ? "Competitions" : "竞赛",
    contestsTitle: isEnglish ? "Competition Results" : "竞赛成绩",
    researchLabel: isEnglish ? "Research" : "科研",
    researchTitle: isEnglish ? "Research Experience" : "科研经历",
  };

  return (
    <div className="home-page relative min-h-screen overflow-hidden text-[var(--app-fg)]">
      <div className="autumn-page-scene pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="autumn-sky" />

          <div className={`scene-layer ${scene === "autumn" ? "active" : "inactive"}`}>
            <div className="autumn-sun" />
            <div className="mountain-layer mountain-layer-far" />
            <div className="mountain-layer mountain-layer-mid" />
            <div className="mountain-layer mountain-layer-near" />
            <div className="autumn-mist autumn-mist-a" />
            <div className="autumn-mist autumn-mist-b" />
            <div className="autumn-mist autumn-mist-c" />
            {autumnWindLines.map((line, i) => (
              <span key={`wind-${i}`} className="north-wind-line" style={{ top: line.top, width: line.width, animationDelay: line.delay }} />
            ))}
            {autumnRedRain.map((drop, i) => (
              <span key={`rr-${i}`} className="red-rain" style={{ left: drop.left, height: drop.length, opacity: drop.opacity, animationDelay: drop.delay, animationDuration: drop.duration }} />
            ))}
            {autumnLeaves.map((leaf, i) => (
              <span key={`leaf-${i}`} className={`autumn-leaf leaf-depth-${leaf.depth}`} style={{ left: leaf.left, width: leaf.size, height: `calc(${leaf.size} * 1.45)`, rotate: leaf.rotate, animationDelay: leaf.delay, animationDuration: leaf.duration }} />
            ))}
          </div>

          <div className={`scene-layer ${scene === "spring" ? "active" : "inactive"}`}>
            {/* Rolling hills */}
            <div className="spring-hill spring-hill-far" />
            <div className="spring-hill spring-hill-mid" />
            <div className="spring-hill spring-hill-near" />
            {/* Wind lines */}
            {autumnWindLines.map((line, i) => (
              <span key={`wind-${i}`} className="north-wind-line" style={{ top: line.top, width: line.width, animationDelay: line.delay }} />
            ))}
            {/* Cherry blossom tree */}
            <div className="spring-tree">
              <div className="spring-trunk" />
              <div className="spring-bloom spring-bloom-1" />
              <div className="spring-bloom spring-bloom-2" />
              <div className="spring-bloom spring-bloom-3" />
              <div className="spring-bloom spring-bloom-4" />
              <div className="spring-bloom spring-bloom-5" />
            </div>
            {/* Soft light rays */}
            {springRays.map((ray, i) => (
              <span key={`ray-${i}`} className="spring-ray" style={{ top: ray.top, left: ray.left, width: ray.width, animationDelay: ray.delay }} />
            ))}
            {/* Falling petals */}
            {springPetals.map((petal, i) => (
              <span key={`petal-${i}`} className="spring-petal" style={{ left: petal.left, width: petal.size, height: petal.size, opacity: petal.opacity, animationDelay: petal.delay, animationDuration: petal.duration }} />
            ))}
            {/* Butterflies */}
            {springButterflies.map((butterfly, i) => (
              <span key={`bf-${i}`} className="spring-butterfly" style={{ left: butterfly.left, width: butterfly.size, height: butterfly.size, animationDelay: butterfly.delay, animationDuration: butterfly.duration }} />
            ))}
          </div>

          <div className={`scene-layer ${scene === "winter" ? "active" : "inactive"}`}>
            {/* Aurora */}
            <div className="winter-aurora" />
            {/* Wind lines */}
            {winterWind.map((line, i) => (
              <span key={`ww-${i}`} className="north-wind-line" style={{ top: line.top, width: line.width, animationDelay: line.delay }} />
            ))}
            {/* Pine trees */}
            {winterPines.map((pine, i) => (
              <div key={`pine-${i}`} className="winter-pine" style={{ left: pine.left, height: pine.height, bottom: pine.bottom }}>
                <div className="winter-pine-cap" />
                <div className="winter-pine-tree" />
              </div>
            ))}
            {/* Snowman */}
            <div className="snowman">
              <div className="snowman-hat" />
              <div className="snowman-head" />
              <div className="snowman-body" />
              <div className="snowman-base" />
            </div>
            {/* Snowy ground */}
            <div className="snow-ground" />
            {/* Snowflakes */}
            {winterSnow.map((flake, i) => (
              <span key={`snow-${i}`} className="winter-snowflake" style={{ left: flake.left, width: flake.size, height: flake.size, opacity: flake.opacity, animationDelay: flake.delay, animationDuration: flake.duration }} />
            ))}
          </div>

          <div className={`scene-layer ${scene === "starry" ? "active" : "inactive"}`}>
            {/* Crescent moon */}
            <div className="starry-moon" />
            {/* Twinkling stars */}
            {starryDots.map((dot, i) => (
              <span key={`star-${i}`} className="starry-star" style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size, animationDelay: dot.delay, animationDuration: dot.duration }} />
            ))}
            {/* Shooting star */}
            <span className="starry-shooting" />
          </div>
      </div>

      <section className="autumn-hero relative z-10 flex min-h-[calc(100svh-5rem)] flex-col items-center justify-center overflow-hidden px-6 pt-24">
        <div className="autumn-hero-panel home-fade-up relative z-10 mx-auto max-w-5xl px-0 py-10 text-center md:py-12">
          <p className="mb-6 text-xs uppercase tracking-[0.32em] text-[var(--app-muted)]">{copy.heroEyebrow}</p>

          <div className="overflow-hidden pb-2">
            <h1 className="home-reveal text-5xl font-bold tracking-tight md:text-8xl">{copy.heroTitle}</h1>
          </div>

          <p className="mx-auto mt-7 max-w-xl text-sm leading-7 text-[var(--app-muted)] md:text-base">
            {copy.heroDescription}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {[copy.heroTagA, copy.heroTagB, copy.heroTagC].map((item) => (
              <span key={item} className="autumn-chip">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="autumn-scroll-cue home-fade-up relative z-10 mt-12" aria-hidden="true">
          <span />
        </div>
      </section>

      <RevealSection className="mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.aboutLabel}</SectionLabel>
        <h2 className="mt-4 mb-6 text-3xl font-semibold leading-tight md:text-4xl">{copy.aboutTitle}</h2>
        <p className="max-w-2xl leading-8 text-[var(--app-muted)]">{copy.aboutDescription}</p>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.honorsLabel}</SectionLabel>
        <h2 className="mt-4 mb-10 text-3xl font-semibold md:text-4xl">{copy.honorsTitle}</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {awards.map((award, i) => (
            <div
              key={award.title.zh}
              className="section-item autumn-card group rounded-2xl border p-6 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="text-sm font-semibold text-[var(--app-fg)]">{award.title[language]}</h3>
              <p className="mt-3 text-xs leading-5 text-[var(--app-muted)]">{award.sub[language]}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.contestsLabel}</SectionLabel>
        <h2
          className="mt-4 mb-8 cursor-pointer select-none text-3xl font-semibold transition-colors hover:opacity-75 md:text-4xl"
          onClick={() => setExpanded(expanded === "contests" ? null : "contests")}
        >
          {copy.contestsTitle}
          <span
            className="ml-3 inline-block text-base font-normal text-[var(--app-muted)] transition-transform duration-300"
            style={{ transform: expanded === "contests" || expanded === "all" ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            +
          </span>
        </h2>

        <div
          className={`overflow-hidden transition-all duration-700 ${
            expanded === "contests" || expanded === "all" ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2">
            {contests.map((contest, i) => (
              <div
                key={contest.name.zh}
                className="section-item autumn-list-item group flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-all duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full transition-transform duration-300 group-hover:scale-150" style={{ background: awardBarColor[contest.level] }} />
                  <span className="truncate text-sm text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-fg)]">
                    {contest.name[language]}
                  </span>
                </div>
                <span className={awardColor[contest.level]}>{contest.award[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.researchLabel}</SectionLabel>
        <h2 className="mt-4 mb-10 text-3xl font-semibold md:text-4xl">{copy.researchTitle}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {research.map((item, i) => (
            <div
              key={item.title.zh}
              className="section-item autumn-card group rounded-2xl border p-7 transition-all duration-300"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <h3 className="text-sm font-semibold text-[var(--app-fg)]">{item.title[language]}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--app-muted)]">{item.desc[language]}</p>
            </div>
          ))}
        </div>
      </RevealSection>
    </div>
  );
}

function RevealSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal(0.1);

  return (
    <section
      ref={ref}
      className={`autumn-section transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
