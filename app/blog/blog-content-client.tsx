"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SearchBar from "@/app/components/search-bar";
import { useSiteLanguage } from "@/app/components/language-provider";
import type { BlogPost } from "@/app/lib/blog-content";
import type { SiteLanguage } from "@/app/lib/site-language";

interface BlogContentClientProps {
  posts: BlogPost[];
}

const copy: Record<
  SiteLanguage,
  {
    search: string;
    readMore: string;
    emptyWithPosts: string;
    emptyWithoutPosts: string;
    dateLocale: string;
  }
> = {
  zh: {
    search: "搜索文章...",
    readMore: "阅读文章",
    emptyWithPosts: "没有找到匹配的文章。",
    emptyWithoutPosts: "还没有文章。去 `content/blog` 里新增一个文本文件吧。",
    dateLocale: "zh-CN",
  },
  en: {
    search: "Search posts...",
    readMore: "Read article",
    emptyWithPosts: "No matching posts found.",
    emptyWithoutPosts: "No posts yet. Add a text file in `content/blog`.",
    dateLocale: "en-US",
  },
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function formatBlogDate(value: string, language: SiteLanguage) {
  return new Intl.DateTimeFormat(copy[language].dateLocale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default function BlogContentClient({ posts }: BlogContentClientProps) {
  const { language } = useSiteLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query) {
      return posts;
    }

    return posts.filter((post) => {
      const haystack = [post.title, post.excerpt, post.tags.join(" ")].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [posts, searchQuery]);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24">
      <div className="mb-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={copy[language].search} />
      </div>

      {filteredPosts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {formatBlogDate(post.publishedAt, language)}
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[var(--app-fg)]">{post.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--app-muted)]">{post.excerpt}</p>

              {post.tags.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--app-border)] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--app-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              <span className="mt-6 inline-flex text-sm text-[var(--app-fg)]/70 transition-colors group-hover:text-[var(--app-fg)]">
                {copy[language].readMore}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[var(--app-border)] bg-[var(--app-surface)]/60 p-10 text-sm text-[var(--app-muted)]">
          {posts.length === 0 ? copy[language].emptyWithoutPosts : copy[language].emptyWithPosts}
        </div>
      )}
    </section>
  );
}
