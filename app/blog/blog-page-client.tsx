"use client";

import type { BlogPost } from "@/app/lib/blog-content";
import type { FeedEntry } from "@/app/lib/feed-content";
import { useSiteLanguage } from "@/app/components/language-provider";
import BlogContentClient from "./blog-content-client";

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
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy[language].eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{copy[language].title}</h1>
        </div>
      </section>

      <BlogContentClient posts={posts} />

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <aside className="rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">{copy[language].feedLabel}</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{copy[language].feedTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">{copy[language].feedDescription}</p>

          <div className="mt-6 space-y-3">
            {feedEntries.length > 0 ? (
              feedEntries.map((entry) => (
                <a
                  key={`${entry.link}-${entry.publishedAt}`}
                  href={entry.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg)]/40 p-4 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-bg)]/60"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{formatDate(entry.publishedAt, language)}</p>
                  <h3 className="mt-2 text-base font-medium text-[var(--app-fg)]">{entry.title}</h3>
                  {entry.summary ? <p className="mt-2 text-sm leading-relaxed text-[var(--app-muted)]">{entry.summary}</p> : null}
                </a>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-bg)]/30 p-4 text-sm text-[var(--app-muted)]">
                {copy[language].feedEmpty}
              </div>
            )}
          </div>

          <a
            href="https://www.johnlin.top/feed.xml"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            {copy[language].feedOpen}
          </a>
        </aside>
      </section>
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
