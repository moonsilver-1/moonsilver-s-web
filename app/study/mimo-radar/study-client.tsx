"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";

type Section = {
  id: string;
  title: string;
  content: string;
};

export default function StudyClient({ sections }: { sections: Section[] }) {
  const { language } = useSiteLanguage();
  const mainRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const handleScroll = () => {
      const offsets = sections.map((s) => {
        const el = document.getElementById(s.id);
        if (!el) return { id: s.id, top: Infinity };
        return { id: s.id, top: el.getBoundingClientRect().top };
      });
      const visible = offsets
        .filter((o) => o.top <= 140)
        .sort((a, b) => b.top - a.top)[0];
      if (visible) setActiveId(visible.id);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const title = language === "zh" ? "MIMO 张量雷达" : "MIMO Tensor Radar";
  const subtitle =
    language === "zh"
      ? "从零开始的信号处理学习路径"
      : "A signal-processing study path from scratch";

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-24 text-[var(--app-fg)] transition-colors duration-300 page-enter">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:grid lg:grid-cols-[260px_1fr] lg:gap-12">
        {/* Sidebar TOC */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--app-muted)]">
              {language === "zh" ? "目录" : "Contents"}
            </p>
            <nav className="flex flex-col gap-1 border-l border-[var(--app-border)]">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`relative pl-4 text-left text-sm leading-6 transition-colors ${
                    activeId === s.id
                      ? "text-[var(--app-fg)]"
                      : "text-[var(--app-muted)] hover:text-[var(--app-fg)]"
                  }`}
                >
                  {activeId === s.id && (
                    <span className="absolute left-[-1px] top-1.5 h-4 w-[2px] rounded-full bg-[var(--app-fg)]" />
                  )}
                  {s.title}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="min-w-0">
          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--app-muted)] md:text-base">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-16">
            {sections.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-28 overflow-hidden rounded-[28px] border border-[var(--app-border)] bg-[var(--app-surface)]/60 p-6 backdrop-blur-sm transition-all duration-500 hover:border-[var(--app-border-strong)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] md:p-10"
              >
                <h2 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">
                  {section.title}
                </h2>
                <div
                  className="study-prose"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              </article>
            ))}
          </div>

          <div className="mt-20 border-t border-[var(--app-border)] pt-8 text-center text-xs text-[var(--app-muted)]">
            <p>
              {language === "zh"
                ? "持续更新中 · 基于多篇期刊论文整理"
                : "Work in progress · Curated from multiple journal papers"}
            </p>
          </div>
        </main>
      </div>

      {/* Mobile TOC bottom bar */}
      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 lg:hidden">
        <div className="flex max-w-[90vw] gap-1 overflow-x-auto rounded-full border border-[var(--app-border)] bg-[var(--app-surface)]/90 px-2 py-2 shadow-lg backdrop-blur-xl">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition-colors ${
                activeId === s.id
                  ? "bg-[var(--app-fg)] text-[var(--app-bg)]"
                  : "text-[var(--app-muted)] hover:text-[var(--app-fg)]"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
