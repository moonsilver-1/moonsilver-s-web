"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type React from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";
import { dailyWeather } from "@/app/lib/farm-state";
import { FarmCard } from "@/app/components/farm-card";
import {
  PixelBush,
  PixelCarrot,
  PixelCloud,
  PixelMoon,
  PixelSprout,
  PixelSun,
} from "@/app/components/pixel-art";

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
      { threshold },
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
  level:
    | "ams"
    | "national-2"
    | "national-3"
    | "provincial-1"
    | "provincial-2"
    | "provincial-3"
    | "silver"
    | "bronze";
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
    sub: { zh: "国家级", en: "National level" },
  },
  {
    title: { zh: "浙江省政府奖学金", en: "Provincial Government Scholarship" },
    sub: { zh: "浙江省人民政府", en: "People's Government of Zhejiang Province" },
  },
  {
    title: { zh: "综合测评专业第一", en: "1st in Comprehensive Evaluation" },
    sub: { zh: "104.77 · 排名 1/756", en: "104.77 · Rank 1/756" },
  },
  {
    title: { zh: "平均学分绩点 4.61/5", en: "GPA 4.61/5" },
    sub: { zh: "排名 4/249", en: "Rank 4/249" },
  },
];

const contests: Contest[] = [
  {
    level: "ams",
    award: { zh: "AMS奖 · 全球第一名", en: "AMS Award · 1st Worldwide" },
    name: { zh: "美国大学生数学建模竞赛（MCM）", en: "Mathematical Contest in Modeling" },
  },
  {
    level: "national-2",
    award: { zh: "全国二等奖", en: "National 2nd Prize" },
    name: { zh: "APMCM 数学建模竞赛（中文）", en: "APMCM Mathematical Modeling (Chinese)" },
  },
  {
    level: "national-2",
    award: { zh: "全国二等奖", en: "National 2nd Prize" },
    name: { zh: "APMCM 数学建模竞赛（英文）", en: "APMCM Mathematical Modeling (English)" },
  },
  {
    level: "national-2",
    award: { zh: "初赛二等奖", en: "Preliminary 2nd Prize" },
    name: { zh: "全国大学生智能汽车竞赛", en: "National Smart Car Competition" },
  },
  {
    level: "national-2",
    award: { zh: "二等奖", en: "2nd Prize" },
    name: { zh: "全国高校网络文化技术创新大会", en: "National Campus Network Culture Tech Conference" },
  },
  {
    level: "national-3",
    award: { zh: "全国三等奖", en: "National 3rd Prize" },
    name: { zh: "中国大学生服务外包创新创业大赛", en: "China Service Outsourcing Competition" },
  },
  {
    level: "provincial-1",
    award: { zh: "浙江省一等奖", en: "Provincial 1st Prize" },
    name: { zh: "全国大学生数学建模竞赛", en: "CUMCM" },
  },
  {
    level: "provincial-1",
    award: { zh: "浙江省一等奖 · 直通国赛", en: "Provincial 1st · to Nationals" },
    name: { zh: "大学生物理实验与科技创新竞赛", en: "Physics Experiment & Tech Innovation Contest" },
  },
  {
    level: "provincial-2",
    award: { zh: "东部赛区二等奖", en: "Eastern Regional 2nd Prize" },
    name: { zh: "中国大学生服务外包创新创业大赛", en: "China Service Outsourcing Competition" },
  },
  {
    level: "provincial-2",
    award: { zh: "浙江省二等奖", en: "Provincial 2nd Prize" },
    name: { zh: "中国大学生计算机设计大赛", en: "China Computer Design Contest" },
  },
  {
    level: "provincial-2",
    award: { zh: "二等奖", en: "2nd Prize" },
    name: { zh: "浙江省服务外包创新应用大赛", en: "Zhejiang Service Outsourcing Contest" },
  },
  {
    level: "silver",
    award: { zh: "浙江省银奖", en: "Provincial Silver" },
    name: { zh: "中国国际大学生创新大赛", en: "China International College Students' Innovation Competition" },
  },
  {
    level: "bronze",
    award: { zh: "浙江省铜奖", en: "Provincial Bronze" },
    name: { zh: "挑战杯“人工智能+”专项赛", en: "Challenge Cup AI+ Special Track" },
  },
  {
    level: "provincial-3",
    award: { zh: "三等奖 × 2", en: "3rd Prize × 2" },
    name: { zh: "浙江省人工智能竞赛", en: "Zhejiang AI Contest" },
  },
  {
    level: "provincial-3",
    award: { zh: "三等奖", en: "3rd Prize" },
    name: { zh: "浙江省大学生智能机器人创意竞赛", en: "Zhejiang Robot Creativity Contest" },
  },
];

