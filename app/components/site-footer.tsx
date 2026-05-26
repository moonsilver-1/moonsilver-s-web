"use client";

import { useSiteLanguage } from "@/app/components/language-provider";

const footerLabels = {
  zh: {
    friendSite: "友站",
  },
  en: {
    friendSite: "Friend site",
  },
} as const;

export function SiteFooter() {
  const { language } = useSiteLanguage();
  const labels = footerLabels[language];

  return (
    <footer className="border-t border-[var(--app-border)] bg-[var(--app-surface)]/60 px-6 py-8 text-[var(--app-muted)] transition-colors duration-300 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-xs tracking-widest">© {new Date().getFullYear()} MOONSILVER</p>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <a
            href="https://www.johnlin.top/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--app-border)] px-3 py-2 transition-colors hover:border-[var(--app-border-strong)] hover:text-[var(--app-fg)]"
          >
            {labels.friendSite}
          </a>
        </div>
      </div>
    </footer>
  );
}
