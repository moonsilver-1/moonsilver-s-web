"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SearchBar from "@/app/components/search-bar";
import { useSiteLanguage } from "@/app/components/language-provider";
import { useThemeMode } from "@/app/lib/use-theme-mode";

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
    description: { zh: "职业向量速写", en: "Career vector mapping" },
    note: { zh: "测试", en: "Test" },
  },
  {
    href: "/fun/football",
    title: { zh: "足球", en: "Football" },
    description: { zh: "赛程 / 积分 / 射手榜", en: "Fixtures / standings / scorers" },
    note: { zh: "数据", en: "Data" },
  },
  {
    href: "/fun/2048",
    title: { zh: "2048", en: "2048" },
    description: { zh: "滑动合并，向一个角堆数字", en: "Slide and merge tiles toward one corner" },
    note: { zh: "游戏", en: "Game" },
  },
  {
    href: "/fun/tetris",
    title: { zh: "俄罗斯方块", en: "Tetris" },
    description: { zh: "俄罗斯方块", en: "Tetris" },
    note: { zh: "游戏", en: "Game" },
  },
  {
    href: "/fun/penalty-shootout",
    title: { zh: "点球大战", en: "Penalty Shootout" },
    description: { zh: "瞄准、射门、过门将", en: "Aim, shoot, and beat the keeper" },
    note: { zh: "游戏", en: "Game" },
  },
  {
    href: "/fun/birthday",
    title: { zh: "生日", en: "Birthday" },
    description: { zh: "大家的生日一目了然", en: "See everyone’s birthdays at a glance." },
    note: { zh: "日历", en: "Calendar" },
  },
  {
    href: "/fun/mahjong",
    title: { zh: "湖州麻将", en: "Huzhou Mahjong" },
    description: { zh: "碰杠吃胡，白板百搭", en: "Peng, gang, chi, hu — white board is joker" },
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
          description: "Pick something and start playing.",
          search: "Search games...",
          empty: "No matching games found.",
          footer: "Pick a module, then keep moving.",
          easterEggAria: "Inter easter egg",
        }
      : {
          label: "娱乐",
          title: "Fun",
          description: "点进去就能玩。",
          search: "搜索游戏...",
          empty: "没有找到匹配的内容。",
          footer: "选一个模块，然后继续往下走。",
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

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-20 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-end">
          <div className="max-w-2xl">
            <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.label}</span>
            <h1 className="mt-4 text-5xl font-bold tracking-tight md:text-7xl">{copy.title}</h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[var(--app-muted)] md:text-base">{copy.description}</p>
            <div className="mt-8">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={copy.search} />
            </div>
          </div>

          <div className="rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-5 backdrop-blur-sm">
            <div className="min-h-[260px] rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/55" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {showInterEasterEgg ? (
          <div
            aria-label={copy.easterEggAria}
            className={`mb-6 overflow-hidden rounded-[24px] border p-5 shadow-[0_18px_40px_rgba(5,11,23,0.22)] ${
              isLightTheme
                ? "border-[#9b7b25]/30 bg-[linear-gradient(135deg,#fff9e8_0%,#f0dfb9_45%,#d9b76d_100%)] text-[#1c1a17]"
                : "border-[#d4af37]/30 bg-[linear-gradient(135deg,#050b17_0%,#0b1730_42%,#0e3a78_100%)] text-white"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={`text-[11px] uppercase tracking-[0.3em] ${isLightTheme ? "text-[#8a6610]" : "text-[#d4af37]"}`}>Easter egg</p>
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

        <div className="rounded-[30px] border border-[var(--app-border)] bg-[var(--app-surface)]/55 p-3">
          {filteredEntries.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {filteredEntries.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="group min-h-52 rounded-[22px] border border-[var(--app-border)] p-5 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface)]/80"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--app-muted)]">{entry.note[language]}</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">{entry.title[language]}</h2>
                  <p className="mt-4 max-w-xs text-sm leading-7 text-[var(--app-muted)]">{entry.description[language]}</p>
                  <div className="mt-8 text-sm text-[var(--app-muted)] transition-transform group-hover:translate-x-1">-&gt;</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-[var(--app-muted)]">{copy.empty}</div>
          )}
        </div>

        <div className="mt-14">
          <div className="h-px bg-[var(--app-border)]" />
          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy.footer}</p>
        </div>
      </section>
    </div>
  );
}
