"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type React from "react";
import Link from "next/link";
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

type StoryMilestone = {
  id: string;
  tag: LocaleText;
  title: LocaleText;
  metric: LocaleText;
  note: LocaleText;
  iconImg: string;
};

type ContestAct = {
  id: string;
  themeTitle: LocaleText;
  themeEpigraph: LocaleText;
  badgeTone: string;
  items: Array<{
    id: string;
    level: "ams" | "national-2" | "national-3" | "provincial-1" | "provincial-2" | "provincial-3" | "silver" | "bronze";
    award: LocaleText;
    name: LocaleText;
    storySnippet: LocaleText;
  }>;
};

type ResearchLog = {
  id: string;
  stage: LocaleText;
  title: LocaleText;
  subtitle: LocaleText;
  narrative: LocaleText;
  stats: LocaleText;
};

const academicMilestones: StoryMilestone[] = [
  {
    id: "m_nat_scholarship",
    tag: { zh: "学业之冠", en: "Apex Honor" },
    title: { zh: "国家奖学金", en: "National Scholarship" },
    metric: { zh: "国家教育部评定 顶尖0.2%", en: "Top 0.2% by Ministry of Education" },
    note: {
      zh: "数载晨昏披星戴月，以踏实学力问鼎国家级最高荣誉学业奖项。",
      en: "Years of dedicated scholarly pursuit rewarded with the nation's premier academic honor.",
    },
    iconImg: "/images/badges/shield.jpg",
  },
  {
    id: "m_comp_eval",
    tag: { zh: "知行合一", en: "Comprehensive" },
    title: { zh: "综合测评专业第一", en: "1st in Comprehensive Evaluation" },
    metric: { zh: "总评 104.77 排名 1/756", en: "Score 104.77   Rank 1/756" },
    note: {
      zh: "不唯分数，兼修科技竞赛、社会实践与思想品格，立德笃行。",
      en: "Synthesizing academics, competitive research, and social engagement.",
    },
    iconImg: "/images/badges/growth.jpg",
  },
  {
    id: "m_gpa",
    tag: { zh: "格物致知", en: "Academic Rigor" },
    title: { zh: "平均学分绩点 4.61 / 5", en: "Cumulative GPA 4.61 / 5" },
    metric: { zh: "前三年专业排名 4/249", en: "Rank 4/249 in Major" },
    note: {
      zh: "在自动化新工科实验班的高压专业课中，保持全学科卓越与严谨自律。",
      en: "Maintaining exceptional rigor across complex automation engineering curricula.",
    },
    iconImg: "/images/badges/scales.jpg",
  },
  {
    id: "m_prov_scholarship",
    tag: { zh: "笃志钱塘", en: "Provincial Honor" },
    title: { zh: "浙江省政府奖学金", en: "Zhejiang Provincial Scholarship" },
    metric: { zh: "省人民政府联合表彰", en: "Conferred by Provincial Government" },
    note: {
      zh: "植根之江大地，扎根工程实践，行囊沉甸，步履不停。",
      en: "Rooted in Zhejiang's fertile soil of engineering and technological innovation.",
    },
    iconImg: "/images/badges/matrix.jpg",
  },
];

