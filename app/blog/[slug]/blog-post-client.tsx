"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/app/components/language-provider";
import type { BlogPost } from "@/app/lib/blog-content";
import type { SiteLanguage } from "@/app/lib/site-language";

type BlogPostClientProps = {
  post: BlogPost;
};

const copy: Record<SiteLanguage, { back: string; dateLocale: string }> = {
  zh: {
    back: "返回博客",
    dateLocale: "zh-CN",
  },
  en: {
    back: "Back to blog",
    dateLocale: "en-US",
  },
};

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const { language } = useSiteLanguage();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/blog"
          className="inline-flex rounded-full border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-muted)] transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
        >
          {copy[language].back}
        </Link>

        <article className="mt-8 rounded-[32px] border border-[var(--app-border)] bg-[var(--app-surface)]/70 p-6 md:p-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--app-muted)]">
            {new Intl.DateTimeFormat(copy[language].dateLocale, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(post.publishedAt))}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">{post.title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">{post.excerpt}</p>

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

          <div className="mt-10 space-y-6 text-[var(--app-fg)]/90 [&_a]:underline [&_blockquote]:border-l [&_blockquote]:border-[var(--app-border-strong)] [&_blockquote]:pl-5 [&_blockquote]:text-[var(--app-muted)] [&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </section>
    </div>
  );
}