const research: ResearchItem[] = [
  {
    title: { zh: "清华大学 Radar & Signal Lab 科研实习", en: "Internship at THU Radar & Signal Lab" },
    desc: {
      zh: "完成五个月科研实习，深度参与雷达与信号处理方向的课题研究与实验验证。",
      en: "A five-month research internship, deeply involved in radar and signal processing research and experiments.",
    },
  },
  {
    title: { zh: "国家级大创立项（负责人）", en: "National Innovation Training Program (Leader)" },
    desc: {
      zh: "2026年作为负责人主持国家级大学生创新创业训练计划项目，推进从选题、实验到结题的完整流程。",
      en: "Leading a national innovation training program since 2026, from topic selection and experiments to completion.",
    },
  },
  {
    title: { zh: "论文与审稿", en: "Publications & Reviewing" },
    desc: {
      zh: "以第一作者录用国际会议论文一篇；以第一作者投稿 CCF-A 会议 WWW 与中科院二区期刊 IEEE T-REL；以共同第一作者投稿 CCF-B 会议 ICASSP 并受邀担任会议审稿人。",
      en: "One first-author conference paper accepted; first-author submissions to CCF-A WWW and IEEE T-REL (CAS Q2); co-first-author submission to ICASSP (CCF-B) with an invited reviewer role.",
    },
  },
  {
    title: { zh: "发明专利", en: "Invention Patents" },
    desc: {
      zh: "参与授权/公开发明专利 7 项。",
      en: "Contributed to 7 granted or published invention patents.",
    },
  },
];

const weatherLabel = {
  zh: { sunny: "☀ 晴朗", cloudy: "☁ 多云", windy: "≋ 起风", rainy: "☂ 下雨" },
  en: { sunny: "☀ Sunny", cloudy: "☁ Cloudy", windy: "≋ Windy", rainy: "☂ Rainy" },
} as const;

const awardColor: Record<Contest["level"], string> = {
  ams: "autumn-badge autumn-badge-rose",
  "national-2": "autumn-badge autumn-badge-gold",
  "national-3": "autumn-badge autumn-badge-gold",
  "provincial-1": "autumn-badge autumn-badge-blue",
  "provincial-2": "autumn-badge autumn-badge-blue",
  "provincial-3": "autumn-badge autumn-badge-slate",
  silver: "autumn-badge autumn-badge-purple",
  bronze: "autumn-badge autumn-badge-bronze",
};

function awardDotColor(level: Contest["level"]): string {
  if (level === "ams") return "var(--sv-red)";
  if (level === "national-2" || level === "national-3") return "var(--sv-gold)";
  if (level === "silver") return "#8a5fbf";
  if (level === "provincial-1") return "var(--sv-blue)";
  if (level === "bronze") return "#a0622d";
  return "var(--sv-green)";
}

const clouds = Array.from({ length: 5 }, (_, i) => ({
  top: `${6 + ((i * 9) % 22)}%`,
  delay: `${-((i * 37) % 90)}s`,
  duration: `${70 + ((i * 13) % 50)}s`,
  scale: 1.6 + (i % 3) * 0.7,
}));

const stars = Array.from({ length: 30 }, (_, i) => ({
  left: `${(i * 37 + 7) % 100}%`,
  top: `${(i * 23 + 3) % 55}%`,
  delay: `${((i * 7) % 30) / 10}s`,
  size: i % 6 === 0 ? 5 : 3,
}));

const fireflies = Array.from({ length: 8 }, (_, i) => ({
  left: `${((i * 43 + 13) % 86) + 7}%`,
  top: `${64 + ((i * 17) % 24)}%`,
  delay: `${-(i * 2.7)}s`,
}));

const rainDrops = Array.from({ length: 36 }, (_, i) => ({
  left: `${((i * 29 + 3) % 106) - 3}%`,
  height: `${16 + ((i * 7) % 18)}px`,
  delay: `${((i * 11) % 22) / 10}s`,
  duration: `${0.9 + ((i * 3) % 5) / 10}s`,
}));

