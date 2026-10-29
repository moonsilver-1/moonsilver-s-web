"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteLanguage } from "@/app/components/language-provider";
import { initSfxMuted, isSfxMuted, setSfxMuted } from "@/app/lib/pixel-sfx";

const footerLabels = {
  zh: {
    friendSite: "友站",
    backToTop: "回到顶部",
    madeWith: "用心搭建 · 像素风小站",
    companion: (days: number) => `小鸡已陪伴你 ${days} 天`,
    sound: "音效",
  },
  en: {
    friendSite: "Friend site",
    backToTop: "Back to top",
    madeWith: "Built with care · pixel style",
    companion: (days: number) => `Chicken has been with you for ${days} day${days === 1 ? "" : "s"}`,
    sound: "SFX",
  },
} as const;

const FIRST_VISIT_KEY = "first-visit-day";

function readFirstVisitDay(): string {
  const today = new Date().toISOString().slice(0, 10);
  const stored = window.localStorage.getItem(FIRST_VISIT_KEY);
  if (stored) return stored;
  window.localStorage.setItem(FIRST_VISIT_KEY, today);
  return today;
}

function companionDays(): number {
  const first = readFirstVisitDay();
  const diff = Date.now() - new Date(`${first}T00:00:00`).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

export function SiteFooter() {
  const { language } = useSiteLanguage();
  const labels = footerLabels[language];
  const [days, setDays] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setDays(companionDays());
    initSfxMuted();
    setMuted(isSfxMuted());
  }, []);

  function toggleMuted() {
    const next = !muted;
    setSfxMuted(next);
    setMuted(next);
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="pixel-footer relative px-4 py-8 text-xs md:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-full h-[10px]"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--sv-grass-lo) 0 16px, var(--sv-grass) 16px 32px)",
          borderTop: "3px solid var(--sv-border)",
        }}
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <p className="font-brand text-[10px] tracking-[0.18em]" style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
            © {new Date().getFullYear()} MOONSILVER
          </p>
          <p className="opacity-70">{labels.madeWith}</p>
          <p className="opacity-90">🐔 {labels.companion(days)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={toggleMuted} className="pixel-btn !px-3 !py-1.5 !text-xs">
            {muted ? "🔇" : "🔊"} {labels.sound}
          </button>
          <a href="https://www.johnlin.top/" target="_blank" rel="noreferrer" className="pixel-btn !px-3 !py-1.5 !text-xs">
            johnlin
          </a>
          <a href="https://www.hdu-wiki.cn/" target="_blank" rel="noreferrer" className="pixel-btn !px-3 !py-1.5 !text-xs">
            hdu-wiki
          </a>
          <button type="button" onClick={scrollToTop} className="pixel-btn !px-3 !py-1.5 !text-xs">
            ▲ {labels.backToTop}
          </button>
        </div>
      </div>
    </footer>
  );
}