const contestActs: ContestAct[] = [
  {
    id: "act_math",
    themeTitle: { zh: "第一幕 算理观天 数模天下", en: "Act I The Calculus of Reason MCM Modeling" },
    themeEpigraph: {
      zh: "三天四夜不灭的灯火，从白纸推演至万行代码。在纷繁世界变量中，以数学之眼洞察万物脉络。",
      en: "Four sleepless nights of mathematical derivation and code, distilling the world's variables into pure truth.",
    },
    badgeTone: "autumn-badge-rose",
    items: [
      {
        id: "c_mcm_ams",
        level: "ams",
        award: { zh: "AMS奖 全球第一名（特等奖提名冠名）", en: "AMS Award 1st Worldwide" },
        name: { zh: "美国大学生数学建模竞赛（MCM / ICM）", en: "Mathematical Contest in Modeling" },
        storySnippet: {
          zh: "与全球万支名校团队竞逐，获美国数学学会 AMS 冠名特等奖，站在世界数学建模最高领奖台。",
          en: "Standing atop global teams to secure the American Mathematical Society distinction.",
        },
      },
      {
        id: "c_cumcm_p1",
        level: "provincial-1",
        award: { zh: "浙江省一等奖", en: "Provincial 1st Prize" },
        name: { zh: "全国大学生数学建模竞赛（国赛）", en: "National Mathematical Modeling Contest (CUMCM)" },
        storySnippet: {
          zh: "国赛攻坚七十二小时，以严密的动态规划与全局优化模型破解工业工程难题。",
          en: "72 hours of intensive modeling solving critical industrial engineering challenges.",
        },
      },
      {
        id: "c_apmcm_cn",
        level: "national-2",
        award: { zh: "全国二等奖", en: "National 2nd Prize" },
        name: { zh: "亚太地区大学生数学建模竞赛（中文赛道）", en: "APMCM Mathematical Modeling (Chinese)" },
        storySnippet: {
          zh: "聚焦复杂生态动力学演进，融合机器学习算法完成鲁棒预测。",
          en: "Ecological dynamics modeling integrated with robust machine learning predictors.",
        },
      },
      {
        id: "c_apmcm_en",
        level: "national-2",
        award: { zh: "全国二等奖", en: "National 2nd Prize" },
        name: { zh: "亚太地区大学生数学建模竞赛（全英文赛道）", en: "APMCM Mathematical Modeling (English)" },
        storySnippet: {
          zh: "全英文技术论文撰写，面向跨国评审团清晰呈现多维算法结构。",
          en: "Complete technical manuscript in English defended before international reviewers.",
        },
      },
    ],
  },
  {
    id: "act_hardware",
    themeTitle: { zh: "第二幕 智车破晓 极客创研", en: "Act II The Silicon Pulse Smart Systems & Robotics" },
    themeEpigraph: {
      zh: "示波器的荧光与电烙铁的微烟，在深夜实验室调试千百次微秒响应，赋予冷冰机械感知与速度。",
      en: "Faint solder smoke and oscilloscope glows, tuning microsecond loops until silicon springs to life.",
    },
    badgeTone: "autumn-badge-gold",
    items: [
      {
        id: "c_smartcar",
        level: "national-2",
        award: { zh: "全国二等奖", en: "National 2nd Prize" },
        name: { zh: "全国大学生智能汽车竞赛", en: "National University Smart Car Competition" },
        storySnippet: {
          zh: "自主设计高速差分运放电路与视觉引导控制，赛道上以极速循迹漂移破风驰骋。",
          en: "Custom differential amplifier PCB and optical tracking navigating high-speed tracks.",
        },
      },
      {
        id: "c_physics",
        level: "provincial-1",
        award: { zh: "浙江省一等奖 直通国赛", en: "Provincial 1st Advanced to Nationals" },
        name: { zh: "浙江省大学生物理实验与科技创新竞赛", en: "Physics Experiment & Tech Innovation" },
        storySnippet: {
          zh: "深入微观物理机制，设计高灵敏度空间测量装置，全省决胜直通全国舞台。",
          en: "Precision physical instrumentation that won provincial first and a national berth.",
        },
      },
      {
        id: "c_comp_design",
        level: "provincial-2",
        award: { zh: "浙江省二等奖", en: "Provincial 2nd Prize" },
        name: { zh: "中国大学生计算机设计大赛", en: "China University Computer Design Contest" },
        storySnippet: {
          zh: "融合前沿计算机图形与智能算法，打造高交互度的端云协同软件系统。",
          en: "Cross-platform intelligent interactive system uniting graphics and edge compute.",
        },
      },
      {
        id: "c_robotics",
        level: "provincial-3",
        award: { zh: "三等奖 × 2", en: "3rd Prize (Double)" },
        name: { zh: "浙江省人工智能竞赛 & 智能机器人创意赛", en: "Zhejiang AI & Robotics Creativity Contest" },
        storySnippet: {
          zh: "从多模态神经网络到多轴机械联动，探索智能体在现实物理空间的具身表达。",
          en: "Embodied intelligence from multimodal deep nets to multi-axis mechanical articulation.",
        },
      },
    ],
  },
  {
    id: "act_industry",
    themeTitle: { zh: "第三幕 潮起之江 创变破局", en: "Act III Industrial Frontiers Impact & Innovation" },
    themeEpigraph: {
      zh: "走出象牙塔，让技术穿透实验室窗扉，在产业深水区与社会真实需求里生根发芽。",
      en: "Taking engineering out of textbook pages and planting real algorithms into industrial workflows.",
    },
    badgeTone: "autumn-badge-purple",
    items: [
      {
        id: "c_innov_silver",
        level: "silver",
        award: { zh: "浙江省银奖", en: "Provincial Silver Medal" },
        name: { zh: "中国国际大学生创新大赛（互联网+）", en: "China International College Students Innovation" },
        storySnippet: {
          zh: "高科技成果转化与产学研模式验证，经受行业专家与投资机构严苛路演答辩。",
          en: "Commercializing lab innovations through rigorous investor pitch defense.",
        },
      },
      {
        id: "c_challenge_cup",
        level: "bronze",
        award: { zh: "浙江省铜奖", en: "Provincial Bronze Medal" },
        name: { zh: "“挑战杯”大学生创业计划竞赛（人工智能+专项）", en: "Challenge Cup AI+ Special Track" },
        storySnippet: {
          zh: "探索大模型与实体经济垂直场景融合，赋能智能制造降本增效。",
          en: "Targeting generative AI applications inside high-precision manufacturing pipelines.",
        },
      },
      {
        id: "c_service_outsourcing_nat",
        level: "national-3",
        award: { zh: "全国三等奖 & 东部赛区二等奖", en: "National 3rd & Eastern Regional 2nd" },
        name: { zh: "中国大学生服务外包创新创业大赛", en: "China Service Outsourcing Innovation Contest" },
        storySnippet: {
          zh: "紧扣头部企业真实业务命题，全栈交付高可用数智化解决方案。",
          en: "Delivering production-grade enterprise software directly addressing corporate briefs.",
        },
      },
      {
        id: "c_net_culture",
        level: "national-2",
        award: { zh: "全国二等奖", en: "National 2nd Prize" },
        name: { zh: "全国高校网络文化技术创新大会", en: "National Campus Network Culture Tech Conference" },
        storySnippet: {
          zh: "技术与人文精神共振，运用数字艺术与前端工程构筑温暖的校园文化桥梁。",
          en: "Harmonizing digital artistry and web engineering for campus cultural enrichment.",
        },
      },
    ],
  },
];

