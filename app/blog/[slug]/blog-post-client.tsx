"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/app/components/language-provider";
import { PixelSceneBg } from "@/app/components/pixel-scene-bg";
import type { BlogPost } from "@/app/lib/blog-content";
import type { SiteLanguage } from "@/app/lib/site-language";

type BlogPostClientProps = {
  post: BlogPost;
};

const copy: Record<
  SiteLanguage,
  { back: string; dateLocale: string }
> = {
  zh: {
    back: "← 返回博客",
    dateLocale: "zh-CN",
  },
  en: {
    back: "← Back to blog",
    dateLocale: "en-US",
  },
};

export default function BlogPostClient({ post }: BlogPostClientProps) {
  const { language } = useSiteLanguage();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <PixelSceneBg />
      <section className="relative z-10 mx-auto max-w-4xl px-6 py-14">
        <Link href="/blog" className="pixel-btn !text-[13px]">
          {copy[language].back}
        </Link>

        <article className="pixel-panel mt-6 p-6 md:p-10">
          <p className="pixel-section-label !text-[9px]">
            {new Intl.DateTimeFormat(copy[language].dateLocale, {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }).format(new Date(post.publishedAt))}
          </p>
          <h1 className="pixel-title mt-4 text-2xl leading-relaxed md:text-4xl">{post.title}</h1>
          <p className="mt-4 max-w-3xl text-[13px] leading-7 text-[var(--app-muted)] md:text-sm">{post.excerpt}</p>

          {post.tags.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span key={tag} className="pixel-tag tag-lift text-[var(--app-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="pixel-inset mt-8 space-y-6 p-5 text-[var(--app-fg)]/95 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--sv-gold)] [&_blockquote]:pl-5 [&_blockquote]:text-[var(--app-muted)] [&_code]:bg-black/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-bold [&_img]:border-3 [&_img]:border-[var(--sv-border)] [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-8 [&_ul]:list-disc [&_ul]:pl-6">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </section>
    </div>
  );
}
