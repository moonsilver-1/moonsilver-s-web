"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import SearchBar from "@/app/components/search-bar";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";
import MiniRunnerClient from "./mini-runner/mini-runner-client";
import { AutumnLeavesBg } from "@/app/components/autumn-leaves-bg";

type Entry = {
  href: string;
  title: { zh: string; en: string };
  description: { zh: string; en: string };
  note: { zh: string; en: string };
};

const entries: Entry[] = [
  {
    href: "/fun/jobti",
    title: { zh: "Jobti", en: "Jobti" },
    description: { zh: "随便答几道题看看你适合干什么", en: "Answer a few questions and see what fits you" },
    note: { zh: "测试", en: "Test" },
  },
  {
    href: "/fun/2048",
    title: { zh: "2048", en: "2048" },
    description: { zh: "没事滑两下合成大数字", en: "Swipe around and chase bigger numbers" },
    note: { zh: "游戏", en: "Game" },
  },
  {
    href: "/fun/tetris",
    title: { zh: "俄罗斯方块", en: "Tetris" },
    description: { zh: "经典老游戏堆高了就消", en: "Old school stacking and clearing" },
    note: { zh: "游戏", en: "Game" },
  },
  {
    href: "/fun/birthday",
    title: { zh: "生日", en: "Birthday" },
    description: { zh: "看看朋友们的生日都在哪天", en: "Keep track of when friends were born" },
    note: { zh: "日历", en: "Calendar" },
  },
  {
    href: "/fun/mahjong",
    title: { zh: "湖州麻将", en: "Huzhou Mahjong" },
    description: { zh: "湖州本地玩法白板当万能牌", en: "Huzhou style mahjong with wildcards" },
    note: { zh: "游戏", en: "Game" },
  },
];

const storyEntry: Entry = {
  href: "/fun/story",
  title: { zh: "moonsilver的酒馆", en: "Moonsilver Tavern" },
  description: { zh: "阅读室", en: "Reading room" },
  note: { zh: "Story", en: "Story" },
};

const interEasterEggKeywords = ["inter"];
const storyKeywords = ["story"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesHiddenKeyword(query: string, keywords: string[]) {
  return keywords.includes(query);
}

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

export default function FunPage() {
  const { language } = useSiteLanguage();
  const theme = useThemeMode();
  const isLightTheme = theme === "light";
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = normalize(searchQuery);
  const showInterEasterEgg = matchesHiddenKeyword(normalizedQuery, interEasterEggKeywords);
  const showStoryEntry = matchesHiddenKeyword(normalizedQuery, storyKeywords);

  const copy =
    language === "en"
      ? {
          label: "Entertainment",
          title: "Fun",
          description: "Some stuff I built when I was bored",
          search: "Search games...",
          empty: "No matching games found.",
          footer: "Pick one and go",
          easterEggAria: "Inter easter egg",
        }
      : {
          label: "娱乐",
          title: "Fun",
          description: "无聊时候做的一些小东西",
          search: "搜点东西...",
          empty: "没找到相关的",
          footer: "随便挑一个玩玩",
          easterEggAria: "国米彩蛋",
        };

  const filteredEntries = useMemo(() => {
    if (showStoryEntry) {
      return [storyEntry];
    }

    if (!normalizedQuery) {
      return entries;
    }

    return entries.filter((entry) => {
      const haystack = [entry.title[language], entry.description[language], entry.note[language]].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [language, normalizedQuery, showStoryEntry]);

  const heroReveal = useScrollReveal(0.05);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <AutumnLeavesBg />
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div
          ref={heroReveal.ref}
          className={`grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-end transition-all duration-700 ${
            heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">
              {copy.label}
            </span>
            <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">{copy.title}</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--app-muted)] md:text-base">
              {copy.description}
            </p>
            <div className="mt-8">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={copy.search} />
            </div>
          </div>

          <MiniRunnerClient />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        {showInterEasterEgg ? (
          <div
            aria-label={copy.easterEggAria}
            className={`mb-6 overflow-hidden rounded-[24px] border p-5 shadow-[0_18px_40px_rgba(5,11,23,0.22)] transition-all duration-500 hover:shadow-[0_24px_60px_rgba(5,11,23,0.3)] ${
              isLightTheme
                ? "border-[#9b7b25]/30 bg-[linear-gradient(135deg,#fff9e8_0%,#f0dfb9_45%,#d9b76d_100%)] text-[#1c1a17]"
                : "border-[#d4af37]/30 bg-[linear-gradient(135deg,#050b17_0%,#0b1730_42%,#0e3a78_100%)] text-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] uppercase tracking-[0.3em] ${isLightTheme ? "text-[#8a6610]" : "text-[#d4af37]"}`}>
                  Easter egg
                </p>
                <h2 className={`mt-3 text-2xl font-semibold tracking-tight ${isLightTheme ? "text-[#10233f]" : "text-white"}`}>
                  FORZA INTER
                </h2>
                <p className={`mt-2 text-sm font-medium ${isLightTheme ? "text-[#5f480d]" : "text-[#f4df8c]"}`}>Two stars, one faith.</p>
                <p className={`mt-3 max-w-xl text-sm leading-6 ${isLightTheme ? "text-[#2d2a25]" : "text-white/80"}`}>
                  A hidden Nerazzurri corner, found by those who know.
                </p>
              </div>
              <div
                className={`hidden h-16 w-16 shrink-0 rounded-full border sm:block ${
                  isLightTheme
                    ? "border-[#8a6610]/20 bg-[radial-gradient(circle_at_30%_30%,rgba(138,102,16,0.85),rgba(138,102,16,0.14)_38%,transparent_62%)]"
                    : "border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.95),rgba(212,175,55,0.12)_38%,transparent_62%)]"
                }`}
              />
            </div>
          </div>
        ) : null}

        <div className="rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-3 backdrop-blur-sm">
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {filteredEntries.map((entry, index) => (
                <FunCard key={entry.href} entry={entry} index={index} language={language} />
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-[var(--app-muted)]">{copy.empty}</div>
          )}
        </div>

        <div className="mt-14">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--app-border)] to-transparent" />
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.footer}</p>
        </div>
      </section>
    </div>
  );
}

function FunCard({ entry, index, language }: { entry: Entry; index: number; language: "zh" | "en" }) {
  const { ref, visible } = useScrollReveal(0.1);
  const cardRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mouse-x", `${x}%`);
    card.style.setProperty("--mouse-y", `${y}%`);
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: `${Math.min(index * 60, 300)}ms` }}
    >
      <Link
        ref={cardRef}
        href={entry.href}
        onMouseMove={handleMouseMove}
        className="card-tilt-glow group relative block min-h-52 overflow-hidden rounded-[22px] border border-[var(--app-border)] p-5 transition-all duration-500 hover:border-[var(--app-border-strong)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--app-fg)]/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{entry.note[language]}</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight transition-transform duration-300 group-hover:translate-x-0.5">
          {entry.title[language]}
        </h2>
        <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--app-muted)]">{entry.description[language]}</p>
        <div className="link-arrow mt-8 text-sm text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-fg)]">
          <span className="arrow-icon">→</span>
        </div>
      </Link>
    </div>
  );
}