const researchLogs: ResearchLog[] = [
  {
    id: "r_thu",
    stage: { zh: "前沿浸润 2024", en: "Immersion 2024" },
    title: { zh: "清华大学 Radar & Signal Lab 科研实习", en: "Internship at THU Radar & Signal Lab" },
    subtitle: { zh: "五道口五月清风 探微雷达信号处理", en: "Five Months at Tsinghua Radar & Signal Lab" },
    narrative: {
      zh: "沉浸于雷达与信号处理顶尖课题组，与导师和博士团队并肩。从微弱信号探测、空间阵列流型到高分辨率谱估计，以矩阵与算法还原波束背后的真实世界。",
      en: "Five months immersed in advanced array signal processing and radar waveform analysis alongside leading faculty and doctoral scholars.",
    },
    stats: { zh: "完成5个月全职科研 深度参与国家级重点课题实验验证", en: "5 Months Full-time   High-resolution Spectrum Estimation" },
  },
  {
    id: "r_national_project",
    stage: { zh: "独立挂帅 2026", en: "Leadership   2026" },
    title: { zh: "国家级大学生创新创业训练计划（项目负责人）", en: "National Innovation Training Program (Leader)" },
    subtitle: { zh: "从白纸选题到独立结题的完整闭环", en: "Principal Investigator National Level" },
    narrative: {
      zh: "以第一负责人身份主持国家级大创项目，带领跨学科团队完成从前沿选题、数学建模、硬件选型到系统实测的全部流程，培育严密的工程闭环能力。",
      en: "Leading a multidisciplinary engineering team through hypothesis, system architecture, prototyping, and rigorous field testing.",
    },
    stats: { zh: "教育部国家级立项批准 带领4人跨专业攻坚组", en: "National Grant Approved 4-member squad" },
  },
  {
    id: "r_papers",
    stage: { zh: "学术立言 论文与审稿", en: "Scholarship Papers & Peer Review" },
    title: { zh: "顶级学术会议论文与国际同行审稿", en: "Publications in Tier-1 Venues & Peer Reviewing" },
    subtitle: { zh: "以第一作者与国际学术共同体直接对话", en: "First-author Manuscripts & Invited Reviewer Role" },
    narrative: {
      zh: "以第一作者录用国际会议学术论文一篇，以第一作者投稿国际顶级会议 CCF-A 类 WWW 与中科院二区权威期刊 IEEE T-REL，以共同第一作者投稿信号处理旗舰会议 CCF-B 类 ICASSP 并受邀担任同行审稿人。在文字与审稿意见的切磋中，淬炼严谨求实的学者底色。",
      en: "One first-author paper accepted; first-author submissions to WWW (CCF-A) and IEEE T-REL (CAS Q2); co-first author submission to ICASSP (CCF-B) with invited peer reviewer appointments.",
    },
    stats: { zh: "录用1篇 投稿CCF-A / 中科院二区 / CCF-B各一篇 获邀国际审稿", en: "1 Accepted 3 Under Review (CCF-A/B, IEEE) Active Peer Reviewer" },
  },
  {
    id: "r_patents",
    stage: { zh: "知产筑基 实体沉淀", en: "Patents Practical Assets" },
    title: { zh: "7 项国家发明专利授权与公开", en: "7 Granted & Published National Invention Patents" },
    subtitle: { zh: "让实验室灵光凝结为可触摸的科技资产", en: "Translating Ingenuity into Protected Engineering Assets" },
    narrative: {
      zh: "拒绝纸上谈兵，将算法创新与系统设计深度结合，累计参与发明专利授权与公开发布 7 项，涵盖信号解算、智能控制与边缘软硬件融合架构。",
      en: "Bridging theoretical algorithms and practical industry IP with 7 granted or published invention patents.",
    },
    stats: { zh: "累计 7 项国家发明专利 涵盖信号解析与软硬件协同系统", en: "7 Invention Patents Filed Signal & Intelligent Control" },
  },
];

