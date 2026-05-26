"use client";

import { useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";

type LocaleText = {
  zh: string;
  en: string;
};

type Award = {
  title: LocaleText;
  sub: LocaleText;
};

type Contest = {
  level: "national-1" | "provincial-1" | "regional-2" | "provincial-2" | "bronze" | "provincial-3" | "national-2" | "national-3";
  award: LocaleText;
  name: LocaleText;
};

type ResearchItem = {
  title: LocaleText;
  desc: LocaleText;
};

const awards: Award[] = [
  {
    title: { zh: "国家奖学金", en: "National Scholarship" },
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
    level: "national-1",
    award: { zh: "国家一等奖", en: "National 1st Prize" },
    name: { zh: "全国大学生数学建模竞赛", en: "National College Students Mathematical Modeling Contest" },
  },
  {
    level: "provincial-1",
    award: { zh: "省级一等奖", en: "Provincial 1st Prize" },
    name: { zh: "浙江省服务外包创新应用大赛", en: "Zhejiang Service Outsourcing Innovation Contest" },
  },
  {
    level: "regional-2",
    award: { zh: "区域二等奖", en: "Regional 2nd Prize" },
    name: { zh: "中国服务外包创新创业大赛（华东区域）", en: "China Service Outsourcing Innovation & Entrepreneurship Competition (Eastern Region)" },
  },
  {
    level: "provincial-2",
    award: { zh: "省级二等奖", en: "Provincial 2nd Prize" },
    name: { zh: "浙江省人工智能竞赛", en: "Zhejiang Artificial Intelligence Contest" },
  },
  {
    level: "provincial-2",
    award: { zh: "省级二等奖", en: "Provincial 2nd Prize" },
    name: { zh: "全国大学生计算机设计大赛", en: "National College Students Computer Design Competition" },
  },
  {
    level: "bronze",
    award: { zh: "省级铜奖", en: "Provincial Bronze" },
    name: { zh: "“挑战杯”人工智能+专项赛", en: "Challenge Cup AI+ Special Track" },
  },
  {
    level: "provincial-3",
    award: { zh: "省级三等奖", en: "Provincial 3rd Prize" },
    name: { zh: "浙江省大学生智能设计竞赛", en: "Zhejiang College Students AI Design Contest" },
  },
  {
    level: "national-2",
    award: { zh: "国家二等奖", en: "National 2nd Prize" },
    name: { zh: "亚太地区大学生数学建模竞赛（中英文赛道）", en: "APMCM Asia-Pacific Mathematical Contest in Modeling (Chinese track)" },
  },
  {
    level: "national-3",
    award: { zh: "国家三等奖", en: "National 3rd Prize" },
    name: { zh: "亚太地区大学生数学建模竞赛（英文赛道）", en: "APMCM Asia-Pacific Mathematical Contest in Modeling (English track)" },
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

const leaves = Array.from({ length: 34 }, (_, i) => ({
  left: `${((i * 37 + 9) % 104) - 2}%`,
  delay: `${((i * 11) % 90) / 10}s`,
  duration: `${9 + ((i * 7) % 9)}s`,
  size: `${8 + ((i * 5) % 13)}px`,
  rotate: `${-28 + ((i * 19) % 72)}deg`,
  depth: i % 3,
}));

const redRain = Array.from({ length: 56 }, (_, i) => ({
  left: `${((i * 29 + 3) % 112) - 6}%`,
  delay: `${((i * 13) % 70) / 10}s`,
  duration: `${4.5 + ((i * 5) % 6)}s`,
  length: `${24 + ((i * 3) % 26)}px`,
  opacity: `${0.18 + ((i % 5) * 0.045)}`,
}));

const windLines = Array.from({ length: 9 }, (_, i) => ({
  top: `${15 + i * 7}%`,
  delay: `${i * 0.45}s`,
  width: `${18 + (i % 4) * 8}vw`,
}));

const awardColor: Record<Contest["level"], string> = {
  "national-1": "autumn-badge autumn-badge-rose",
  "provincial-1": "autumn-badge autumn-badge-gold",
  "regional-2": "autumn-badge autumn-badge-blue",
  "provincial-2": "autumn-badge autumn-badge-blue",
  bronze: "autumn-badge autumn-badge-bronze",
  "provincial-3": "autumn-badge autumn-badge-slate",
  "national-2": "autumn-badge autumn-badge-green",
  "national-3": "autumn-badge autumn-badge-purple",
};

const awardBarColor: Record<Contest["level"], string> = {
  "national-1": "#c2410c",
  "provincial-1": "#b7791f",
  "regional-2": "#2563eb",
  "provincial-2": "#2563eb",
  bronze: "#9a3412",
  "provincial-3": "#71717a",
  "national-2": "#047857",
  "national-3": "#7c3aed",
};

function SectionLabel({ children }: { children: string }) {
  return <span className="section-label">{children}</span>;
}

function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="autumn-divider" />
    </div>
  );
}

export default function HomePage() {
  const { language } = useSiteLanguage();
  const isEnglish = language === "en";
  const [expanded, setExpanded] = useState<string | null>("all");

  const copy = {
    heroEyebrow: isEnglish ? "HANGZHOU DIANZI UNIVERSITY · CLASS OF 2024" : "杭州电子科技大学 · 2024级",
    heroTitle: "MOONSILVER",
    heroDescription: isEnglish
      ? "Exploring research, engineering, and creative technology between the mountain wind and a clear autumn sky."
      : "在清朗秋色与山间北风之间，继续探索科研、工程与创造性的技术实践。",
    heroTagA: isEnglish ? "AI Research" : "人工智能科研",
    heroTagB: isEnglish ? "Engineering Practice" : "工程实现",
    heroTagC: isEnglish ? "Mathematical Modeling" : "数学建模",
    aboutLabel: isEnglish ? "About" : "关于",
    aboutTitle: isEnglish ? "Class of 2024 · Hangzhou Dianzi University" : "2024级 · 杭州电子科技大学",
    aboutDescription: isEnglish
      ? "An undergraduate focused on artificial intelligence and engineering practice. Actively participating in competitions and research projects, connecting theory with real-world applications."
      : "本科在读，关注人工智能、工程实践与产品落地。持续参与竞赛与科研项目，希望把理论、代码和真实场景更紧密地连接起来。",
    honorsLabel: isEnglish ? "Honors" : "荣誉",
    honorsTitle: isEnglish ? "Awards" : "荣誉奖项",
    contestsLabel: isEnglish ? "Competitions" : "竞赛",
    contestsTitle: isEnglish ? "Competition Results" : "竞赛成绩",
    researchLabel: isEnglish ? "Research" : "科研",
    researchTitle: isEnglish ? "Research Experience" : "科研经历",
  };

  return (
    <div className="home-page relative min-h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-fg)]">
      <div className="autumn-page-scene pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="autumn-sky" />
          <div className="autumn-sun" />
          <div className="mountain-layer mountain-layer-far" />
          <div className="mountain-layer mountain-layer-mid" />
          <div className="mountain-layer mountain-layer-near" />
          <div className="autumn-mist autumn-mist-a" />
          <div className="autumn-mist autumn-mist-b" />
          <div className="autumn-mist autumn-mist-c" />

          {windLines.map((line, i) => (
            <span
              key={`wind-${i}`}
              className="north-wind-line"
              style={{ top: line.top, width: line.width, animationDelay: line.delay }}
            />
          ))}

          {redRain.map((drop, i) => (
            <span
              key={`red-rain-${i}`}
              className="red-rain"
              style={{
                left: drop.left,
                height: drop.length,
                opacity: drop.opacity,
                animationDelay: drop.delay,
                animationDuration: drop.duration,
              }}
            />
          ))}

          {leaves.map((leaf, i) => (
            <span
              key={`leaf-${i}`}
              className={`autumn-leaf leaf-depth-${leaf.depth}`}
              style={{
                left: leaf.left,
                width: leaf.size,
                height: `calc(${leaf.size} * 1.45)`,
                rotate: leaf.rotate,
                animationDelay: leaf.delay,
                animationDuration: leaf.duration,
              }}
            />
          ))}
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

      <section className="autumn-section mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.aboutLabel}</SectionLabel>
        <h2 className="mt-4 mb-6 text-3xl font-semibold leading-tight md:text-4xl">{copy.aboutTitle}</h2>
        <p className="max-w-2xl leading-8 text-[var(--app-muted)]">{copy.aboutDescription}</p>
      </section>

      <Divider />

      <section className="autumn-section mx-auto max-w-5xl px-6 py-24">
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
      </section>

      <Divider />

      <section className="autumn-section mx-auto max-w-5xl px-6 py-24">
        <SectionLabel>{copy.contestsLabel}</SectionLabel>
        <h2
          className="mt-4 mb-8 cursor-pointer select-none text-3xl font-semibold transition-colors hover:opacity-75 md:text-4xl"
          onClick={() => setExpanded(expanded === "contests" ? null : "contests")}
        >
          {copy.contestsTitle}
          <span
            className="ml-3 inline-block text-base font-normal text-[var(--app-muted)] transition-transform"
            style={{ transform: expanded === "contests" || expanded === "all" ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            +
          </span>
        </h2>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            expanded === "contests" || expanded === "all" ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-2">
            {contests.map((contest, i) => (
              <div
                key={contest.name.zh}
                className="section-item autumn-list-item group flex items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: awardBarColor[contest.level] }} />
                  <span className="truncate text-sm text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-fg)]">
                    {contest.name[language]}
                  </span>
                </div>
                <span className={awardColor[contest.level]}>{contest.award[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      <section className="autumn-section mx-auto max-w-5xl px-6 py-24">
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
      </section>
    </div>
  );
}
