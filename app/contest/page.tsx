"use client";

import { useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { ProductJsonSitePanel } from "@/app/contest/product-json-site-panel";
import { useThemeMode } from "@/app/lib/use-theme-mode";

const tracks = [
  {
    id: "smart-car",
    code: "SC",
    color: "#0891b2",
    title: { zh: "智能车", en: "Smart Car" },
    subtitle: { zh: "全国大学生智能汽车竞赛", en: "National College Students Intelligent Car Contest" },
    desc: {
      zh: "嵌入式控制、传感器融合、赛道策略和硬件调试集中在一辆车上，是工程闭环最强的训练场。",
      en: "Embedded control, sensor fusion, racing strategy, and hardware debugging in one compact engineering loop.",
    },
    tags: [
      { zh: "嵌入式", en: "Embedded" },
      { zh: "控制", en: "Control" },
      { zh: "调试", en: "Debugging" },
    ],
  },
  {
    id: "robot",
    code: "RB",
    color: "#059669",
    title: { zh: "机器人", en: "Robotics" },
    subtitle: { zh: "机器人相关赛事", en: "Robot-related competitions" },
    desc: {
      zh: "从机械结构到运动规划，再到感知和决策，适合把跨学科能力揉成一个真实系统。",
      en: "Mechanical structure, motion planning, perception, and decision-making shaped into a real system.",
    },
    tags: [
      { zh: "ROS", en: "ROS" },
      { zh: "运动规划", en: "Motion Planning" },
      { zh: "机械设计", en: "Mechanical Design" },
    ],
  },
  {
    id: "cs-design",
    code: "CD",
    color: "#7c3aed",
    title: { zh: "计算机设计", en: "Computer Design" },
    subtitle: { zh: "中国大学生计算机设计大赛", en: "China College Students' Computer Design Contest" },
    desc: {
      zh: "偏向产品表达、交互设计和软件工程，把技术方案包装成能被理解、能被使用的作品。",
      en: "Product expression, interaction design, and software engineering presented as usable work.",
    },
    tags: [
      { zh: "软件开发", en: "Software" },
      { zh: "UI/UX", en: "UI/UX" },
      { zh: "创新设计", en: "Creative Design" },
    ],
  },
  {
    id: "service-outsourcing",
    code: "SO",
    color: "#d97706",
    title: { zh: "服务外包", en: "Service Outsourcing" },
    subtitle: { zh: "中国国际服务外包创新创业大赛", en: "Service Outsourcing Innovation Contest" },
    desc: {
      zh: "面向真实业务需求，重点考验需求拆解、团队协作、交付节奏和商业价值表达。",
      en: "Real business needs, requirement breakdown, collaboration, delivery rhythm, and value expression.",
    },
    tags: [
      { zh: "项目管理", en: "Project" },
      { zh: "商业分析", en: "Business" },
      { zh: "系统开发", en: "Systems" },
    ],
  },
  {
    id: "physics",
    code: "PX",
    color: "#e11d48",
    title: { zh: "物理实验创新", en: "Physics Lab Innovation" },
    subtitle: { zh: "全国大学生物理实验竞赛", en: "Physics Experiment Contest" },
    desc: {
      zh: "用实验设计回答问题，用数据解释现象，在科学表达和工程实现之间找到平衡。",
      en: "Answer questions with experimental design and explain phenomena through data.",
    },
    tags: [
      { zh: "实验设计", en: "Experiment" },
      { zh: "数据分析", en: "Data" },
      { zh: "科学表达", en: "Communication" },
    ],
  },
] as const;

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  return `${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}`;
}