const weatherLabel = {
  zh: { sunny: "晴朗", cloudy: "多云", windy: "起风", rainy: "细雨" },
  en: { sunny: "Sunny", cloudy: "Cloudy", windy: "Windy", rainy: "Rainy" },
} as const;

const awardBadgeClass: Record<string, string> = {
  ams: "px-2 py-0.5 rounded text-[11px] font-bold bg-rose-900/80 text-rose-200 border border-rose-500/60 shadow-sm",
  "national-2": "px-2 py-0.5 rounded text-[11px] font-bold bg-amber-900/80 text-amber-200 border border-amber-500/60 shadow-sm",
  "national-3": "px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-sm",
  "provincial-1": "px-2 py-0.5 rounded text-[11px] font-bold bg-blue-900/80 text-blue-200 border border-blue-500/60 shadow-sm",
  "provincial-2": "px-2 py-0.5 rounded text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-600/50 shadow-sm",
  "provincial-3": "px-2 py-0.5 rounded text-[11px] font-bold bg-stone-900/80 text-stone-300 border border-stone-600 shadow-sm",
  silver: "px-2 py-0.5 rounded text-[11px] font-bold bg-purple-900/80 text-purple-200 border border-purple-500/60 shadow-sm",
  bronze: "px-2 py-0.5 rounded text-[11px] font-bold bg-stone-800 text-amber-200 border border-stone-600 shadow-sm",
};

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
  deadline: i,
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

