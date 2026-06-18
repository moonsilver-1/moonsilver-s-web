"use client";

import Link from "next/link";
import { useSiteLanguage } from "@/app/components/language-provider";

const footerLabels = {
  zh: {
    friendSite: "友站",
    backToTop: "回到顶部",
    madeWith: "用心制作",
  },
  en: {
    friendSite: "Friend site",
    backToTop: "Back to top",
    madeWith: "Made with care",
  },
} as const;

export function SiteFooter() {
  const { language } = useSiteLanguage();
  const labels = footerLabels[language];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-[var(--app-border)] bg-[var(--app-surface)]/40 px-6 py-10 text-[var(--app-muted)] transition-colors duration-300 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <p className="font-brand text-xs tracking-[0.2em]">
            © {new Date().getFullYear()} MOONSILVER
          </p>
          <p className="text-[11px] opacity-60">{labels.madeWith}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://www.johnlin.top/"
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-full border border-[var(--app-border)] px-4 py-2 text-xs transition-all duration-300 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            <span className="relative z-10">johnlin</span>
            <span className="absolute inset-0 -translate-x-full bg-[var(--app-fg)]/5 transition-transform duration-300 group-hover:translate-x-0" />
          </a>

          <a
            href="https://www.hdu-wiki.cn/"
            target="_blank"
            rel="noreferrer"
            className="group relative overflow-hidden rounded-full border border-[var(--app-border)] px-4 py-2 text-xs transition-all duration-300 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            <span className="relative z-10">hdu-wiki</span>
            <span className="absolute inset-0 -translate-x-full bg-[var(--app-fg)]/5 transition-transform duration-300 group-hover:translate-x-0" />
          </a>

          <button
            type="button"
            onClick={scrollToTop}
            className="group relative overflow-hidden rounded-full border border-[var(--app-border)] px-4 py-2 text-xs transition-all duration-300 hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:-translate-y-0.5"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
              {labels.backToTop}
            </span>
            <span className="absolute inset-0 -translate-x-full bg-[var(--app-fg)]/5 transition-transform duration-300 group-hover:translate-x-0" />
          </button>
        </div>
      </div>
    </footer>
  );
}