export default function ContestPage() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const [isSmartCarOpen, setIsSmartCarOpen] = useState(false);
  const isLight = theme === "light";

  const copy =
    language === "en"
      ? {
          eyebrow: "Contest",
          title: "Competition Zone",
          description: "A compact map of competition tracks, project notes, and reusable data demos.",
          stats: [
            ["5", "tracks"],
            ["JSON", "demo"],
            ["Build", "ready"],
          ],
          focus: "Current focus",
          open: "Open JSON demo",
          close: "Hide JSON demo",
          tracks: "Tracks",
        }
      : {
          eyebrow: "Contest",
          title: "竞赛专区",
          description: "把参赛方向、项目记录和可复用的小工具整理到一个更清晰的入口里。",
          stats: [
            ["5", "方向"],
            ["JSON", "演示"],
            ["Build", "可用"],
          ],
          focus: "当前重点",
          open: "打开 JSON 小站",
          close: "收起 JSON 小站",
          tracks: "方向",
        };

  const smartCar = tracks[0];
  const pageBackground = isLight
    ? "radial-gradient(circle at 18% 8%, rgba(8,145,178,0.16), transparent 30%), radial-gradient(circle at 90% 2%, rgba(217,119,6,0.13), transparent 28%), linear-gradient(180deg, #fbf7ef 0%, #f2eadb 58%, #fbf7ef 100%)"
    : "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.16), transparent 32%), radial-gradient(circle at 85% 0%, rgba(244,114,182,0.12), transparent 26%), linear-gradient(180deg, #05070a 0%, #0b1018 55%, #05070a 100%)";
  const cardBackground = isLight ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.055)";
  const framedBackground = isLight ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.04)";
  const borderColor = isLight ? "rgba(24,21,19,0.1)" : "rgba(255,255,255,0.1)";
  const mutedColor = isLight ? "rgba(24,21,19,0.62)" : "rgba(255,255,255,0.58)";
  const softColor = isLight ? "rgba(24,21,19,0.42)" : "rgba(255,255,255,0.42)";

  return (
    <div className="min-h-screen pt-20 text-[var(--app-fg)] transition-colors duration-500" style={{ background: pageBackground }}>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-end">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.28em]" style={{ color: isLight ? "#0e7490" : "rgba(165,243,252,0.68)" }}>
                {copy.eyebrow}
              </p>
              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight md:text-7xl">{copy.title}</h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 md:text-base" style={{ color: mutedColor }}>
                {copy.description}
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
                {copy.stats.map(([value, label]) => (
                  <div key={label} className="pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
                    <p className="text-2xl font-semibold">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em]" style={{ color: softColor }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSmartCarOpen((current) => !current)}
              aria-expanded={isSmartCarOpen}
              className="group rounded-[28px] p-5 text-left shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur transition-all hover:-translate-y-0.5"
              style={{
                background: cardBackground,
                border: `1px solid ${isLight ? "rgba(8,145,178,0.22)" : "rgba(103,232,249,0.22)"}`,
              }}
            >
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: isLight ? "#0e7490" : "rgba(207,250,254,0.58)" }}>
                {copy.focus}
              </p>
              <div className="mt-5 flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border text-sm font-semibold"
                  style={{
                    color: smartCar.color,
                    borderColor: `rgba(${hexToRgb(smartCar.color)}, 0.28)`,
                    background: `rgba(${hexToRgb(smartCar.color)}, ${isLight ? "0.09" : "0.16"})`,
                  }}
                >
                  {smartCar.code}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">{smartCar.title[language]}</h2>
                  <p className="mt-1 text-sm" style={{ color: softColor }}>
                    {smartCar.subtitle[language]}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7" style={{ color: mutedColor }}>
                {smartCar.desc[language]}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {smartCar.tags.map((tag) => (
                  <span key={tag.en} className="rounded-full px-3 py-1 text-xs" style={{ color: mutedColor, border: `1px solid ${borderColor}` }}>
                    {tag[language]}
                  </span>
                ))}
              </div>
              <span
                className="mt-6 inline-flex rounded-full px-4 py-2 text-xs font-medium transition-opacity group-hover:opacity-90"
                style={{ background: isLight ? "#181513" : "#ffffff", color: isLight ? "#f5f1e8" : "#0f172a" }}
              >
                {isSmartCarOpen ? copy.close : copy.open}
              </span>
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        {isSmartCarOpen ? (
          <section className="mb-10 rounded-[28px] p-5 backdrop-blur" style={{ background: framedBackground, border: `1px solid ${borderColor}` }}>
            <ProductJsonSitePanel embedded />
          </section>
        ) : null}

        <div className="mb-5 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.28em]" style={{ color: softColor }}>
            {copy.tracks}
          </p>
          <div className="ml-5 h-px flex-1" style={{ background: borderColor }} />
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tracks.slice(1).map((track) => {
            const rgb = hexToRgb(track.color);

            return (
              <article
                key={track.id}
                className="group min-h-[260px] rounded-[24px] p-5 transition-all hover:-translate-y-0.5"
                style={{
                  background: cardBackground,
                  border: `1px solid ${borderColor}`,
                  boxShadow: isLight ? "0 18px 50px rgba(94,74,42,0.08)" : "none",
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold"
                  style={{
                    color: track.color,
                    borderColor: `rgba(${rgb}, 0.28)`,
                    background: `rgba(${rgb}, ${isLight ? "0.08" : "0.15"})`,
                  }}
                >
                  {track.code}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{track.title[language]}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.18em]" style={{ color: softColor }}>
                  {track.subtitle[language]}
                </p>
                <p className="mt-4 text-sm leading-7" style={{ color: mutedColor }}>
                  {track.desc[language]}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {track.tags.map((tag) => (
                    <span key={tag.en} className="rounded-full px-3 py-1 text-xs" style={{ color: mutedColor, border: `1px solid ${borderColor}` }}>
                      {tag[language]}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