const windStreaks = Array.from({ length: 6 }, (_, i) => ({
  top: `${12 + i * 12}%`,
  width: `${90 + (i % 3) * 70}px`,
  delay: `${i * 1.3}s`,
}));

const crops = [
  { Comp: PixelCarrot, left: "10%", w: 20, h: 33 },
  { Comp: PixelSprout, left: "24%", w: 22, h: 22 },
  { Comp: PixelBush, left: "44%", w: 28, h: 24 },
  { Comp: PixelCarrot, left: "62%", w: 20, h: 33 },
  { Comp: PixelSprout, left: "78%", w: 22, h: 22 },
];

function SectionLabel({ children }: { children: string }) {
  return <span className="pixel-section-label">{children}</span>;
}

function Divider() {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <div className="pixel-divider" />
    </div>
  );
}

export default function HomePage() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const isDay = theme === "light";
  const weather = useMemo(() => dailyWeather(), []);
  const isEnglish = language === "en";
  const [expanded, setExpanded] = useState<string | null>("all");

  const copy = {
    heroEyebrow: isEnglish ? "HANGZHOU DIANZI UNIVERSITY · CLASS OF 2024" : "杭州电子科技大学 · 2024级",
    heroTitle: "MOONSILVER",
    heroDescription: isEnglish
      ? "One day, the fragrance will spread far and wide."
      : "终有一天馥郁传香",
    aboutLabel: isEnglish ? "About" : "关于",
    aboutTitle: isEnglish
      ? "Class of 2024 · Automation (New Engineering Experimental Class)"
      : "2024级 · 自动化（新工科实验班）",
    aboutDescription: isEnglish
      ? "Probationary member of the CPC. Average comprehensive evaluation 104.77 (rank 1/756), average GPA 4.61/5 (rank 4/249). moonsilver, keep pushing forward!"
      : "中共预备党员。入学以来平均综测成绩 104.77（排名 1/756），平均学分绩点 4.61/5（排名 4/249）。moonsilver冲冲冲！",
    honorsLabel: isEnglish ? "Honors" : "荣誉",
    honorsTitle: isEnglish ? "Awards" : "荣誉奖项",
    contestsLabel: isEnglish ? "Competitions" : "竞赛",
    contestsTitle: isEnglish ? "Competition Results" : "竞赛成绩",
    researchLabel: isEnglish ? "Research" : "科研",
    researchTitle: isEnglish ? "Research Experience" : "科研经历",
  };

  return (
    <div className="home-page relative min-h-screen overflow-hidden text-[var(--app-fg)]">
      {/* Fixed pixel farm scene */}
      <div className="pixel-scene pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {isDay ? (
          <>
            <PixelSun className="pixel-orb pixel-orb-sun" style={{ left: "11%", top: "14%", width: 76, height: 76 }} />
            {clouds.map((c, i) => (
              <PixelCloud
                key={`cloud-${i}`}
                className="pixel-cloud"
                style={{
                  left: 0,
                  top: c.top,
                  width: 60 * c.scale,
                  height: 30 * c.scale,
                  animationDelay: c.delay,
                  animationDuration: c.duration,
                }}
              />
            ))}
            {weather === "rainy" &&
              rainDrops.map((d, i) => (
                <span
                  key={`rain-${i}`}
                  className="pixel-rain"
                  style={{ left: d.left, height: d.height, animationDelay: d.delay, animationDuration: d.duration }}
                />
              ))}
            {weather === "windy" &&
              windStreaks.map((w, i) => (
                <span
                  key={`wind-${i}`}
                  className="pixel-wind"
                  style={{ top: w.top, width: w.width, animationDelay: w.delay }}
                />
              ))}
          </>
        ) : (
          <>
            <PixelMoon className="pixel-orb pixel-orb-moon" style={{ right: "13%", top: "12%", width: 54, height: 54 }} />
            {stars.map((s, i) => (
              <span
                key={`star-${i}`}
                className="pixel-star"
                style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
              />
            ))}
            <span className="pixel-shooting" />
            {fireflies.map((f, i) => (
              <span
                key={`fly-${i}`}
                className="pixel-firefly"
                style={{ left: f.left, top: f.top, animationDelay: f.delay }}
              />
            ))}
          </>
        )}

        <div className="pixel-hills" />
        <div className="pixel-fence" />
        <div className="pixel-grass" />
        <div className="pixel-farm-row">
          {crops.map((crop, i) => (
            <crop.Comp key={`crop-${i}`} style={{ position: "relative", width: crop.w, height: crop.h }} />
          ))}
        </div>
      </div>

      <section className="autumn-hero relative z-10 flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center overflow-hidden px-6 pt-24">
        <div className="autumn-hero-panel home-fade-up relative z-10 mx-auto max-w-5xl px-0 py-8 text-center md:py-10">
          <p className="pixel-chip mb-7 !text-[11px] uppercase tracking-[0.3em]">
            {copy.heroEyebrow} · {weatherLabel[language][weather]}
          </p>

          <div className="overflow-hidden pb-3">
            <h1
              className="font-brand home-reveal text-3xl leading-relaxed md:text-6xl"
              style={{ textShadow: "4px 4px 0 var(--sv-shadow)" }}
            >
              {copy.heroTitle}
            </h1>
          </div>

          <p className="pixel-panel-flat mx-auto mt-7 inline-block max-w-xl px-5 py-2.5 text-sm leading-7">
            {copy.heroDescription}
          </p>

          <div className="mt-8">
            <FarmCard />
          </div>
        </div>

        <div className="autumn-scroll-cue home-fade-up relative z-10 mt-10" aria-hidden="true">
          <span />
        </div>
      </section>

      <RevealSection className="mx-auto max-w-5xl px-6 py-20">
        <div className="pixel-panel p-7 md:p-9">
          <SectionLabel>{copy.aboutLabel}</SectionLabel>
          <h2 className="pixel-title mt-4 mb-4 text-2xl leading-snug md:text-3xl">{copy.aboutTitle}</h2>
          <p className="max-w-2xl leading-8 text-[var(--app-muted)]">{copy.aboutDescription}</p>
        </div>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-20">
        <SectionLabel>{copy.honorsLabel}</SectionLabel>
        <h2 className="pixel-title mt-4 mb-8 text-2xl md:text-3xl">{copy.honorsTitle}</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {awards.map((award, i) => (
            <div
              key={award.title.zh}
              className="section-item autumn-card p-5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <h3 className="text-[13px] leading-6">{award.title[language]}</h3>
              <p className="mt-2.5 text-xs leading-5 text-[var(--app-muted)]">{award.sub[language]}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-20">
        <SectionLabel>{copy.contestsLabel}</SectionLabel>
        <h2
          className="pixel-title mt-4 mb-6 cursor-pointer select-none text-2xl transition-colors md:text-3xl"
          onClick={() => setExpanded(expanded === "contests" ? null : "contests")}
        >
          {copy.contestsTitle}
          <span
            className="ml-3 inline-block text-base font-normal text-[var(--app-muted)]"
            style={{ transform: expanded === "contests" || expanded === "all" ? "rotate(45deg)" : "rotate(0deg)" }}
          >
            +
          </span>
        </h2>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            expanded === "contests" || expanded === "all" ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pixel-panel space-y-1.5 p-4">
            {contests.map((contest, i) => (
              <div
                key={contest.name.zh}
                className="section-item autumn-list-item flex items-center justify-between gap-4 p-2.5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="h-2 w-2 shrink-0" style={{ background: awardDotColor(contest.level) }} />
                  <span className="truncate text-[13px] text-[var(--app-muted)]">{contest.name[language]}</span>
                </div>
                <span className={awardColor[contest.level]}>{contest.award[language]}</span>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      <Divider />

      <RevealSection className="mx-auto max-w-5xl px-6 py-20">
        <SectionLabel>{copy.researchLabel}</SectionLabel>
        <h2 className="pixel-title mt-4 mb-8 text-2xl md:text-3xl">{copy.researchTitle}</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {research.map((item, i) => (
            <div
              key={item.title.zh}
              className="section-item autumn-card p-6"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <h3 className="text-[13px] leading-6">{item.title[language]}</h3>
              <p className="mt-3 text-[13px] leading-7 text-[var(--app-muted)]">{item.desc[language]}</p>
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
      className={`transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