export default function MyPersonalPage() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const isDay = theme === "light";
  const weather = useMemo(() => dailyWeather(), []);
  const isEnglish = language === "en";
  const [activeActId, setActiveActId] = useState<string>("act_math");

  return (
    <div className="home-page relative min-h-screen overflow-hidden text-[var(--app-fg)] font-serifSc selection:bg-[#f6b262] selection:text-[#381f13]">
      
      {/* 农场动态天象背景 */}
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

      {/* 卷首   银月絮语与主视觉 */}
      <section className="autumn-hero relative z-10 flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20">
        <div className="autumn-hero-panel home-fade-up relative z-10 mx-auto max-w-4xl px-4 py-8 text-center md:py-12">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#381a0b]/80 border border-[#d49b55] text-[#ffdf79] text-xs font-mono mb-6 shadow-md backdrop-blur-sm">
            <span>✦</span>
            <span>{isEnglish ? "AUTUMN MOON CHRONICLES OF GROWTH" : "银月秋风 求索与躬耕录"}</span>
            <span>✦</span>
            <span>{weatherLabel[language][weather]}</span>
          </div>

          <h1
            className="font-artistic home-reveal text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[#ffe89c] via-[#ffdf79] to-[#eedcb1] tracking-[0.2em] font-bold mb-4 drop-shadow-[0_4px_16px_rgba(212,155,85,0.4)]"
            style={{ textShadow: "4px 4px 0 #2b1408" }}
          >
            MOONSILVER
          </h1>

          <p className="font-serifSc text-sm sm:text-base text-[#eedcb1] max-w-xl mx-auto leading-relaxed italic mb-8">
            {isEnglish
              ? "Someday, the quiet fragrance of persistence will wander far and wide."
              : "终有一天馥郁传香 在算力与电路的坚硬骨骼里，盛放诗意与远方"}
          </p>

          <div className="mt-4 flex justify-center">
            <FarmCard />
          </div>

          {/* 快捷跳转星盘徽章 */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-serifSc">
            <Link
              href="/six"
              className="px-3.5 py-1.5 rounded-lg bg-[#4a2411]/90 hover:bg-[#5b2b14] border border-[#d49b55] text-[#ffdf79] font-bold shadow flex items-center gap-2 transition-all hover:scale-105"
            >
              <img src="/images/icons/scroll.jpg" alt="评判系统" className="w-4 h-4 rounded object-cover" />
              <span>{isEnglish ? "Enter E-Judge Lab" : "职务智能评判系统"}</span>
            </Link>

            <Link
              href="/blog"
              className="px-3.5 py-1.5 rounded-lg bg-[#2b180d]/80 hover:bg-[#3d2012] border border-[#eedcb1]/40 text-[#eedcb1] shadow flex items-center gap-2 transition-all hover:scale-105"
            >
              <img src="/images/icons/quill.jpg" alt="技术随笔" className="w-4 h-4 rounded object-cover" />
              <span>{isEnglish ? "Essays & Musings" : "思考长廊与技术随笔"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 卷一   砚田晨昏   躬耕之阶 */}
      <RevealSection className="mx-auto max-w-5xl px-6 py-14 relative z-20">
        <div className="border-b-2 border-[#5b2b14]/40 pb-4 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-[#d49b55] font-mono tracking-widest uppercase">
            <span>CHAPTER 01</span>
            <span>✦</span>
            <span>{isEnglish ? "SCHOLARLY CULTIVATION" : "砚田晨昏"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#ffdf79] mt-1 font-serifSc tracking-wide">
            {isEnglish ? "Academic Foundation & Quiet Milestones" : "躬耕之阶 沉潜的学力印记"}
          </h2>
          <p className="text-xs sm:text-sm text-[#eedcb1]/75 mt-2 leading-relaxed max-w-2xl font-serifSc">
            {isEnglish
              ? "Quiet mornings and midnight lamps in the automation labs, turning foundational disciplines into steadfast roots."
              : "不喧哗的晨昏，在自动化新工科实验班里深潜。学问如春圃之苗，不见其增，日有所长。"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {academicMilestones.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-[#5b2b14] bg-[#24130a]/85 hover:bg-[#34180a] transition-all flex flex-col justify-between shadow-lg group hover:border-[#d49b55]/70 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55] font-mono">
                    {item.tag[language]}
                  </span>
                  <img
                    src={item.iconImg}
                    alt={item.title.zh}
                    className="w-6 h-6 rounded border border-[#d49b55] object-cover group-hover:rotate-6 transition-transform"
                  />
                </div>
                <h3 className="text-lg font-bold text-[#ffdf79] font-serifSc mb-1">
                  {item.title[language]}
                </h3>
                <div className="text-xs font-mono text-[#d49b55] font-bold mb-3">
                  {item.metric[language]}
                </div>
                <p className="text-xs text-[#eedcb1]/80 leading-relaxed font-serifSc">
                  {item.note[language]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* 卷二   淬火成芒   竞技远征 */}
      <RevealSection className="mx-auto max-w-5xl px-6 py-14 relative z-20">
        <div className="border-b-2 border-[#5b2b14]/40 pb-4 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-[#d49b55] font-mono tracking-widest uppercase">
            <span>CHAPTER 02</span>
            <span>✦</span>
            <span>{isEnglish ? "COMPETITIVE CRUCIBLE" : "竞技远征"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#ffdf79] mt-1 font-serifSc tracking-wide">
            {isEnglish ? "The Crucible of Contests Three Epic Acts" : "淬火成芒 三幕竞技远征录"}
          </h2>
          <p className="text-xs sm:text-sm text-[#eedcb1]/75 mt-2 leading-relaxed max-w-2xl font-serifSc">
            {isEnglish
              ? "From mathematical derivations in international arenas to trackside microsecond debugging, forging intellect into cutting edges."
              : "不再是冰冷的奖项堆砌，而是三次跨越山海的技术远征。算理为引，机械为翼，直面现实世界的未解方程。"}
          </p>

          {/* 三幕选卡标签 */}
          <div className="flex flex-wrap gap-2 mt-6">
            {contestActs.map((act) => {
              const isActive = activeActId === act.id;
              return (
                <button
                  key={act.id}
                  onClick={() => setActiveActId(act.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-serifSc font-bold transition-all border ${
                    isActive
                      ? "bg-[#5b2b14] text-[#ffdf79] border-[#d49b55] shadow-pixel"
                      : "bg-[#2b1408]/70 text-[#eedcb1]/70 border-[#4a2411] hover:text-[#ffdf79] hover:bg-[#381a0b]"
                  }`}
                >
                  {act.themeTitle[language].split(" ")[1]?.trim() || act.themeTitle[language]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 当前选中幕次卡片流 */}
        {contestActs
          .filter((act) => act.id === activeActId)
          .map((act) => (
            <div key={act.id} className="space-y-4 animate-fadeIn">
              
              {/* 幕前题记 */}
              <div className="p-3.5 rounded-lg bg-[#241107]/90 border border-[#5b2b14] text-xs text-[#eedcb1]/85 italic leading-relaxed font-serifSc flex items-center gap-3">
                <span className="text-lg text-[#ffdf79]">✦</span>
                <span>{act.themeEpigraph[language]}</span>
              </div>

              {/* 细目列表 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {act.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-[#5b2b14] bg-[#2b1408]/85 hover:bg-[#34180a] transition-all flex flex-col justify-between shadow"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-[#ffdf79] font-serifSc leading-snug">
                          {item.name[language]}
                        </h4>
                        <span className={awardBadgeClass[item.level] || awardBadgeClass["provincial-1"]}>
                          {item.award[language]}
                        </span>
                      </div>
                      <p className="text-xs text-[#eedcb1]/75 leading-relaxed font-serifSc">
                        {item.storySnippet[language]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </RevealSection>

      {/* 卷三   探微索隐   灯塔航程 */}
      <RevealSection className="mx-auto max-w-5xl px-6 py-14 relative z-20">
        <div className="border-b-2 border-[#5b2b14]/40 pb-4 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-[#d49b55] font-mono tracking-widest uppercase">
            <span>CHAPTER 03</span>
            <span>✦</span>
            <span>{isEnglish ? "SCIENTIFIC EXPEDITIONS" : "探微索隐"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#ffdf79] mt-1 font-serifSc tracking-wide">
            {isEnglish ? "Research Journal Signals & Horizons" : "灯塔航程 实验室探微日记"}
          </h2>
          <p className="text-xs sm:text-sm text-[#eedcb1]/75 mt-2 leading-relaxed max-w-2xl font-serifSc">
            {isEnglish
              ? "From five months at Tsinghua's radar lab to CCF-A peer reviews and patents, pursuing clarity amidst noisy signals."
              : "雷达波束在介质间穿梭，算法在矩阵中求解。让思考化作前沿文献与可触摸的技术资产。"}
          </p>
        </div>

        <div className="space-y-4">
          {researchLogs.map((log, idx) => (
            <div
              key={log.id}
              className="p-5 rounded-xl border-2 border-[#5b2b14] bg-[#2b1408]/90 hover:bg-[#34180a] transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#4a2411] text-[#ffdf79] border border-[#d49b55]">
                    {log.stage[language]}
                  </span>
                  <span className="text-xs font-mono text-[#d49b55]">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#ffdf79] font-serifSc">
                  {log.title[language]}
                </h3>

                <p className="text-xs text-[#ffdf79]/80 font-serifSc italic">
                  {log.subtitle[language]}
                </p>

                <p className="text-xs text-[#eedcb1]/80 leading-relaxed font-serifSc pt-1">
                  {log.narrative[language]}
                </p>
              </div>

              <div className="md:border-l md:border-[#5b2b14]/50 md:pl-5 shrink-0">
                <div className="p-3 rounded-lg bg-[#200d04] border border-[#4a2411] text-xs font-mono text-[#d49b55] text-center md:text-right max-w-xs">
                  {log.stats[language]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </RevealSection>

      {/* 卷尾   行囊与未竟之路 */}
      <RevealSection className="mx-auto max-w-5xl px-6 py-16 relative z-20">
        <div className="p-8 sm:p-12 rounded-3xl border border-[#d49b55]/80 bg-gradient-to-b from-[#24130a]/95 via-[#1a0c05]/98 to-[#100602]/98 text-center space-y-6 shadow-[0_16px_50px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-md">
          
          <div className="w-10 h-10 rounded-full bg-[#4a2411] border border-[#d49b55] text-[#ffdf79] font-serif flex items-center justify-center mx-auto text-sm shadow">
            ✦
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-[#ffe89c] font-artistic drop-shadow-[0_2px_10px_rgba(255,223,121,0.3)]">
            {isEnglish ? "The Harvest Season & The Unfinished Trail" : "麦穗金黄   行囊与未竟的远方"}
          </h3>

          <p className="text-xs sm:text-sm text-[#f5e6cc] max-w-2xl mx-auto leading-relaxed font-serif italic">
            {isEnglish
              ? "Honors are merely wildflowers gathered along the trail. What truly endures is the soul that derived equations into dawn and still gazes upon the starlight."
              : "麦穗已在秋风中垂首，而星光依然在夜空深处闪烁。所谓奖项不过是远征沿途采下的野花与矿石。真正珍贵的，是那个在深夜台灯下专注推导、在星空草丘上依然仰望未来的灵魂。"}
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-serifSc">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-[#381a0b] hover:bg-[#4a2411] border border-[#d49b55] text-[#ffdf79] font-bold transition-all shadow"
            >
              {isEnglish ? "Return to Starlit Home" : "返回浩瀚星空主页"}
            </Link>

            <Link
              href="/six"
              className="px-4 py-2 rounded-lg bg-[#5b2b14] hover:bg-[#6e3519] border border-[#ffdf79] text-[#ffdf79] font-bold transition-all shadow"
            >
              {isEnglish ? "Explore E-Judge System" : "进入职务智能评判大厅"}
            </Link>
          </div>

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
      className={`transition-opacity duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
