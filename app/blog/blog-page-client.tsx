"use client";

import type { BlogPost } from "@/app/lib/blog-content";
import type { FeedEntry } from "@/app/lib/feed-content";
import { useSiteLanguage } from "@/app/components/language-provider";
import BlogContentClient from "./blog-content-client";
import { AutumnLeavesBg } from "@/app/components/autumn-leaves-bg";

type BlogPageClientProps = {
  posts: BlogPost[];
  feedEntries: FeedEntry[];
};

const copy = {
  zh: {
    eyebrow: "博客",
    title: "moonsilver 的博客",
    feedLabel: "订阅源",
    feedTitle: "John Lin feed",
    feedDescription: "展示来自 https://www.johnlin.top/feed.xml 的最新条目。",
    feedEmpty: "订阅源暂时不可用。",
    feedOpen: "打开订阅源",
  },
  en: {
    eyebrow: "Blog",
    title: "moonsilver blog",
    feedLabel: "Subscription",
    feedTitle: "John Lin feed",
    feedDescription: "Latest items pulled from https://www.johnlin.top/feed.xml.",
    feedEmpty: "Feed is temporarily unavailable.",
    feedOpen: "Open feed",
  },
} as const;

export default function BlogPageClient({ posts, feedEntries }: BlogPageClientProps) {
  const { language } = useSiteLanguage();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <AutumnLeavesBg />
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy[language].eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{copy[language].title}</h1>
        </div>
      </section>

      <BlogContentClient posts={posts} />
    </div>
  );
}

function formatDate(value: string, language: "zh" | "en") {
  if (!value) {
    return "";
  }

  const locale = language === "zh" ? "zh-CN" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
